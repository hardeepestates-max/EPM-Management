import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/expenses/[id] - Get single expense
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const expense = await prisma.expense.findFirst({
      where: {
        id,
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

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error fetching expense:", error)
    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 }
    )
  }
}

// PATCH /api/expenses/[id] - Update expense
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { amount, date, category, description, vendorName, notes, propertyId, receiptUrl } = body

    // Verify expense exists and belongs to user
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    })

    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    // If changing property, verify ownership
    if (propertyId && propertyId !== existingExpense.propertyId) {
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
    }

    // Update expense
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(category && { category }),
        ...(description && { description }),
        ...(vendorName !== undefined && { vendorName: vendorName || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(receiptUrl !== undefined && { receiptUrl: receiptUrl || null }),
        ...(propertyId && { propertyId }),
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

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    )
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify expense exists and belongs to user
    const expense = await prisma.expense.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    })

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    await prisma.expense.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    )
  }
}
