import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover"
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { paymentMethod } = body // "card" or "ach"

    // Get the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        owner: true,
        lineItems: true
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Check ownership
    if (session.user.role === "OWNER" && invoice.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "Invoice already paid" }, { status: 400 })
    }

    // Get or create Stripe customer
    let customerId = invoice.owner.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: invoice.owner.email,
        name: invoice.owner.name,
        metadata: {
          userId: invoice.owner.id
        }
      })
      customerId = customer.id

      await prisma.user.update({
        where: { id: invoice.owner.id },
        data: { stripeCustomerId: customerId }
      })
    }

    // Create line items for Stripe checkout
    const lineItems = invoice.lineItems.map(item => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.description,
          metadata: {
            invoiceLineItemId: item.id
          }
        },
        unit_amount: Math.round(item.unitPrice * 100) // Convert to cents
      },
      quantity: Math.round(item.quantity)
    }))

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: paymentMethod === "ach"
        ? ["us_bank_account"]
        : ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/owner/invoices?success=true&invoice=${invoice.invoiceNumber}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/owner/invoices?canceled=true`,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        ownerId: invoice.ownerId
      },
      payment_intent_data: {
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          type: "owner_invoice"
        }
      }
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    })
  } catch (error) {
    console.error("Error creating payment session:", error)
    return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 })
  }
}
