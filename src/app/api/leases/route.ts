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
