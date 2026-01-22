"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PLStatement } from "@/components/reports/PLStatement"
import { BarChart3, Building, Download, TrendingUp, TrendingDown } from "lucide-react"

interface OwnerReport {
  owner: {
    id: string
    name: string
    email: string
  }
  period: {
    type: string
    startDate: string
    endDate: string
    label: string
  }
  summary: {
    totalIncome: number
    totalExpenses: number
    netOperatingIncome: number
    profitMargin: number
  }
  income: {
    rentCollected: number
    lateFees: number
    otherIncome: number
  }
  expenses: {
    managementFees: number
    maintenance: number
    repairs: number
    utilities: number
    insurance: number
    taxes: number
    other: number
  }
  propertyBreakdown: Array<{
    propertyId: string
    propertyName: string
    address: string
    totalUnits: number
    occupiedUnits: number
    income: number
    expenses: number
    noi: number
  }>
  propertyCount: number
}

export default function OwnerReportsPage() {
  const [report, setReport] = useState<OwnerReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("month")
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    fetchReport()
  }, [period, year, month])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/reports/owner-pl?period=${period}&year=${year}&month=${month}`
      )
      if (!response.ok) throw new Error("Failed to fetch report")
      const data = await response.json()
      setReport(data.report)
    } catch (error) {
      console.error("Error fetching report:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Financial Reports</h1>
          <p className="text-slate-600 mt-1">
            View profit & loss statements for your properties
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>

          {period === "month" && (
            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, idx) => (
                  <SelectItem key={idx} value={(idx + 1).toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(report.summary.totalIncome)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(report.income.rentCollected)} rent collected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(report.summary.totalExpenses)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(report.expenses.managementFees)} mgmt fees
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Net Operating Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  report.summary.netOperatingIncome >= 0 ? "text-blue-600" : "text-red-600"
                }`}>
                  {formatCurrency(report.summary.netOperatingIncome)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {report.summary.profitMargin}% profit margin
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.propertyCount}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Active properties
                </p>
              </CardContent>
            </Card>
          </div>

          {/* P&L Statement */}
          <PLStatement
            title="Profit & Loss Statement"
            period={report.period.label}
            income={[
              { label: "Rent Collected", amount: report.income.rentCollected },
              { label: "Late Fees", amount: report.income.lateFees },
              { label: "Other Income", amount: report.income.otherIncome }
            ]}
            expenses={[
              { label: "Management Fees", amount: report.expenses.managementFees },
              { label: "Maintenance", amount: report.expenses.maintenance },
              { label: "Repairs", amount: report.expenses.repairs },
              { label: "Utilities", amount: report.expenses.utilities },
              { label: "Insurance", amount: report.expenses.insurance },
              { label: "Taxes", amount: report.expenses.taxes },
              { label: "Other", amount: report.expenses.other }
            ]}
            totalIncome={report.summary.totalIncome}
            totalExpenses={report.summary.totalExpenses}
            netIncome={report.summary.netOperatingIncome}
          />

          {/* Property Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Performance by Property
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.propertyBreakdown.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No property data for this period
                </p>
              ) : (
                <div className="space-y-4">
                  {report.propertyBreakdown.map((property) => (
                    <div
                      key={property.propertyId}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{property.propertyName}</h3>
                          <p className="text-sm text-gray-500">{property.address}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          property.noi >= 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          NOI: {formatCurrency(property.noi)}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Units</span>
                          <p className="font-medium">
                            {property.occupiedUnits}/{property.totalUnits} occupied
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Income</span>
                          <p className="font-medium text-green-600">
                            {formatCurrency(property.income)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Expenses</span>
                          <p className="font-medium text-red-600">
                            {formatCurrency(property.expenses)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Occupancy</span>
                          <p className="font-medium">
                            {property.totalUnits > 0
                              ? Math.round((property.occupiedUnits / property.totalUnits) * 100)
                              : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Failed to load report data
          </CardContent>
        </Card>
      )}
    </div>
  )
}
