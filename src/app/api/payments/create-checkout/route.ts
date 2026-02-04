import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe, calculateCardFee, ACH_FEE_AMOUNT } from "@/lib/stripe"
import type Stripe from "stripe"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { paymentId, paymentMethod } = await request.json()

    // Get the payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        lease: {
          include: {
            tenant: true,
            unit: {
              include: { property: true },
            },
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Verify the user owns this payment
    if (payment.lease.tenantId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if already paid
    if (payment.status === "PAID") {
      return NextResponse.json({ error: "Payment already completed" }, { status: 400 })
    }

    // Get or create Stripe customer
    let stripeCustomerId = payment.lease.tenant.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: payment.lease.tenant.email,
        name: payment.lease.tenant.name,
        metadata: {
          userId: payment.lease.tenant.id,
        },
      })
      stripeCustomerId = customer.id

      // Save customer ID
      await prisma.user.update({
        where: { id: payment.lease.tenant.id },
        data: { stripeCustomerId },
      })
    }

    // Calculate amounts
    const baseAmount = payment.amount
    let convenienceFee = 0
    let totalAmount = baseAmount

    if (paymentMethod === "card") {
      convenienceFee = calculateCardFee(baseAmount)
      totalAmount = baseAmount + convenienceFee
    } else if (paymentMethod === "ach") {
      convenienceFee = ACH_FEE_AMOUNT
      totalAmount = baseAmount + convenienceFee
    }

    // Create line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Rent Payment - ${payment.lease.unit.property.name} Unit ${payment.lease.unit.unitNumber}`,
            description: `Rent for ${new Date(payment.dueDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
          },
          unit_amount: Math.round(baseAmount * 100), // Stripe uses cents
        },
        quantity: 1,
      },
    ]

    // Add convenience fee as separate line item if applicable (cards only, ACH is free)
    if (convenienceFee > 0 && paymentMethod === "card") {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Card Processing Fee",
            description: `2.9% convenience fee for card payment`,
          },
          unit_amount: Math.round(convenienceFee * 100),
        },
        quantity: 1,
      })
    }

    // Create checkout session with Financial Connections for ACH
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "payment",
      payment_method_types: paymentMethod === "ach" ? ["us_bank_account"] : ["card"],
      line_items: lineItems,
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/tenant/payments?success=true&payment=${paymentId}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/tenant/payments?cancelled=true`,
      metadata: {
        paymentId: payment.id,
        paymentMethod,
        convenienceFee: convenienceFee.toString(),
        totalAmount: totalAmount.toString(),
      },
      // Enable instant bank verification via Financial Connections for ACH
      ...(paymentMethod === "ach" && {
        payment_method_options: {
          us_bank_account: {
            financial_connections: {
              permissions: ["payment_method"],
            },
            verification_method: "instant",
          },
        },
      }),
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
