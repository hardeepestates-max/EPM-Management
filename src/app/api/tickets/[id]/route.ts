import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, name: true, address: true, ownerId: true } },
        unit: { select: { id: true, unitNumber: true } },
        messages: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // SECURITY: Check user has access to this ticket
    const isAdmin = session.user.role === "ADMIN"
    const isTicketOwner = ticket.userId === session.user.id
    const isPropertyOwner = ticket.property?.ownerId === session.user.id

    if (!isAdmin && !isTicketOwner && !isPropertyOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error("Error fetching ticket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // SECURITY: Fetch ticket first to check authorization
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        property: { select: { ownerId: true } },
      },
    })

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // SECURITY: Only ADMIN or property owner can update tickets
    const isAdmin = session.user.role === "ADMIN"
    const isPropertyOwner = existingTicket.property?.ownerId === session.user.id

    if (!isAdmin && !isPropertyOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { status, priority } = body

    // SECURITY: Validate status and priority values
    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]
    const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"]

    const updateData: Record<string, string> = {}
    if (status && validStatuses.includes(status)) updateData.status = status
    if (priority && validPriorities.includes(priority)) updateData.priority = priority

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        messages: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    })

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error("Error updating ticket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
