import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get all invoices (Admin) or owner's invoices (Owner)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let invoices

    if (session.user.role === "ADMIN") {
      invoices = await prisma.invoice.findMany({
        include: {
          owner: true,
          lineItems: true,
        },
        orderBy: { createdAt: "desc" },
      })
    } else if (session.user.role === "OWNER") {
      invoices = await prisma.invoice.findMany({
        where: { ownerId: session.user.id },
        include: {
          lineItems: true,
        },
        orderBy: { createdAt: "desc" },
      })
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    )
  }
}

// Create new invoice (Admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ownerId, periodStart, periodEnd, dueDate, lineItems, notes } = await request.json()

    // Calculate totals
    const subtotal = lineItems.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0)
    const totalAmount = subtotal

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count()
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(5, "0")}`

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        ownerId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        dueDate: new Date(dueDate),
        subtotal,
        totalAmount,
        notes,
        lineItems: {
          create: lineItems.map((item: { description: string; quantity: number; unitPrice: number; amount: number; type: string }) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            amount: item.amount,
            type: item.type,
          })),
        },
      },
      include: {
        lineItems: true,
        owner: true,
      },
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    )
  }
}
