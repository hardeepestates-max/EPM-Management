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
    const status = searchParams.get("status")

    let where: Record<string, unknown> = {}

    if (session.user.role === "TENANT") {
      where.userId = session.user.id
    } else if (session.user.role === "OWNER") {
      const properties = await prisma.property.findMany({
        where: { ownerId: session.user.id },
        select: { id: true },
      })
      where.propertyId = { in: properties.map((p) => p.id) }
    }

    if (status) {
      where.status = status
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, unitNumber: true } },
        messages: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, category, priority, propertyId, unitId } = body

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description required" }, { status: 400 })
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        category: category || "GENERAL",
        priority: priority || "MEDIUM",
        userId: session.user.id,
        propertyId: propertyId || null,
        unitId: unitId || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error("Error creating ticket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
