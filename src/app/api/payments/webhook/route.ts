import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session

      const paymentId = session.metadata?.paymentId
      const paymentMethod = session.metadata?.paymentMethod
      const convenienceFee = parseFloat(session.metadata?.convenienceFee || "0")
      const totalAmount = parseFloat(session.metadata?.totalAmount || "0")

      if (paymentId) {
        // Update payment record
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: "PAID",
            paidDate: new Date(),
            stripePaymentId: session.payment_intent as string,
            paymentMethod,
            convenienceFee,
            totalPaid: totalAmount,
          },
        })

        console.log(`Payment ${paymentId} marked as PAID`)
      }
      break
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session
      console.log(`Checkout session expired: ${session.id}`)
      break
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log(`Payment failed: ${paymentIntent.id}`)
      break
    }
  }

  return NextResponse.json({ received: true })
}
