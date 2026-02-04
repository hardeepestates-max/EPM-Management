import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

// POST /api/owner/payouts/connect - Create Stripe Connect onboarding link
export async function POST() {
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

    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only property owners can set up payouts" },
        { status: 403 }
      )
    }

    let accountId = user.stripeConnectId

    // Create new Connect account if not exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        metadata: {
          userId: user.id,
        },
        capabilities: {
          transfers: { requested: true },
        },
      })

      accountId = account.id

      await prisma.user.update({
        where: { id: user.id },
        data: {
          stripeConnectId: accountId,
          stripeConnectStatus: "pending",
        },
      })
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/dashboard/owner/payouts?refresh=true`,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/owner/payouts?success=true`,
      type: "account_onboarding",
    })

    return NextResponse.json({
      url: accountLink.url,
    })
  } catch (error) {
    console.error("Error creating Connect onboarding:", error)
    return NextResponse.json(
      { error: "Failed to create onboarding link" },
      { status: 500 }
    )
  }
}

// GET /api/owner/payouts/connect - Get Connect account status
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
        connected: false,
        status: null,
        payoutsEnabled: false,
        detailsSubmitted: false,
      })
    }

    // Get account status from Stripe
    const account = await stripe.accounts.retrieve(user.stripeConnectId)

    // Update local status if changed
    let status = "pending"
    if (account.details_submitted && account.payouts_enabled) {
      status = "active"
    } else if (account.requirements?.disabled_reason) {
      status = "restricted"
    }

    if (status !== user.stripeConnectStatus) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectStatus: status },
      })
    }

    return NextResponse.json({
      connected: true,
      status,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements,
      externalAccounts: account.external_accounts?.data?.map((acc) => {
        if (acc.object === "bank_account") {
          return {
            id: acc.id,
            type: "bank",
            bankName: acc.bank_name,
            last4: acc.last4,
            currency: acc.currency,
          }
        }
        return null
      }).filter(Boolean),
    })
  } catch (error) {
    console.error("Error fetching Connect status:", error)
    return NextResponse.json(
      { error: "Failed to fetch account status" },
      { status: 500 }
    )
  }
}
