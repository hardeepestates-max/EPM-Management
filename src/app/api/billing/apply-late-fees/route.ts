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
    const { propertyId } = body

    const now = new Date()

    // Get all unpaid rent charges that are past due
    let chargeFilter: Record<string, unknown> = {
      status: { in: ["UNPAID", "PARTIAL"] },
      chargeType: "RENT",
      dueDate: { lt: now }
    }

    if (propertyId) {
      chargeFilter.lease = {
        unit: { propertyId }
      }
    }

    const unpaidCharges = await prisma.rentCharge.findMany({
      where: chargeFilter,
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: {
                  include: {
                    lateFeeConfig: true
                  }
                }
              }
            },
            rentCharges: {
              where: {
                chargeType: "LATE_FEE",
                createdAt: {
                  gte: new Date(now.getFullYear(), now.getMonth(), 1)
                }
              }
            }
          }
        }
      }
    })

    const lateFeesApplied = []
    const lateFeesSkipped = []

    // Default late fee config
    const defaultConfig = {
      gracePeriodDays: 5,
      feeType: "FLAT",
      feeAmount: 50,
      maxFeeAmount: null,
      isActive: true
    }

    for (const charge of unpaidCharges) {
      const property = charge.lease.unit.property
      const config = property.lateFeeConfig || defaultConfig

      if (!config.isActive) {
        lateFeesSkipped.push({
          chargeId: charge.id,
          unitNumber: charge.lease.unit.unitNumber,
          propertyName: property.name,
          reason: "Late fees disabled for property"
        })
        continue
      }

      // Calculate days past due
      const dueDate = new Date(charge.dueDate)
      const daysPastDue = Math.floor(
        (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Check if within grace period
      if (daysPastDue <= config.gracePeriodDays) {
        lateFeesSkipped.push({
          chargeId: charge.id,
          unitNumber: charge.lease.unit.unitNumber,
          propertyName: property.name,
          reason: `Within grace period (${daysPastDue}/${config.gracePeriodDays} days)`
        })
        continue
      }

      // Check if late fee already applied this month
      if (charge.lease.rentCharges.length > 0) {
        lateFeesSkipped.push({
          chargeId: charge.id,
          unitNumber: charge.lease.unit.unitNumber,
          propertyName: property.name,
          reason: "Late fee already applied this month"
        })
        continue
      }

      // Calculate late fee amount
      const unpaidAmount = charge.amount - charge.paidAmount
      let feeAmount: number

      if (config.feeType === "PERCENTAGE") {
        feeAmount = unpaidAmount * (config.feeAmount / 100)
        if (config.maxFeeAmount && feeAmount > config.maxFeeAmount) {
          feeAmount = config.maxFeeAmount
        }
      } else {
        feeAmount = config.feeAmount
      }

      // Create late fee charge
      const lateFee = await prisma.rentCharge.create({
        data: {
          leaseId: charge.leaseId,
          amount: feeAmount,
          dueDate: now,
          chargeType: "LATE_FEE",
          status: "UNPAID",
          paidAmount: 0
        }
      })

      lateFeesApplied.push({
        id: lateFee.id,
        chargeId: charge.id,
        leaseId: charge.leaseId,
        unitNumber: charge.lease.unit.unitNumber,
        propertyName: property.name,
        originalAmount: unpaidAmount,
        feeAmount,
        daysPastDue
      })
    }

    return NextResponse.json({
      success: true,
      date: now.toISOString(),
      chargesProcessed: unpaidCharges.length,
      lateFeesApplied: lateFeesApplied.length,
      lateFeesSkipped: lateFeesSkipped.length,
      totalFeesGenerated: lateFeesApplied.reduce((sum, f) => sum + f.feeAmount, 0),
      details: {
        applied: lateFeesApplied,
        skipped: lateFeesSkipped
      }
    })
  } catch (error) {
    console.error("Error applying late fees:", error)
    return NextResponse.json({ error: "Failed to apply late fees" }, { status: 500 })
  }
}
