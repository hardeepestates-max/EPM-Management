import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/expenses/export - Export expenses to CSV
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("propertyId")
    const category = searchParams.get("category")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build where clause
    const where: {
      ownerId: string
      propertyId?: string
      category?: string
      date?: { gte?: Date; lte?: Date }
    } = {
      ownerId: session.user.id,
    }

    if (propertyId) {
      where.propertyId = propertyId
    }

    if (category) {
      where.category = category
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    // Get all expenses matching filters
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        property: {
          select: {
            name: true,
            address: true,
          },
        },
      },
      orderBy: { date: "desc" },
    })

    // Generate CSV content
    const headers = ["date", "amount", "category", "description", "vendor", "property", "notes"]
    const rows = expenses.map((expense) => [
      expense.date.toISOString().split("T")[0],
      expense.amount.toFixed(2),
      expense.category,
      `"${(expense.description || "").replace(/"/g, '""')}"`,
      `"${(expense.vendorName || "").replace(/"/g, '""')}"`,
      `"${(expense.property?.name || "").replace(/"/g, '""')}"`,
      `"${(expense.notes || "").replace(/"/g, '""')}"`,
    ])

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="expenses-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting expenses:", error)
    return NextResponse.json(
      { error: "Failed to export expenses" },
      { status: 500 }
    )
  }
}
