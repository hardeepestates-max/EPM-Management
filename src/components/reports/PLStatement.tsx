"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"

interface PLStatementProps {
  title: string
  period: string
  income: {
    label: string
    amount: number
  }[]
  expenses: {
    label: string
    amount: number
  }[]
  totalIncome: number
  totalExpenses: number
  netIncome: number
}

export function PLStatement({
  title,
  period,
  income,
  expenses,
  totalIncome,
  totalExpenses,
  netIncome
}: PLStatementProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const profitMargin = totalIncome > 0
    ? Math.round((netIncome / totalIncome) * 1000) / 10
    : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">{period}</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            netIncome >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {netIncome >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="font-medium">{profitMargin}% margin</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Total Income</span>
            </div>
            <div className="text-2xl font-bold text-green-800">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-medium">Total Expenses</span>
            </div>
            <div className="text-2xl font-bold text-red-800">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          <div className={`p-4 rounded-lg ${netIncome >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
            <div className={`flex items-center gap-2 mb-1 ${
              netIncome >= 0 ? "text-blue-700" : "text-orange-700"
            }`}>
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Net Income</span>
            </div>
            <div className={`text-2xl font-bold ${
              netIncome >= 0 ? "text-blue-800" : "text-orange-800"
            }`}>
              {formatCurrency(netIncome)}
            </div>
          </div>
        </div>

        <Separator />

        {/* Detailed Breakdown */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Income Section */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Income
            </h3>
            <div className="space-y-3">
              {income.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center font-semibold">
                <span>Total Income</span>
                <span className="text-green-600">{formatCurrency(totalIncome)}</span>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Expenses
            </h3>
            <div className="space-y-3">
              {expenses.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center font-semibold">
                <span>Total Expenses</span>
                <span className="text-red-600">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Net Income */}
        <div className={`p-4 rounded-lg ${netIncome >= 0 ? "bg-green-50" : "bg-red-50"}`}>
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Net Operating Income (NOI)</span>
            <span className={`text-2xl font-bold ${
              netIncome >= 0 ? "text-green-700" : "text-red-700"
            }`}>
              {formatCurrency(netIncome)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
