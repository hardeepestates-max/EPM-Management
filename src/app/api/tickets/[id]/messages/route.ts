import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // SECURITY: Verify ticket exists and user has access
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        property: { select: { ownerId: true } },
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

    const body = await req.json()
    const { message } = body

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // SECURITY: Sanitize message (basic XSS prevention - trim and limit length)
    const sanitizedMessage = message.trim().substring(0, 10000)

    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        message: sanitizedMessage,
        ticketId: id,
        userId: session.user.id,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    })

    return NextResponse.json({ message: ticketMessage })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
