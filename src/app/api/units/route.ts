import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get("propertyId")

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID required" }, { status: 400 })
    }

    const units = await prisma.unit.findMany({
      where: { propertyId },
      include: {
        leases: {
          where: { status: "ACTIVE" },
          include: { tenant: { select: { id: true, name: true, email: true } } }
        },
        tenantInvites: {
          where: { status: "PENDING" }
        }
      },
      orderBy: { unitNumber: "asc" }
    })

    return NextResponse.json({ units })
  } catch (error) {
    console.error("Error fetching units:", error)
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { propertyId, unitNumber, bedrooms, bathrooms, sqft, rentAmount } = body

    if (!propertyId || !unitNumber || bedrooms === undefined || bathrooms === undefined || !rentAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const unit = await prisma.unit.create({
      data: {
        propertyId,
        unitNumber,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseFloat(bathrooms),
        sqft: sqft ? parseInt(sqft) : null,
        rentAmount: parseFloat(rentAmount),
        status: "AVAILABLE"
      }
    })

    return NextResponse.json({ unit })
  } catch (error) {
    console.error("Error creating unit:", error)
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 })
  }
}
