import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { put, del } from "@vercel/blob"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get("propertyId")

    let documents
    if (session.user.role === "ADMIN") {
      // Admin can see all documents
      documents = await prisma.document.findMany({
        where: propertyId ? { propertyId } : {},
        include: {
          user: { select: { name: true, email: true } },
          property: { select: { name: true, address: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    } else if (session.user.role === "OWNER") {
      // Owner can see documents for their properties
      documents = await prisma.document.findMany({
        where: {
          property: { ownerId: session.user.id },
          ...(propertyId ? { propertyId } : {}),
        },
        include: {
          user: { select: { name: true, email: true } },
          property: { select: { name: true, address: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    } else {
      // Tenant can see their own documents
      documents = await prisma.document.findMany({
        where: { userId: session.user.id },
        include: {
          property: { select: { name: true, address: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    }

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin can upload documents
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const propertyId = formData.get("propertyId") as string
    const userId = formData.get("userId") as string
    const requiresSignature = formData.get("requiresSignature") === "true"

    if (!file || !title) {
      return NextResponse.json({ error: "File and title are required" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`documents/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    // Create document record
    const document = await prisma.document.create({
      data: {
        title,
        description,
        fileUrl: blob.url,
        fileType: file.type,
        requiresSignature,
        userId: userId || session.user.id,
        propertyId: propertyId || null,
      },
      include: {
        user: { select: { name: true, email: true } },
        property: { select: { name: true, address: true } },
      },
    })

    return NextResponse.json({ document })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get("id")

    if (!documentId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 })
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete from Vercel Blob
    try {
      await del(document.fileUrl)
    } catch (e) {
      console.error("Error deleting blob:", e)
      // Continue even if blob deletion fails
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
