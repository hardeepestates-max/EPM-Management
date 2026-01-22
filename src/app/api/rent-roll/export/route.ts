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
    const format = searchParams.get("format") || "csv"

    // Build property filter based on role
    let propertyFilter: Record<string, unknown> = {}

    if (session.user.role === "OWNER") {
      propertyFilter.ownerId = session.user.id
    } else if (session.user.role === "ADMIN") {
      if (propertyId) {
        propertyFilter.id = propertyId
      }
    } else {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get all properties with units and leases
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
                  select: { id: true, name: true, email: true, phone: true }
                },
                payments: {
                  orderBy: { dueDate: "desc" },
                  take: 1,
                  where: { status: { in: ["COMPLETED", "PAID"] } }
                },
                paymentAging: true
              }
            }
          },
          orderBy: { unitNumber: "asc" }
        }
      },
      orderBy: { name: "asc" }
    })

    const now = new Date()
    const rows: string[][] = []

    // CSV Header
    rows.push([
      "Property",
      "Address",
      "Unit",
      "Status",
      "Beds",
      "Baths",
      "Sq Ft",
      "Market Rent",
      "Lease Rent",
      "Tenant Name",
      "Tenant Email",
      "Tenant Phone",
      "Lease Start",
      "Lease End",
      "Current Balance",
      "0-30 Days",
      "31-60 Days",
      "61-90 Days",
      "90+ Days",
      "Last Payment Date",
      "Last Payment Amount"
    ])

    for (const property of properties) {
      for (const unit of property.units) {
        const activeLease = unit.leases.find(l => l.status === "ACTIVE")

        // Calculate aging
        let aging = { current: 0, days30: 0, days60: 0, days90Plus: 0 }
        let totalBalance = 0

        if (activeLease?.paymentAging) {
          aging = {
            current: activeLease.paymentAging.current,
            days30: activeLease.paymentAging.days30,
            days60: activeLease.paymentAging.days60,
            days90Plus: activeLease.paymentAging.days90Plus
          }
          totalBalance = activeLease.paymentAging.totalDue
        }

        const lastPayment = activeLease?.payments[0]

        const formatDate = (date: Date | null) => {
          if (!date) return ""
          return new Date(date).toLocaleDateString("en-US")
        }

        const formatCurrency = (amount: number | null) => {
          if (amount === null || amount === undefined) return ""
          return amount.toFixed(2)
        }

        rows.push([
          property.name,
          `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`,
          unit.unitNumber,
          unit.status,
          unit.bedrooms.toString(),
          unit.bathrooms.toString(),
          unit.sqft?.toString() || "",
          formatCurrency(unit.rentAmount),
          formatCurrency(activeLease?.rentAmount || null),
          activeLease?.tenant?.name || "",
          activeLease?.tenant?.email || "",
          activeLease?.tenant?.phone || "",
          formatDate(activeLease?.startDate || null),
          formatDate(activeLease?.endDate || null),
          formatCurrency(totalBalance),
          formatCurrency(aging.current),
          formatCurrency(aging.days30),
          formatCurrency(aging.days60),
          formatCurrency(aging.days90Plus),
          formatDate(lastPayment?.paidDate || null),
          formatCurrency(lastPayment?.amount || null)
        ])
      }
    }

    if (format === "csv") {
      // Convert to CSV
      const csv = rows.map(row =>
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma
          if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
            return `"${cell.replace(/"/g, '""')}"`
          }
          return cell
        }).join(",")
      ).join("\n")

      const filename = propertyId
        ? `rent-roll-${propertyId}-${new Date().toISOString().split("T")[0]}.csv`
        : `rent-roll-portfolio-${new Date().toISOString().split("T")[0]}.csv`

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`
        }
      })
    }

    // Return JSON for other formats
    return NextResponse.json({ rows })
  } catch (error) {
    console.error("Error exporting rent roll:", error)
    return NextResponse.json({ error: "Failed to export rent roll" }, { status: 500 })
  }
}
