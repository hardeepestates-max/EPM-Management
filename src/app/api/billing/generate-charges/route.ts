import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Allow both authenticated admin users and cron jobs (via secret)
    const { searchParams } = new URL(req.url)
    const cronSecret = searchParams.get("secret")
    const isValidCron = cronSecret === process.env.CRON_SECRET

    if (!session && !isValidCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const { propertyId, month, year } = body

    // Default to current month if not specified
    const now = new Date()
    const targetMonth = month || now.getMonth() + 1
    const targetYear = year || now.getFullYear()

    // Calculate the first day of the target month
    const chargeDate = new Date(targetYear, targetMonth - 1, 1)

    // Get active leases
    let leaseFilter: Record<string, unknown> = {
      status: "ACTIVE",
      startDate: { lte: chargeDate },
      OR: [
        { endDate: { gte: chargeDate } },
        { endDate: null }
      ]
    }

    if (propertyId) {
      leaseFilter.unit = { propertyId }
    }

    const leases = await prisma.lease.findMany({
      where: leaseFilter,
      include: {
        unit: {
          include: {
            property: true
          }
        },
        recurringCharges: {
          where: { isActive: true }
        },
        rentCharges: {
          where: {
            dueDate: {
              gte: new Date(targetYear, targetMonth - 1, 1),
              lt: new Date(targetYear, targetMonth, 1)
            }
          }
        }
      }
    })

    const chargesCreated = []
    const chargesSkipped = []

    for (const lease of leases) {
      // Check if rent charge already exists for this month
      const existingRentCharge = lease.rentCharges.find(
        c => c.chargeType === "RENT"
      )

      if (existingRentCharge) {
        chargesSkipped.push({
          leaseId: lease.id,
          unitNumber: lease.unit.unitNumber,
          propertyName: lease.unit.property.name,
          reason: "Rent charge already exists for this month"
        })
        continue
      }

      // Determine day of month for charge (default to 1st)
      const rentRecurring = lease.recurringCharges.find(
        c => c.chargeType === "RENT"
      )
      const dayOfMonth = rentRecurring?.dayOfMonth || 1

      // Create rent charge
      const dueDate = new Date(targetYear, targetMonth - 1, dayOfMonth)

      const rentCharge = await prisma.rentCharge.create({
        data: {
          leaseId: lease.id,
          amount: lease.rentAmount,
          dueDate,
          chargeType: "RENT",
          status: "UNPAID",
          paidAmount: 0
        }
      })

      chargesCreated.push({
        id: rentCharge.id,
        leaseId: lease.id,
        unitNumber: lease.unit.unitNumber,
        propertyName: lease.unit.property.name,
        amount: lease.rentAmount,
        dueDate
      })

      // Create additional recurring charges (utilities, parking, etc.)
      for (const recurring of lease.recurringCharges) {
        if (recurring.chargeType === "RENT") continue // Already handled

        const existingCharge = lease.rentCharges.find(
          c => c.chargeType === recurring.chargeType
        )

        if (!existingCharge) {
          const additionalDueDate = new Date(
            targetYear,
            targetMonth - 1,
            recurring.dayOfMonth
          )

          const additionalCharge = await prisma.rentCharge.create({
            data: {
              leaseId: lease.id,
              amount: recurring.amount,
              dueDate: additionalDueDate,
              chargeType: recurring.chargeType,
              status: "UNPAID",
              paidAmount: 0
            }
          })

          chargesCreated.push({
            id: additionalCharge.id,
            leaseId: lease.id,
            unitNumber: lease.unit.unitNumber,
            propertyName: lease.unit.property.name,
            amount: recurring.amount,
            chargeType: recurring.chargeType,
            dueDate: additionalDueDate
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      period: `${targetYear}-${String(targetMonth).padStart(2, "0")}`,
      leasesProcessed: leases.length,
      chargesCreated: chargesCreated.length,
      chargesSkipped: chargesSkipped.length,
      details: {
        created: chargesCreated,
        skipped: chargesSkipped
      }
    })
  } catch (error) {
    console.error("Error generating charges:", error)
    return NextResponse.json({ error: "Failed to generate charges" }, { status: 500 })
  }
}
