import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

// GET /api/owner/payouts - Get payout history and balance
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.stripeConnectId) {
      return NextResponse.json({
        balance: { available: 0, pending: 0 },
        payouts: [],
      })
    }

    // Get balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: user.stripeConnectId,
    })

    // Get recent payouts
    const payouts = await stripe.payouts.list(
      {
        limit: 20,
      },
      {
        stripeAccount: user.stripeConnectId,
      }
    )

    // Calculate available and pending amounts
    const availableBalance = balance.available.reduce((sum, b) => {
      if (b.currency === "usd") return sum + b.amount
      return sum
    }, 0) / 100

    const pendingBalance = balance.pending.reduce((sum, b) => {
      if (b.currency === "usd") return sum + b.amount
      return sum
    }, 0) / 100

    return NextResponse.json({
      balance: {
        available: availableBalance,
        pending: pendingBalance,
      },
      payouts: payouts.data.map((payout) => ({
        id: payout.id,
        amount: payout.amount / 100,
        status: payout.status,
        arrivalDate: payout.arrival_date,
        created: payout.created,
        method: payout.method,
        description: payout.description,
      })),
    })
  } catch (error) {
    console.error("Error fetching payouts:", error)
    return NextResponse.json(
      { error: "Failed to fetch payouts" },
      { status: 500 }
    )
  }
}

// POST /api/owner/payouts - Request manual payout
export async function POST(request: Request) {
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

    const { amount } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      )
    }

    // Create payout
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amount * 100),
        currency: "usd",
      },
      {
        stripeAccount: user.stripeConnectId,
      }
    )

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        amount: payout.amount / 100,
        status: payout.status,
        arrivalDate: payout.arrival_date,
      },
    })
  } catch (error) {
    console.error("Error creating payout:", error)
    return NextResponse.json(
      { error: "Failed to create payout" },
      { status: 500 }
    )
  }
}
