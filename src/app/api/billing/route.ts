import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get all owner billing settings (Admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all owners with their billing settings
    const owners = await prisma.user.findMany({
      where: { role: "OWNER" },
      include: {
        billingSettings: true,
        ownedProperties: {
          include: {
            units: {
              include: {
                leases: {
                  where: { status: "ACTIVE" },
                },
              },
            },
          },
        },
      },
    })

    // Calculate monthly revenue for each owner
    const ownersWithRevenue = owners.map(owner => {
      const monthlyRevenue = owner.ownedProperties.reduce((sum, property) => {
        return sum + property.units.reduce((unitSum, unit) => {
          const activeLease = unit.leases[0]
          return unitSum + (activeLease ? activeLease.rentAmount : 0)
        }, 0)
      }, 0)

      return {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        propertyCount: owner.ownedProperties.length,
        monthlyRevenue,
        billingSettings: owner.billingSettings || {
          managementFeePercent: 8.0,
          billingDay: 1,
        },
      }
    })

    return NextResponse.json({ owners: ownersWithRevenue })
  } catch (error) {
    console.error("Error fetching billing settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch billing settings" },
      { status: 500 }
    )
  }
}

// Update owner billing settings
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ownerId, managementFeePercent, billingDay } = await request.json()

    const billingSettings = await prisma.ownerBillingSettings.upsert({
      where: { ownerId },
      update: { managementFeePercent, billingDay },
      create: { ownerId, managementFeePercent, billingDay },
    })

    return NextResponse.json({ billingSettings })
  } catch (error) {
    console.error("Error updating billing settings:", error)
    return NextResponse.json(
      { error: "Failed to update billing settings" },
      { status: 500 }
    )
  }
}
