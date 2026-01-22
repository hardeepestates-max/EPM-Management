import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Call the late fee application endpoint
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/billing/apply-late-fees?secret=${process.env.CRON_SECRET}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      }
    )

    const result = await response.json()

    if (!response.ok) {
      console.error("Failed to apply late fees:", result)
      return NextResponse.json(
        { error: "Failed to apply late fees", details: result },
        { status: 500 }
      )
    }

    console.log("Late fees applied:", result)

    return NextResponse.json({
      success: true,
      message: "Late fees applied successfully",
      result
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
  }
}
