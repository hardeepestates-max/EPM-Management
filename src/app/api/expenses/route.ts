import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const EXPENSE_CATEGORIES = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "REPAIRS", label: "Repairs" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "TAX", label: "Property Tax" },
  { value: "MORTGAGE", label: "Mortgage/Loan" },
  { value: "HOA", label: "HOA Fees" },
  { value: "LEGAL", label: "Legal/Professional" },
  { value: "ADVERTISING", label: "Advertising" },
  { value: "OTHER", label: "Other" },
]

// GET /api/expenses - List owner's expenses with filters
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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

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

    // Get expenses with pagination
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ])

    // Get summary by category
    const summary = await prisma.expense.groupBy({
      by: ["category"],
      where,
      _sum: {
        amount: true,
      },
    })

    const totalAmount = summary.reduce((acc, item) => acc + (item._sum.amount || 0), 0)

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        total: totalAmount,
        byCategory: summary.map((item) => ({
          category: item.category,
          amount: item._sum.amount || 0,
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    )
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { amount, date, category, description, vendorName, notes, propertyId, receiptUrl } = body

    // Validate required fields
    if (!amount || !date || !category || !propertyId) {
      return NextResponse.json(
        { error: "Missing required fields: amount, date, category, propertyId" },
        { status: 400 }
      )
    }

    // Verify property ownership
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId: session.user.id,
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: "Property not found or not owned by you" },
        { status: 404 }
      )
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        date: new Date(date),
        category,
        description: description || "",
        vendorName: vendorName || null,
        notes: notes || null,
        receiptUrl: receiptUrl || null,
        propertyId,
        ownerId: session.user.id,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    )
  }
}
