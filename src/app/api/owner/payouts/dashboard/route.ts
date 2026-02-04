import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

// POST /api/owner/payouts/dashboard - Create login link to Stripe Express Dashboard
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user?.stripeConnectId) {
      return NextResponse.json(
        { error: "Payout account not set up" },
        { status: 400 }
      )
    }

    // Create login link to Stripe Express Dashboard
    const loginLink = await stripe.accounts.createLoginLink(user.stripeConnectId)

    return NextResponse.json({
      url: loginLink.url,
    })
  } catch (error) {
    console.error("Error creating dashboard link:", error)
    return NextResponse.json(
      { error: "Failed to create dashboard link" },
      { status: 500 }
    )
  }
}
