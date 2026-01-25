import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"
import { encode } from "next-auth/jwt"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url))
    }

    // Find the token
    const magicToken = await prisma.magicLinkToken.findUnique({
      where: { token }
    })

    if (!magicToken) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url))
    }

    // Check if token is already used
    if (magicToken.usedAt) {
      return NextResponse.redirect(new URL("/login?error=token_used", request.url))
    }

    // Check if token is expired
    if (new Date() > magicToken.expiresAt) {
      return NextResponse.redirect(new URL("/login?error=token_expired", request.url))
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: magicToken.email }
    })

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=user_not_found", request.url))
    }

    // Mark token as used
    await prisma.magicLinkToken.update({
      where: { id: magicToken.id },
      data: { usedAt: new Date() }
    })

    // Create JWT token for the session
    const jwtToken = await encode({
      token: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        sub: user.id
      },
      secret: process.env.NEXTAUTH_SECRET!,
    })

    // Determine redirect URL based on role
    let redirectUrl = "/dashboard/tenant"
    if (user.role === "ADMIN") {
      redirectUrl = "/dashboard/admin"
    } else if (user.role === "OWNER") {
      redirectUrl = "/dashboard/owner"
    }

    // Create the response with redirect
    const response = NextResponse.redirect(new URL(redirectUrl, request.url))

    // Set the session cookie
    const cookieStore = await cookies()
    const isProduction = process.env.NODE_ENV === "production"
    const cookieName = isProduction ? "__Secure-next-auth.session-token" : "next-auth.session-token"

    cookieStore.set(cookieName, jwtToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })

    return response
  } catch (error) {
    console.error("Magic link verify error:", error)
    return NextResponse.redirect(new URL("/login?error=verification_failed", request.url))
  }
}
