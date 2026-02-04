"use client"

import { DollarSign, TrendingUp, Building, Calendar } from "lucide-react"

const CATEGORY_LABELS: Record<string, string> = {
  MAINTENANCE: "Maintenance",
  REPAIRS: "Repairs",
  UTILITIES: "Utilities",
  INSURANCE: "Insurance",
  TAX: "Property Tax",
  MORTGAGE: "Mortgage",
  HOA: "HOA Fees",
  LEGAL: "Legal",
  ADVERTISING: "Advertising",
  OTHER: "Other",
}

interface CategorySummary {
  category: string
  amount: number
}

interface ExpenseSummaryCardsProps {
  total: number
  byCategory: CategorySummary[]
  expenseCount: number
  propertyCount: number
}

export function ExpenseSummaryCards({
  total,
  byCategory,
  expenseCount,
  propertyCount,
}: ExpenseSummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get top 3 categories by amount
  const topCategories = [...byCategory]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Expenses */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Total Expenses</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(total)}
            </p>
          </div>
          <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Expense Count */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Total Entries</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {expenseCount}
            </p>
          </div>
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Properties</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {propertyCount}
            </p>
          </div>
          <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Building className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Top Category */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Top Category</p>
            {topCategories.length > 0 ? (
              <>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {CATEGORY_LABELS[topCategories[0].category] || topCategories[0].category}
                </p>
                <p className="text-sm text-slate-500">
                  {formatCurrency(topCategories[0].amount)}
                </p>
              </>
            ) : (
              <p className="text-lg font-medium text-slate-400 mt-1">No data</p>
            )}
          </div>
          <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
