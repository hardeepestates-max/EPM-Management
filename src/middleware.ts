import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin routes - only ADMIN can access
    if (path.startsWith("/dashboard/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    // Owner routes - only OWNER or ADMIN can access
    if (path.startsWith("/dashboard/owner")) {
      if (token?.role !== "OWNER" && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    // Tenant routes - only TENANT or ADMIN can access
    if (path.startsWith("/dashboard/tenant")) {
      if (token?.role !== "TENANT" && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*"],
}
