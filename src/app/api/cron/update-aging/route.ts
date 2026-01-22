import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()

    // Get all active leases with unpaid charges
    const leases = await prisma.lease.findMany({
      where: { status: "ACTIVE" },
      include: {
        rentCharges: {
          where: { status: { not: "PAID" } }
        },
        payments: {
          where: { status: { in: ["PENDING", "OVERDUE"] } }
        }
      }
    })

    let updatedCount = 0
    let createdCount = 0

    for (const lease of leases) {
      // Calculate aging buckets
      let current = 0
      let days30 = 0
      let days60 = 0
      let days90Plus = 0

      // Process rent charges
      for (const charge of lease.rentCharges) {
        const dueDate = new Date(charge.dueDate)
        const daysPastDue = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        const amountDue = charge.amount - charge.paidAmount

        if (daysPastDue <= 0) {
          current += amountDue
        } else if (daysPastDue <= 30) {
          current += amountDue
        } else if (daysPastDue <= 60) {
          days30 += amountDue
        } else if (daysPastDue <= 90) {
          days60 += amountDue
        } else {
          days90Plus += amountDue
        }
      }

      // Process pending payments
      for (const payment of lease.payments) {
        const dueDate = new Date(payment.dueDate)
        const daysPastDue = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysPastDue <= 0) {
          current += payment.amount
        } else if (daysPastDue <= 30) {
          current += payment.amount
        } else if (daysPastDue <= 60) {
          days30 += payment.amount
        } else if (daysPastDue <= 90) {
          days60 += payment.amount
        } else {
          days90Plus += payment.amount
        }
      }

      const totalDue = current + days30 + days60 + days90Plus

      // Upsert payment aging record
      const existing = await prisma.paymentAging.findUnique({
        where: { leaseId: lease.id }
      })

      if (existing) {
        await prisma.paymentAging.update({
          where: { leaseId: lease.id },
          data: {
            current,
            days30,
            days60,
            days90Plus,
            totalDue
          }
        })
        updatedCount++
      } else if (totalDue > 0) {
        await prisma.paymentAging.create({
          data: {
            leaseId: lease.id,
            current,
            days30,
            days60,
            days90Plus,
            totalDue
          }
        })
        createdCount++
      }
    }

    console.log(`Aging updated: ${updatedCount} updated, ${createdCount} created`)

    return NextResponse.json({
      success: true,
      message: "Payment aging updated successfully",
      leasesProcessed: leases.length,
      recordsUpdated: updatedCount,
      recordsCreated: createdCount
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
  }
}
