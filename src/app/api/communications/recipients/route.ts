import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const recipientType = searchParams.get("type") || "ALL"

    const whereClause = recipientType === "ALL"
      ? { role: { in: ["OWNER", "TENANT"] } }
      : { role: recipientType }

    const count = await prisma.user.count({
      where: whereClause
    })

    return NextResponse.json({ count, recipientType })
  } catch (error) {
    console.error("Error fetching recipient count:", error)
    return NextResponse.json(
      { error: "Failed to fetch recipient count" },
      { status: 500 }
    )
  }
}
