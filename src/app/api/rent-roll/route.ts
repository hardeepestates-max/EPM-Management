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
    const status = searchParams.get("status") // all, current, overdue
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

    // Get all properties with units and leases
    const properties = await prisma.property.findMany({
      where: {
        ...propertyFilter,
        status: "ACTIVE"
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
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
                  take: 12
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
      },
      orderBy: { name: "asc" }
    })

    const now = new Date()

    // Build portfolio rent roll
    const rentRoll = []

    for (const property of properties) {
      for (const unit of property.units) {
        const activeLease = unit.leases.find(l => l.status === "ACTIVE")
        const pendingInvite = unit.tenantInvites[0]

        // Calculate aging and balance
        let currentBalance = 0
        const aging = {
          current: 0,
          days30: 0,
          days60: 0,
          days90Plus: 0
        }

        if (activeLease) {
          if (activeLease.paymentAging) {
            aging.current = activeLease.paymentAging.current
            aging.days30 = activeLease.paymentAging.days30
            aging.days60 = activeLease.paymentAging.days60
            aging.days90Plus = activeLease.paymentAging.days90Plus
            currentBalance = activeLease.paymentAging.totalDue
          } else {
            // Calculate from rent charges
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

            // Check unpaid payments if no rent charges
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
        }

        // Get last payment info
        const lastPayment = activeLease?.payments.find(p =>
          p.status === "COMPLETED" || p.status === "PAID"
        )

        const item = {
          propertyId: property.id,
          propertyName: property.name,
          propertyAddress: `${property.address}, ${property.city}, ${property.state}`,
          owner: property.owner,
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          status: unit.status,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          sqft: unit.sqft,
          marketRent: unit.rentAmount,
          leaseRent: activeLease?.rentAmount || null,
          tenant: activeLease?.tenant || null,
          leaseId: activeLease?.id || null,
          leaseStart: activeLease?.startDate || null,
          leaseEnd: activeLease?.endDate || null,
          currentBalance,
          lastPaymentDate: lastPayment?.paidDate || null,
          lastPaymentAmount: lastPayment?.amount || null,
          pendingInvite: pendingInvite ? {
            email: pendingInvite.email,
            status: pendingInvite.status
          } : null,
          aging
        }

        // Apply status filter
        if (status === "current" && (currentBalance > 0 || !activeLease?.tenant)) {
          continue
        }
        if (status === "overdue" && currentBalance === 0) {
          continue
        }

        rentRoll.push(item)
      }
    }

    // Calculate portfolio totals
    const totals = {
      totalProperties: properties.length,
      totalUnits: rentRoll.length,
      occupiedUnits: rentRoll.filter(r => r.tenant).length,
      vacantUnits: rentRoll.filter(r => !r.tenant).length,
      totalMarketRent: rentRoll.reduce((sum, r) => sum + r.marketRent, 0),
      totalLeaseRent: rentRoll.reduce((sum, r) => sum + (r.leaseRent || 0), 0),
      totalBalance: rentRoll.reduce((sum, r) => sum + r.currentBalance, 0),
      agingTotals: {
        current: rentRoll.reduce((sum, r) => sum + r.aging.current, 0),
        days30: rentRoll.reduce((sum, r) => sum + r.aging.days30, 0),
        days60: rentRoll.reduce((sum, r) => sum + r.aging.days60, 0),
        days90Plus: rentRoll.reduce((sum, r) => sum + r.aging.days90Plus, 0)
      },
      occupancyRate: rentRoll.length > 0
        ? Math.round((rentRoll.filter(r => r.tenant).length / rentRoll.length) * 1000) / 10
        : 0
    }

    return NextResponse.json({ rentRoll, totals })
  } catch (error) {
    console.error("Error fetching rent roll:", error)
    return NextResponse.json({ error: "Failed to fetch rent roll" }, { status: 500 })
  }
}
