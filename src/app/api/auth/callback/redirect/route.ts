import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"))
  }

  let redirectUrl = "/dashboard/tenant"

  if (session.user.role === "ADMIN") {
    redirectUrl = "/dashboard/admin"
  } else if (session.user.role === "OWNER") {
    redirectUrl = "/dashboard/owner"
  }

  return NextResponse.redirect(new URL(redirectUrl, process.env.NEXTAUTH_URL || "http://localhost:3000"))
}
