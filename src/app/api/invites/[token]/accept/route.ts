import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import prisma from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await req.json()
    const { name, password, phone } = body

    if (!name || !password) {
      return NextResponse.json({ error: "Name and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Find the invite
    const invite = await prisma.tenantInvite.findUnique({
      where: { token },
      include: {
        unit: true,
        property: true
      }
    })

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite link" }, { status: 404 })
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json({ error: "This invite has already been used" }, { status: 400 })
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json({ error: "This invite has expired" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email }
    })

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 })
    }

    const hashedPassword = await hash(password, 12)

    // Create user and lease in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the tenant user
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: invite.email,
          password: hashedPassword,
          phone: phone?.trim() || null,
          role: "TENANT"
        }
      })

      // Create an active lease for this tenant
      const startDate = new Date()
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 1) // 1 year lease by default

      const lease = await tx.lease.create({
        data: {
          unitId: invite.unitId,
          tenantId: user.id,
          startDate,
          endDate,
          rentAmount: invite.unit.rentAmount,
          status: "ACTIVE"
        }
      })

      // Update unit status to OCCUPIED
      await tx.unit.update({
        where: { id: invite.unitId },
        data: { status: "OCCUPIED" }
      })

      // Mark invite as accepted
      await tx.tenantInvite.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          usedAt: new Date()
        }
      })

      return { user, lease }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      }
    })
  } catch (error) {
    console.error("Error accepting invite:", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
