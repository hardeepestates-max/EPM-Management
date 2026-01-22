import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { unitId, tenantId, startDate, endDate, rentAmount, deposit } = body

    if (!unitId || !tenantId || !startDate || !endDate || !rentAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if unit already has an active lease
    const existingLease = await prisma.lease.findFirst({
      where: {
        unitId,
        status: "ACTIVE",
      },
    })

    if (existingLease) {
      return NextResponse.json({ error: "Unit already has an active lease" }, { status: 400 })
    }

    // Create the lease
    const lease = await prisma.lease.create({
      data: {
        unitId,
        tenantId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rentAmount: parseFloat(rentAmount),
        deposit: deposit ? parseFloat(deposit) : null,
        status: "ACTIVE",
      },
      include: {
        tenant: { select: { id: true, name: true, email: true } },
        unit: {
          include: {
            property: { select: { id: true, name: true, address: true } },
          },
        },
      },
    })

    // Update unit status to occupied
    await prisma.unit.update({
      where: { id: unitId },
      data: { status: "OCCUPIED" },
    })

    return NextResponse.json({ lease })
  } catch (error) {
    console.error("Error creating lease:", error)
    return NextResponse.json({ error: "Failed to create lease" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")
    const unitId = searchParams.get("unitId")

    const where: Record<string, string> = {}
    if (tenantId) where.tenantId = tenantId
    if (unitId) where.unitId = unitId

    const leases = await prisma.lease.findMany({
      where,
      include: {
        tenant: {
          select: { id: true, name: true, email: true }
        },
        unit: {
          include: {
            property: {
              select: { id: true, name: true, address: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ leases })
  } catch (error) {
    console.error("Error fetching leases:", error)
    return NextResponse.json({ error: "Failed to fetch leases" }, { status: 500 })
  }
}
