import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ paymentMethods: [] })
    }

    // Get all payment methods for this customer
    const [cards, bankAccounts] = await Promise.all([
      stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: "card",
      }),
      stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: "us_bank_account",
      }),
    ])

    const paymentMethods = [
      ...cards.data.map((pm) => ({
        id: pm.id,
        type: "card" as const,
        brand: pm.card?.brand || "unknown",
        last4: pm.card?.last4 || "****",
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
        isDefault: false,
      })),
      ...bankAccounts.data.map((pm) => ({
        id: pm.id,
        type: "bank" as const,
        bankName: pm.us_bank_account?.bank_name || "Bank Account",
        last4: pm.us_bank_account?.last4 || "****",
        accountType: pm.us_bank_account?.account_type,
        isDefault: false,
      })),
    ]

    return NextResponse.json({ paymentMethods })
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { paymentMethodId } = await request.json()

    if (!paymentMethodId) {
      return NextResponse.json({ error: "Payment method ID required" }, { status: 400 })
    }

    // Verify the payment method belongs to this user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: "No payment methods found" }, { status: 404 })
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

    if (paymentMethod.customer !== user.stripeCustomerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Detach the payment method
    await stripe.paymentMethods.detach(paymentMethodId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting payment method:", error)
    return NextResponse.json(
      { error: "Failed to delete payment method" },
      { status: 500 }
    )
  }
}
