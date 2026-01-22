import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month") // Format: YYYY-MM

    // Get property with units
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            leases: {
              where: { status: "ACTIVE" },
              include: {
                payments: true,
                rentCharges: true
              }
            }
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Calculate date range for the period
    const now = new Date()
    let startDate: Date
    let endDate: Date

    if (month) {
      const [year, monthNum] = month.split("-").map(Number)
      startDate = new Date(year, monthNum - 1, 1)
      endDate = new Date(year, monthNum, 0, 23, 59, 59)
    } else {
      // Default to current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    // Calculate financial metrics
    let totalUnits = property.units.length
    let occupiedUnits = 0
    let totalRentExpected = 0
    let totalRentCollected = 0
    let totalPending = 0
    let totalOverdue = 0

    for (const unit of property.units) {
      const activeLease = unit.leases.find(l => l.status === "ACTIVE")

      if (activeLease) {
        occupiedUnits++
        totalRentExpected += activeLease.rentAmount

        // Check rent charges for the period
        const periodCharges = activeLease.rentCharges.filter(charge => {
          const chargeDate = new Date(charge.dueDate)
          return chargeDate >= startDate && chargeDate <= endDate
        })

        // If no rent charges exist, check payments directly
        if (periodCharges.length > 0) {
          for (const charge of periodCharges) {
            if (charge.status === "PAID") {
              totalRentCollected += charge.amount
            } else if (charge.status === "PARTIAL") {
              totalRentCollected += charge.paidAmount
              const remaining = charge.amount - charge.paidAmount
              if (new Date(charge.dueDate) < now) {
                totalOverdue += remaining
              } else {
                totalPending += remaining
              }
            } else {
              if (new Date(charge.dueDate) < now) {
                totalOverdue += charge.amount
              } else {
                totalPending += charge.amount
              }
            }
          }
        } else {
          // Fallback to payments table
          const periodPayments = activeLease.payments.filter(payment => {
            const paymentDue = new Date(payment.dueDate)
            return paymentDue >= startDate && paymentDue <= endDate
          })

          for (const payment of periodPayments) {
            if (payment.status === "COMPLETED" || payment.status === "PAID") {
              totalRentCollected += payment.amount
            } else if (payment.status === "PENDING") {
              if (new Date(payment.dueDate) < now) {
                totalOverdue += payment.amount
              } else {
                totalPending += payment.amount
              }
            }
          }

          // If no payments in period, add expected rent to pending/overdue
          if (periodPayments.length === 0) {
            if (startDate < now) {
              totalOverdue += activeLease.rentAmount
            } else {
              totalPending += activeLease.rentAmount
            }
          }
        }
      }
    }

    // Calculate vacancy loss (potential rent from vacant units)
    const vacantUnits = totalUnits - occupiedUnits
    const avgRent = totalUnits > 0
      ? property.units.reduce((sum, u) => sum + u.rentAmount, 0) / totalUnits
      : 0
    const vacancyLoss = vacantUnits * avgRent

    // Occupancy rate
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0

    // Collection rate
    const collectionRate = totalRentExpected > 0
      ? (totalRentCollected / totalRentExpected) * 100
      : 0

    return NextResponse.json({
      summary: {
        totalUnits,
        occupiedUnits,
        vacantUnits,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        totalRentExpected,
        totalRentCollected,
        totalPending,
        totalOverdue,
        vacancyLoss,
        collectionRate: Math.round(collectionRate * 10) / 10,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    })
  } catch (error) {
    console.error("Error fetching financial summary:", error)
    return NextResponse.json({ error: "Failed to fetch financial summary" }, { status: 500 })
  }
}
