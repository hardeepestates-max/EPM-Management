import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const unitId = searchParams.get("unitId")
    const propertyId = searchParams.get("propertyId")

    const where: Record<string, string> = {}
    if (unitId) where.unitId = unitId
    if (propertyId) where.propertyId = propertyId

    const invites = await prisma.tenantInvite.findMany({
      where,
      include: {
        unit: true,
        property: true
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ invites })
  } catch (error) {
    console.error("Error fetching invites:", error)
    return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { email, unitId, propertyId } = body

    if (!email || !unitId || !propertyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if there's already a pending invite for this email and unit
    const existingInvite = await prisma.tenantInvite.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        unitId,
        status: "PENDING"
      }
    })

    if (existingInvite) {
      return NextResponse.json({ error: "An invite already exists for this email and unit" }, { status: 400 })
    }

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 })
    }

    // Create invite with 7 day expiry
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invite = await prisma.tenantInvite.create({
      data: {
        email: email.toLowerCase().trim(),
        unitId,
        propertyId,
        expiresAt
      },
      include: {
        unit: true,
        property: true
      }
    })

    return NextResponse.json({ invite })
  } catch (error) {
    console.error("Error creating invite:", error)
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 })
  }
}
