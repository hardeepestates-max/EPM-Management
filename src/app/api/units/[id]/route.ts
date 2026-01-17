import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { unitNumber, bedrooms, bathrooms, sqft, rentAmount, status } = body

    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: {
        ...(unitNumber && { unitNumber }),
        ...(bedrooms !== undefined && { bedrooms: parseInt(bedrooms) }),
        ...(bathrooms !== undefined && { bathrooms: parseFloat(bathrooms) }),
        ...(sqft !== undefined && { sqft: sqft ? parseInt(sqft) : null }),
        ...(rentAmount !== undefined && { rentAmount: parseFloat(rentAmount) }),
        ...(status && { status })
      }
    })

    return NextResponse.json({ unit: updatedUnit })
  } catch (error) {
    console.error("Error updating unit:", error)
    return NextResponse.json({ error: "Failed to update unit" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.unit.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting unit:", error)
    return NextResponse.json({ error: "Failed to delete unit" }, { status: 500 })
  }
}
