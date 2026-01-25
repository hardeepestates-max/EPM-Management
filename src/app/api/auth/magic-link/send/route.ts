import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendMagicLinkEmail } from "@/lib/email"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      // Still return success to prevent email enumeration
      return NextResponse.json({
        message: "If an account exists with this email, a login link has been sent."
      })
    }

    // Generate a secure random token
    const token = randomBytes(32).toString("hex")

    // Token expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // Delete any existing unused tokens for this email
    await prisma.magicLinkToken.deleteMany({
      where: {
        email: normalizedEmail,
        usedAt: null
      }
    })

    // Create new magic link token
    await prisma.magicLinkToken.create({
      data: {
        token,
        email: normalizedEmail,
        expiresAt
      }
    })

    // Build the magic link URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const magicLink = `${baseUrl}/api/auth/magic-link/verify?token=${token}`

    // Send the email (or log to console if Resend not configured)
    if (process.env.RESEND_API_KEY) {
      await sendMagicLinkEmail({
        to: normalizedEmail,
        magicLink
      })
    } else {
      // Development mode: log magic link to console
      console.log("\n========================================")
      console.log("MAGIC LINK (Dev Mode - No Resend API Key)")
      console.log("========================================")
      console.log(`Email: ${normalizedEmail}`)
      console.log(`Link: ${magicLink}`)
      console.log("========================================\n")
    }

    return NextResponse.json({
      message: "If an account exists with this email, a login link has been sent."
    })
  } catch (error) {
    console.error("Magic link send error:", error)
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 }
    )
  }
}
