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
    const status = searchParams.get("status") // all, current, overdue

    // Get property with units and lease details
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            leases: {
              include: {
                tenant: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                  }
                },
                payments: {
                  orderBy: { dueDate: "desc" },
                  take: 12 // Last 12 months
                },
                rentCharges: {
                  orderBy: { dueDate: "desc" },
                  take: 12
                },
                paymentAging: true
              }
            },
            tenantInvites: {
              where: { status: "PENDING" },
              take: 1
            }
          },
          orderBy: { unitNumber: "asc" }
        }
      }
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Build rent roll data
    const rentRoll = property.units.map(unit => {
      const activeLease = unit.leases.find(l => l.status === "ACTIVE")
      const pendingInvite = unit.tenantInvites[0]

      if (!activeLease) {
        return {
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          status: unit.status,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          sqft: unit.sqft,
          marketRent: unit.rentAmount,
          leaseRent: null,
          tenant: null,
          leaseStart: null,
          leaseEnd: null,
          currentBalance: 0,
          lastPaymentDate: null,
          lastPaymentAmount: null,
          pendingInvite: pendingInvite ? {
            email: pendingInvite.email,
            status: pendingInvite.status
          } : null,
          aging: {
            current: 0,
            days30: 0,
            days60: 0,
            days90Plus: 0
          }
        }
      }

      // Calculate current balance
      let currentBalance = 0
      const aging = {
        current: 0,
        days30: 0,
        days60: 0,
        days90Plus: 0
      }

      // Use payment aging if available
      if (activeLease.paymentAging) {
        aging.current = activeLease.paymentAging.current
        aging.days30 = activeLease.paymentAging.days30
        aging.days60 = activeLease.paymentAging.days60
        aging.days90Plus = activeLease.paymentAging.days90Plus
        currentBalance = activeLease.paymentAging.totalDue
      } else {
        // Calculate from rent charges or payments
        const unpaidCharges = activeLease.rentCharges.filter(c =>
          c.status !== "PAID"
        )

        for (const charge of unpaidCharges) {
          const dueDate = new Date(charge.dueDate)
          const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          const amountDue = charge.amount - charge.paidAmount

          if (daysPastDue <= 0) {
            aging.current += amountDue
          } else if (daysPastDue <= 30) {
            aging.current += amountDue
          } else if (daysPastDue <= 60) {
            aging.days30 += amountDue
          } else if (daysPastDue <= 90) {
            aging.days60 += amountDue
          } else {
            aging.days90Plus += amountDue
          }
          currentBalance += amountDue
        }

        // Also check unpaid payments
        if (unpaidCharges.length === 0) {
          const unpaidPayments = activeLease.payments.filter(p =>
            p.status === "PENDING" || p.status === "OVERDUE"
          )

          for (const payment of unpaidPayments) {
            const dueDate = new Date(payment.dueDate)
            const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

            if (daysPastDue <= 0) {
              aging.current += payment.amount
            } else if (daysPastDue <= 30) {
              aging.current += payment.amount
            } else if (daysPastDue <= 60) {
              aging.days30 += payment.amount
            } else if (daysPastDue <= 90) {
              aging.days60 += payment.amount
            } else {
              aging.days90Plus += payment.amount
            }
            currentBalance += payment.amount
          }
        }
      }

      // Get last payment info
      const lastPayment = activeLease.payments.find(p =>
        p.status === "COMPLETED" || p.status === "PAID"
      )

      return {
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        status: unit.status,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        sqft: unit.sqft,
        marketRent: unit.rentAmount,
        leaseRent: activeLease.rentAmount,
        tenant: activeLease.tenant,
        leaseId: activeLease.id,
        leaseStart: activeLease.startDate,
        leaseEnd: activeLease.endDate,
        currentBalance,
        lastPaymentDate: lastPayment?.paidDate || null,
        lastPaymentAmount: lastPayment?.amount || null,
        pendingInvite: null,
        aging
      }
    })

    // Apply status filter
    let filteredRentRoll = rentRoll
    if (status === "current") {
      filteredRentRoll = rentRoll.filter(r => r.currentBalance === 0 && r.tenant)
    } else if (status === "overdue") {
      filteredRentRoll = rentRoll.filter(r => r.currentBalance > 0)
    }

    // Calculate totals
    const totals = {
      totalUnits: rentRoll.length,
      occupiedUnits: rentRoll.filter(r => r.tenant).length,
      totalMarketRent: rentRoll.reduce((sum, r) => sum + r.marketRent, 0),
      totalLeaseRent: rentRoll.reduce((sum, r) => sum + (r.leaseRent || 0), 0),
      totalBalance: rentRoll.reduce((sum, r) => sum + r.currentBalance, 0),
      agingTotals: {
        current: rentRoll.reduce((sum, r) => sum + r.aging.current, 0),
        days30: rentRoll.reduce((sum, r) => sum + r.aging.days30, 0),
        days60: rentRoll.reduce((sum, r) => sum + r.aging.days60, 0),
        days90Plus: rentRoll.reduce((sum, r) => sum + r.aging.days90Plus, 0)
      }
    }

    return NextResponse.json({
      rentRoll: filteredRentRoll,
      totals
    })
  } catch (error) {
    console.error("Error fetching rent roll:", error)
    return NextResponse.json({ error: "Failed to fetch rent roll" }, { status: 500 })
  }
}
