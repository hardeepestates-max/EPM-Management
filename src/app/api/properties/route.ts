import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let properties
    if (session.user.role === "ADMIN") {
      properties = await prisma.property.findMany({
        include: { owner: true, units: true },
        orderBy: { createdAt: "desc" },
      })
    } else if (session.user.role === "OWNER") {
      properties = await prisma.property.findMany({
        where: { ownerId: session.user.id },
        include: { owner: true, units: true },
        orderBy: { createdAt: "desc" },
      })
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ properties })
  } catch (error) {
    console.error("Error fetching properties:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, address, city, state, zipCode, description, ownerId } = body

    if (!name || !address || !city || !state || !zipCode || !ownerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const property = await prisma.property.create({
      data: {
        name,
        address,
        city,
        state,
        zipCode,
        description,
        ownerId,
      },
    })

    return NextResponse.json({ property })
  } catch (error) {
    console.error("Error creating property:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
