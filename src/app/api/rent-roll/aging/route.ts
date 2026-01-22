import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get("propertyId")
    const ownerId = searchParams.get("ownerId")

    // Build property filter based on role
    let propertyFilter: Record<string, unknown> = {}

    if (session.user.role === "OWNER") {
      propertyFilter.ownerId = session.user.id
    } else if (session.user.role === "ADMIN") {
      if (propertyId) {
        propertyFilter.id = propertyId
      }
      if (ownerId) {
        propertyFilter.ownerId = ownerId
      }
    } else {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get all active leases with payment info
    const properties = await prisma.property.findMany({
      where: {
        ...propertyFilter,
        status: "ACTIVE"
      },
      include: {
        units: {
          include: {
            leases: {
              where: { status: "ACTIVE" },
              include: {
                tenant: {
                  select: { id: true, name: true, email: true }
                },
                rentCharges: {
                  where: { status: { not: "PAID" } }
                },
                payments: {
                  where: {
                    status: { in: ["PENDING", "OVERDUE"] }
                  }
                },
                paymentAging: true
              }
            }
          }
        }
      }
    })

    const now = new Date()

    // Build aging buckets
    const agingBuckets = {
      current: { count: 0, amount: 0, tenants: [] as Array<{
        propertyName: string
        unitNumber: string
        tenantName: string
        tenantEmail: string
        amount: number
        leaseId: string
      }> },
      days30: { count: 0, amount: 0, tenants: [] as Array<{
        propertyName: string
        unitNumber: string
        tenantName: string
        tenantEmail: string
        amount: number
        leaseId: string
      }> },
      days60: { count: 0, amount: 0, tenants: [] as Array<{
        propertyName: string
        unitNumber: string
        tenantName: string
        tenantEmail: string
        amount: number
        leaseId: string
      }> },
      days90Plus: { count: 0, amount: 0, tenants: [] as Array<{
        propertyName: string
        unitNumber: string
        tenantName: string
        tenantEmail: string
        amount: number
        leaseId: string
      }> }
    }

    for (const property of properties) {
      for (const unit of property.units) {
        for (const lease of unit.leases) {
          if (!lease.tenant) continue

          let tenantAging = {
            current: 0,
            days30: 0,
            days60: 0,
            days90Plus: 0
          }

          // Use stored aging if available
          if (lease.paymentAging) {
            tenantAging = {
              current: lease.paymentAging.current,
              days30: lease.paymentAging.days30,
              days60: lease.paymentAging.days60,
              days90Plus: lease.paymentAging.days90Plus
            }
          } else {
            // Calculate from rent charges
            for (const charge of lease.rentCharges) {
              const dueDate = new Date(charge.dueDate)
              const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
              const amountDue = charge.amount - charge.paidAmount

              if (daysPastDue <= 0) {
                tenantAging.current += amountDue
              } else if (daysPastDue <= 30) {
                tenantAging.current += amountDue
              } else if (daysPastDue <= 60) {
                tenantAging.days30 += amountDue
              } else if (daysPastDue <= 90) {
                tenantAging.days60 += amountDue
              } else {
                tenantAging.days90Plus += amountDue
              }
            }

            // Also check unpaid payments
            for (const payment of lease.payments) {
              const dueDate = new Date(payment.dueDate)
              const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

              if (daysPastDue <= 0) {
                tenantAging.current += payment.amount
              } else if (daysPastDue <= 30) {
                tenantAging.current += payment.amount
              } else if (daysPastDue <= 60) {
                tenantAging.days30 += payment.amount
              } else if (daysPastDue <= 90) {
                tenantAging.days60 += payment.amount
              } else {
                tenantAging.days90Plus += payment.amount
              }
            }
          }

          // Add to buckets
          const tenantInfo = {
            propertyName: property.name,
            unitNumber: unit.unitNumber,
            tenantName: lease.tenant.name,
            tenantEmail: lease.tenant.email,
            leaseId: lease.id
          }

          if (tenantAging.current > 0) {
            agingBuckets.current.count++
            agingBuckets.current.amount += tenantAging.current
            agingBuckets.current.tenants.push({
              ...tenantInfo,
              amount: tenantAging.current
            })
          }

          if (tenantAging.days30 > 0) {
            agingBuckets.days30.count++
            agingBuckets.days30.amount += tenantAging.days30
            agingBuckets.days30.tenants.push({
              ...tenantInfo,
              amount: tenantAging.days30
            })
          }

          if (tenantAging.days60 > 0) {
            agingBuckets.days60.count++
            agingBuckets.days60.amount += tenantAging.days60
            agingBuckets.days60.tenants.push({
              ...tenantInfo,
              amount: tenantAging.days60
            })
          }

          if (tenantAging.days90Plus > 0) {
            agingBuckets.days90Plus.count++
            agingBuckets.days90Plus.amount += tenantAging.days90Plus
            agingBuckets.days90Plus.tenants.push({
              ...tenantInfo,
              amount: tenantAging.days90Plus
            })
          }
        }
      }
    }

    // Sort tenants by amount in each bucket (highest first)
    agingBuckets.current.tenants.sort((a, b) => b.amount - a.amount)
    agingBuckets.days30.tenants.sort((a, b) => b.amount - a.amount)
    agingBuckets.days60.tenants.sort((a, b) => b.amount - a.amount)
    agingBuckets.days90Plus.tenants.sort((a, b) => b.amount - a.amount)

    // Calculate summary
    const totalOutstanding =
      agingBuckets.current.amount +
      agingBuckets.days30.amount +
      agingBuckets.days60.amount +
      agingBuckets.days90Plus.amount

    const summary = {
      totalOutstanding,
      delinquencyRate: totalOutstanding > 0
        ? Math.round((
            (agingBuckets.days30.amount + agingBuckets.days60.amount + agingBuckets.days90Plus.amount)
            / totalOutstanding
          ) * 1000) / 10
        : 0,
      criticalCount: agingBuckets.days60.count + agingBuckets.days90Plus.count,
      criticalAmount: agingBuckets.days60.amount + agingBuckets.days90Plus.amount
    }

    return NextResponse.json({
      aging: agingBuckets,
      summary
    })
  } catch (error) {
    console.error("Error fetching aging analysis:", error)
    return NextResponse.json({ error: "Failed to fetch aging analysis" }, { status: 500 })
  }
}
