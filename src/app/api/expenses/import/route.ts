import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const VALID_CATEGORIES = [
  "MAINTENANCE",
  "REPAIRS",
  "UTILITIES",
  "INSURANCE",
  "TAX",
  "MORTGAGE",
  "HOA",
  "LEGAL",
  "ADVERTISING",
  "OTHER",
]

interface CSVRow {
  date: string
  amount: string
  category: string
  description: string
  vendor?: string
  property?: string
}

// POST /api/expenses/import - Import expenses from CSV
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { csvData, propertyId } = body

    if (!csvData || !Array.isArray(csvData)) {
      return NextResponse.json(
        { error: "Invalid CSV data format" },
        { status: 400 }
      )
    }

    // Get owner's properties for mapping
    const properties = await prisma.property.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true, address: true },
    })

    if (properties.length === 0) {
      return NextResponse.json(
        { error: "No properties found. Please add properties first." },
        { status: 400 }
      )
    }

    // Create a map of property names/addresses to IDs
    const propertyMap = new Map<string, string>()
    properties.forEach((p) => {
      propertyMap.set(p.name.toLowerCase(), p.id)
      propertyMap.set(p.address.toLowerCase(), p.id)
    })

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    }

    const expensesToCreate: {
      amount: number
      date: Date
      category: string
      description: string
      vendorName: string | null
      propertyId: string
      ownerId: string
    }[] = []

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i] as CSVRow
      const rowNum = i + 1

      // Validate date
      const date = new Date(row.date)
      if (isNaN(date.getTime())) {
        results.errors.push(`Row ${rowNum}: Invalid date "${row.date}"`)
        results.skipped++
        continue
      }

      // Validate amount
      const amount = parseFloat(row.amount)
      if (isNaN(amount) || amount <= 0) {
        results.errors.push(`Row ${rowNum}: Invalid amount "${row.amount}"`)
        results.skipped++
        continue
      }

      // Validate category
      const category = row.category?.toUpperCase()
      if (!VALID_CATEGORIES.includes(category)) {
        results.errors.push(
          `Row ${rowNum}: Invalid category "${row.category}". Valid categories: ${VALID_CATEGORIES.join(", ")}`
        )
        results.skipped++
        continue
      }

      // Validate description
      if (!row.description?.trim()) {
        results.errors.push(`Row ${rowNum}: Missing description`)
        results.skipped++
        continue
      }

      // Resolve property
      let resolvedPropertyId = propertyId
      if (row.property) {
        const matchedId = propertyMap.get(row.property.toLowerCase())
        if (matchedId) {
          resolvedPropertyId = matchedId
        } else {
          results.errors.push(
            `Row ${rowNum}: Property "${row.property}" not found, using default property`
          )
        }
      }

      if (!resolvedPropertyId) {
        results.errors.push(
          `Row ${rowNum}: No property specified and no default property provided`
        )
        results.skipped++
        continue
      }

      expensesToCreate.push({
        amount,
        date,
        category,
        description: row.description.trim(),
        vendorName: row.vendor?.trim() || null,
        propertyId: resolvedPropertyId,
        ownerId: session.user.id,
      })
    }

    // Bulk create expenses
    if (expensesToCreate.length > 0) {
      await prisma.expense.createMany({
        data: expensesToCreate,
      })
      results.imported = expensesToCreate.length
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Imported ${results.imported} expenses. ${results.skipped} rows skipped.`,
    })
  } catch (error) {
    console.error("Error importing expenses:", error)
    return NextResponse.json(
      { error: "Failed to import expenses" },
      { status: 500 }
    )
  }
}
