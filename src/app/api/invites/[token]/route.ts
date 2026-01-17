import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET - Validate invite token (public - for registration page)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

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

    return NextResponse.json({
      invite: {
        id: invite.id,
        email: invite.email,
        unit: {
          id: invite.unit.id,
          unitNumber: invite.unit.unitNumber,
          bedrooms: invite.unit.bedrooms,
          bathrooms: invite.unit.bathrooms,
          rentAmount: invite.unit.rentAmount
        },
        property: {
          id: invite.property.id,
          name: invite.property.name,
          address: invite.property.address,
          city: invite.property.city,
          state: invite.property.state
        }
      }
    })
  } catch (error) {
    console.error("Error validating invite:", error)
    return NextResponse.json({ error: "Failed to validate invite" }, { status: 500 })
  }
}

// DELETE - Cancel an invite (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await params

    await prisma.tenantInvite.delete({
      where: { token }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting invite:", error)
    return NextResponse.json({ error: "Failed to delete invite" }, { status: 500 })
  }
}
