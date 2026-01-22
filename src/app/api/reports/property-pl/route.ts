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
    const period = searchParams.get("period") || "month"
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString())

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID required" }, { status: 400 })
    }

    // Calculate date range
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

    // Get property with all related data
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        units: {
          include: {
            leases: {
              include: {
                tenant: {
                  select: { id: true, name: true }
                },
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

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Check access - owner can only see their own properties
    if (session.user.role === "OWNER" && property.owner.id !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Calculate income
    const income = {
      rentCollected: 0,
      lateFees: 0,
      otherIncome: 0,
      byUnit: [] as Array<{
        unitNumber: string
        tenantName: string | null
        rentCollected: number
        lateFees: number
      }>
    }

    // Calculate expenses by category
    const expenses = {
      maintenance: 0,
      repairs: 0,
      utilities: 0,
      insurance: 0,
      taxes: 0,
      managementFee: 0,
      other: 0,
      details: [] as Array<{
        date: Date
        category: string
        description: string | null
        amount: number
        vendor: string | null
      }>
    }

    // Process units and income
    for (const unit of property.units) {
      let unitRent = 0
      let unitLateFees = 0
      let tenantName: string | null = null

      for (const lease of unit.leases) {
        tenantName = lease.tenant?.name || null

        for (const payment of lease.payments) {
          unitRent += payment.amount
          income.rentCollected += payment.amount
        }

        for (const charge of lease.rentCharges) {
          if (charge.chargeType === "LATE_FEE" && charge.status === "PAID") {
            unitLateFees += charge.paidAmount
            income.lateFees += charge.paidAmount
          }
        }
      }

      income.byUnit.push({
        unitNumber: unit.unitNumber,
        tenantName,
        rentCollected: unitRent,
        lateFees: unitLateFees
      })
    }

    // Process expenses
    for (const expense of property.expenses) {
      expenses.details.push({
        date: expense.date,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        vendor: expense.vendorName
      })

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
        case "MANAGEMENT_FEE":
          expenses.managementFee += expense.amount
          break
        default:
          expenses.other += expense.amount
      }
    }

    // Calculate totals
    const totalIncome = income.rentCollected + income.lateFees + income.otherIncome
    const totalExpenses =
      expenses.maintenance +
      expenses.repairs +
      expenses.utilities +
      expenses.insurance +
      expenses.taxes +
      expenses.managementFee +
      expenses.other
    const netOperatingIncome = totalIncome - totalExpenses

    // Calculate occupancy metrics
    const totalUnits = property.units.length
    const occupiedUnits = property.units.filter(u =>
      u.leases.some(l => l.status === "ACTIVE")
    ).length
    const potentialRent = property.units.reduce((sum, u) => sum + u.rentAmount, 0)
    const vacancyLoss = (totalUnits - occupiedUnits) * (potentialRent / totalUnits || 0)

    return NextResponse.json({
      report: {
        property: {
          id: property.id,
          name: property.name,
          address: `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`,
          owner: property.owner
        },
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
        expenses: {
          ...expenses,
          details: expenses.details.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        },
        metrics: {
          totalUnits,
          occupiedUnits,
          occupancyRate: totalUnits > 0
            ? Math.round((occupiedUnits / totalUnits) * 1000) / 10
            : 0,
          potentialRent,
          vacancyLoss
        }
      }
    })
  } catch (error) {
    console.error("Error generating property P&L:", error)
    return NextResponse.json({ error: "Failed to generate P&L report" }, { status: 500 })
  }
}
