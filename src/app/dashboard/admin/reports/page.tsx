"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PLStatement } from "@/components/reports/PLStatement"
import { BarChart3, Building, Users, Download, TrendingUp } from "lucide-react"

interface EPMReport {
  period: {
    type: string
    startDate: string
    endDate: string
    label: string
  }
  summary: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
    invoiceCount: number
    avgRevenuePerOwner: number
  }
  revenue: {
    managementFees: number
    flatFees: number
    otherFees: number
  }
  expenses: {
    payroll: number
    software: number
    marketing: number
    office: number
    insurance: number
    other: number
  }
  ownerBreakdown: Array<{
    ownerId: string
    ownerName: string
    managementFees: number
    otherFees: number
    totalRevenue: number
    invoiceCount: number
  }>
  monthlyTrend: Array<{
    month: string
    year: number
    revenue: number
  }>
  metrics: {
    activeProperties: number
    activeOwners: number
    avgFeePerProperty: number
  }
}

export default function AdminReportsPage() {
  const [report, setReport] = useState<EPMReport | null>(null)
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
        `/api/reports/epm-pl?period=${period}&year=${year}&month=${month}`
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
          <h1 className="text-3xl font-bold text-slate-900">Company Reports</h1>
          <p className="text-slate-600 mt-1">
            Elevate Property Management financial performance
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
            Export
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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="owners">
              <Users className="h-4 w-4 mr-2" />
              By Owner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(report.summary.totalRevenue)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {report.summary.invoiceCount} invoices paid
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Net Profit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    report.summary.netProfit >= 0 ? "text-blue-600" : "text-red-600"
                  }`}>
                    {formatCurrency(report.summary.netProfit)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {report.summary.profitMargin}% margin
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Properties Managed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {report.metrics.activeProperties}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(report.metrics.avgFeePerProperty)} avg fee
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Active Owners
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {report.metrics.activeOwners}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(report.summary.avgRevenuePerOwner)} avg revenue
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* P&L Statement */}
            <PLStatement
              title="Company Profit & Loss"
              period={report.period.label}
              income={[
                { label: "Management Fees", amount: report.revenue.managementFees },
                { label: "Flat Fees", amount: report.revenue.flatFees },
                { label: "Other Fees", amount: report.revenue.otherFees }
              ]}
              expenses={[
                { label: "Payroll", amount: report.expenses.payroll },
                { label: "Software & Technology", amount: report.expenses.software },
                { label: "Marketing", amount: report.expenses.marketing },
                { label: "Office & Rent", amount: report.expenses.office },
                { label: "Insurance", amount: report.expenses.insurance },
                { label: "Other", amount: report.expenses.other }
              ]}
              totalIncome={report.summary.totalRevenue}
              totalExpenses={report.summary.totalExpenses}
              netIncome={report.summary.netProfit}
            />

            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Trend (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 h-48">
                  {report.monthlyTrend.map((item, idx) => {
                    const maxRevenue = Math.max(...report.monthlyTrend.map(t => t.revenue))
                    const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-blue-500 rounded-t transition-all"
                          style={{ height: `${height}%`, minHeight: item.revenue > 0 ? "4px" : "0" }}
                        />
                        <div className="text-xs text-gray-500 mt-2">{item.month}</div>
                        <div className="text-xs font-medium">{formatCurrency(item.revenue)}</div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="owners">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Revenue by Owner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.ownerBreakdown.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No revenue recorded for this period
                    </p>
                  ) : (
                    report.ownerBreakdown.map((owner) => (
                      <div
                        key={owner.ownerId}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{owner.ownerName}</div>
                          <div className="text-sm text-gray-500">
                            {owner.invoiceCount} invoice{owner.invoiceCount !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {formatCurrency(owner.totalRevenue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(owner.managementFees)} fees
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
