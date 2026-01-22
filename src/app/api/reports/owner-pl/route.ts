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
    const ownerId = searchParams.get("ownerId")
    const period = searchParams.get("period") || "month" // month, quarter, year
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString())

    // Determine the actual owner ID
    let targetOwnerId = ownerId
    if (session.user.role === "OWNER") {
      targetOwnerId = session.user.id
    } else if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (!targetOwnerId) {
      return NextResponse.json({ error: "Owner ID required" }, { status: 400 })
    }

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

    // Get owner's properties
    const properties = await prisma.property.findMany({
      where: {
        ownerId: targetOwnerId,
        status: "ACTIVE"
      },
      include: {
        units: {
          include: {
            leases: {
              where: { status: "ACTIVE" },
              include: {
                payments: {
                  where: {
                    status: { in: ["COMPLETED", "PAID"] },
                    paidDate: {
                      gte: startDate,
                      lte: endDate
                    }
                  }
                },
                rentCharges: {
                  where: {
                    status: "PAID",
                    updatedAt: {
                      gte: startDate,
                      lte: endDate
                    }
                  }
                }
              }
            }
          }
        },
        expenses: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    })

    // Get owner's invoices (management fees paid to EPM)
    const invoices = await prisma.invoice.findMany({
      where: {
        ownerId: targetOwnerId,
        status: "PAID",
        paidDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        lineItems: true
      }
    })

    // Calculate income
    const income = {
      rentCollected: 0,
      lateFees: 0,
      otherIncome: 0
    }

    // Calculate expenses by category
    const expenses = {
      managementFees: 0,
      maintenance: 0,
      repairs: 0,
      utilities: 0,
      insurance: 0,
      taxes: 0,
      other: 0
    }

    // Property-level breakdown
    const propertyBreakdown = []

    for (const property of properties) {
      let propertyIncome = 0
      let propertyExpenses = 0

      for (const unit of property.units) {
        for (const lease of unit.leases) {
          // Income from payments
          for (const payment of lease.payments) {
            propertyIncome += payment.amount
            income.rentCollected += payment.amount
          }

          // Income from rent charges
          for (const charge of lease.rentCharges) {
            if (charge.chargeType === "LATE_FEE") {
              income.lateFees += charge.paidAmount
            }
          }
        }
      }

      // Property expenses
      for (const expense of property.expenses) {
        propertyExpenses += expense.amount

        switch (expense.category) {
          case "MAINTENANCE":
            expenses.maintenance += expense.amount
            break
          case "REPAIR":
            expenses.repairs += expense.amount
            break
          case "UTILITY":
            expenses.utilities += expense.amount
            break
          case "INSURANCE":
            expenses.insurance += expense.amount
            break
          case "TAX":
            expenses.taxes += expense.amount
            break
          default:
            expenses.other += expense.amount
        }
      }

      propertyBreakdown.push({
        propertyId: property.id,
        propertyName: property.name,
        address: `${property.address}, ${property.city}, ${property.state}`,
        totalUnits: property.units.length,
        occupiedUnits: property.units.filter(u =>
          u.leases.some(l => l.status === "ACTIVE")
        ).length,
        income: propertyIncome,
        expenses: propertyExpenses,
        noi: propertyIncome - propertyExpenses
      })
    }

    // Management fees from invoices
    for (const invoice of invoices) {
      for (const item of invoice.lineItems) {
        if (item.type === "management_fee") {
          expenses.managementFees += item.amount
        }
      }
    }

    // Calculate totals
    const totalIncome = income.rentCollected + income.lateFees + income.otherIncome
    const totalExpenses =
      expenses.managementFees +
      expenses.maintenance +
      expenses.repairs +
      expenses.utilities +
      expenses.insurance +
      expenses.taxes +
      expenses.other
    const netOperatingIncome = totalIncome - totalExpenses

    // Get owner info
    const owner = await prisma.user.findUnique({
      where: { id: targetOwnerId },
      select: { id: true, name: true, email: true }
    })

    return NextResponse.json({
      report: {
        owner,
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
          totalIncome,
          totalExpenses,
          netOperatingIncome,
          profitMargin: totalIncome > 0
            ? Math.round((netOperatingIncome / totalIncome) * 1000) / 10
            : 0
        },
        income,
        expenses,
        propertyBreakdown,
        propertyCount: properties.length
      }
    })
  } catch (error) {
    console.error("Error generating owner P&L:", error)
    return NextResponse.json({ error: "Failed to generate P&L report" }, { status: 500 })
  }
}
