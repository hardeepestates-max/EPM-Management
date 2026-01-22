import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { sendBulkEmail } from "@/lib/email"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bulkEmails = await prisma.bulkEmail.findMany({
      orderBy: { sentAt: "desc" },
      take: 50,
      include: {
        sentBy: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json(bulkEmails)
  } catch (error) {
    console.error("Error fetching bulk emails:", error)
    return NextResponse.json(
      { error: "Failed to fetch communications" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { subject, body, recipientType } = await req.json()

    if (!subject || !body || !recipientType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!["OWNER", "TENANT", "ALL"].includes(recipientType)) {
      return NextResponse.json(
        { error: "Invalid recipient type" },
        { status: 400 }
      )
    }

    // Get recipients based on type
    const whereClause = recipientType === "ALL"
      ? { role: { in: ["OWNER", "TENANT"] } }
      : { role: recipientType }

    const recipients = await prisma.user.findMany({
      where: whereClause,
      select: { email: true, name: true }
    })

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients found" },
        { status: 400 }
      )
    }

    // Send emails to all recipients
    const results = await Promise.allSettled(
      recipients.map(recipient =>
        sendBulkEmail({
          to: recipient.email,
          recipientName: recipient.name || undefined,
          subject,
          body
        })
      )
    )

    const successCount = results.filter(r => r.status === "fulfilled").length
    const failCount = results.filter(r => r.status === "rejected").length

    // Save record
    const bulkEmail = await prisma.bulkEmail.create({
      data: {
        subject,
        body,
        recipientType,
        recipientCount: successCount,
        sentById: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      bulkEmail,
      stats: {
        total: recipients.length,
        sent: successCount,
        failed: failCount
      }
    })
  } catch (error) {
    console.error("Error sending bulk email:", error)
    return NextResponse.json(
      { error: "Failed to send communications" },
      { status: 500 }
    )
  }
}
