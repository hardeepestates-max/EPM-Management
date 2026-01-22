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
    const monthsAhead = parseInt(searchParams.get("months") || "6")

    // Get property with active leases
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            leases: {
              where: { status: "ACTIVE" },
              include: {
                tenant: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    const now = new Date()
    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + monthsAhead)

    // Find leases expiring within the timeframe
    const expiringLeases = []

    for (const unit of property.units) {
      for (const lease of unit.leases) {
        const endDate = new Date(lease.endDate)
        if (endDate >= now && endDate <= futureDate) {
          const daysUntilExpiry = Math.ceil(
            (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )

          let urgency: "critical" | "warning" | "notice"
          if (daysUntilExpiry <= 30) {
            urgency = "critical"
          } else if (daysUntilExpiry <= 60) {
            urgency = "warning"
          } else {
            urgency = "notice"
          }

          expiringLeases.push({
            leaseId: lease.id,
            unitId: unit.id,
            unitNumber: unit.unitNumber,
            tenant: lease.tenant,
            leaseStart: lease.startDate,
            leaseEnd: lease.endDate,
            rentAmount: lease.rentAmount,
            daysUntilExpiry,
            urgency,
            monthYear: `${endDate.toLocaleString('default', { month: 'short' })} ${endDate.getFullYear()}`
          })
        }
      }
    }

    // Sort by expiration date (soonest first)
    expiringLeases.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)

    // Group by month for timeline view
    const byMonth: Record<string, typeof expiringLeases> = {}
    for (const lease of expiringLeases) {
      if (!byMonth[lease.monthYear]) {
        byMonth[lease.monthYear] = []
      }
      byMonth[lease.monthYear].push(lease)
    }

    // Calculate summary stats
    const summary = {
      total: expiringLeases.length,
      critical: expiringLeases.filter(l => l.urgency === "critical").length,
      warning: expiringLeases.filter(l => l.urgency === "warning").length,
      notice: expiringLeases.filter(l => l.urgency === "notice").length,
      totalRentAtRisk: expiringLeases.reduce((sum, l) => sum + l.rentAmount, 0)
    }

    return NextResponse.json({
      expirations: expiringLeases,
      byMonth,
      summary,
      lookAheadMonths: monthsAhead
    })
  } catch (error) {
    console.error("Error fetching lease expirations:", error)
    return NextResponse.json({ error: "Failed to fetch lease expirations" }, { status: 500 })
  }
}
