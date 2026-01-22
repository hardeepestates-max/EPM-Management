import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "month" // month, quarter, year
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString())

    // Calculate date range based on period
    let startDate: Date
    let endDate: Date

    if (period === "month") {
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0, 23, 59, 59)
    } else if (period === "quarter") {
      const quarter = Math.ceil(month / 3)
      startDate = new Date(year, (quarter - 1) * 3, 1)
      endDate = new Date(year, quarter * 3, 0, 23, 59, 59)
    } else {
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59)
    }

    // Get all paid invoices in the period (management fee revenue)
    const invoices = await prisma.invoice.findMany({
      where: {
        status: "PAID",
        paidDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        lineItems: true
      }
    })

    // Get EPM operating expenses (expenses without propertyId)
    const operatingExpenses = await prisma.expense.findMany({
      where: {
        propertyId: null,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate revenue by type
    const revenue = {
      managementFees: 0,
      flatFees: 0,
      otherFees: 0
    }

    // Calculate expenses by category
    const expenses = {
      payroll: 0,
      software: 0,
      marketing: 0,
      office: 0,
      insurance: 0,
      other: 0
    }

    // Revenue breakdown by owner
    const ownerBreakdown: Record<string, {
      ownerId: string
      ownerName: string
      managementFees: number
      otherFees: number
      totalRevenue: number
      invoiceCount: number
    }> = {}

    for (const invoice of invoices) {
      const ownerId = invoice.ownerId

      if (!ownerBreakdown[ownerId]) {
        ownerBreakdown[ownerId] = {
          ownerId,
          ownerName: invoice.owner.name,
          managementFees: 0,
          otherFees: 0,
          totalRevenue: 0,
          invoiceCount: 0
        }
      }

      ownerBreakdown[ownerId].invoiceCount++

      for (const item of invoice.lineItems) {
        if (item.type === "management_fee") {
          revenue.managementFees += item.amount
          ownerBreakdown[ownerId].managementFees += item.amount
        } else if (item.type === "flat_fee") {
          revenue.flatFees += item.amount
          ownerBreakdown[ownerId].otherFees += item.amount
        } else {
          revenue.otherFees += item.amount
          ownerBreakdown[ownerId].otherFees += item.amount
        }
        ownerBreakdown[ownerId].totalRevenue += item.amount
      }
    }

    // Categorize operating expenses
    for (const expense of operatingExpenses) {
      const category = expense.category.toLowerCase()
      if (category.includes("payroll") || category.includes("salary")) {
        expenses.payroll += expense.amount
      } else if (category.includes("software") || category.includes("tech")) {
        expenses.software += expense.amount
      } else if (category.includes("marketing") || category.includes("advertising")) {
        expenses.marketing += expense.amount
      } else if (category.includes("office") || category.includes("rent")) {
        expenses.office += expense.amount
      } else if (category.includes("insurance")) {
        expenses.insurance += expense.amount
      } else {
        expenses.other += expense.amount
      }
    }

    // Calculate totals
    const totalRevenue = revenue.managementFees + revenue.flatFees + revenue.otherFees
    const totalExpenses =
      expenses.payroll +
      expenses.software +
      expenses.marketing +
      expenses.office +
      expenses.insurance +
      expenses.other
    const netProfit = totalRevenue - totalExpenses

    // Monthly trend data (last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const trendDate = new Date(year, month - 1 - i, 1)
      const trendEndDate = new Date(trendDate.getFullYear(), trendDate.getMonth() + 1, 0, 23, 59, 59)

      const monthInvoices = await prisma.invoice.findMany({
        where: {
          status: "PAID",
          paidDate: {
            gte: trendDate,
            lte: trendEndDate
          }
        },
        include: { lineItems: true }
      })

      let monthRevenue = 0
      for (const inv of monthInvoices) {
        for (const item of inv.lineItems) {
          monthRevenue += item.amount
        }
      }

      monthlyTrend.push({
        month: trendDate.toLocaleString("default", { month: "short" }),
        year: trendDate.getFullYear(),
        revenue: monthRevenue
      })
    }

    // Get total managed properties and owners
    const propertyCount = await prisma.property.count({
      where: { status: "ACTIVE" }
    })

    const ownerCount = await prisma.user.count({
      where: { role: "OWNER" }
    })

    return NextResponse.json({
      report: {
        period: {
          type: period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          label: period === "month"
            ? `${startDate.toLocaleString("default", { month: "long" })} ${year}`
            : period === "quarter"
            ? `Q${Math.ceil(month / 3)} ${year}`
            : `${year}`
        },
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin: totalRevenue > 0
            ? Math.round((netProfit / totalRevenue) * 1000) / 10
            : 0,
          invoiceCount: invoices.length,
          avgRevenuePerOwner: Object.keys(ownerBreakdown).length > 0
            ? Math.round(totalRevenue / Object.keys(ownerBreakdown).length)
            : 0
        },
        revenue,
        expenses,
        ownerBreakdown: Object.values(ownerBreakdown).sort(
          (a, b) => b.totalRevenue - a.totalRevenue
        ),
        monthlyTrend,
        metrics: {
          activeProperties: propertyCount,
          activeOwners: ownerCount,
          avgFeePerProperty: propertyCount > 0
            ? Math.round(revenue.managementFees / propertyCount)
            : 0
        }
      }
    })
  } catch (error) {
    console.error("Error generating EPM P&L:", error)
    return NextResponse.json({ error: "Failed to generate P&L report" }, { status: 500 })
  }
}
