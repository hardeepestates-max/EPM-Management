"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, AlertTriangle, Home } from "lucide-react"

interface FinancialSummary {
  totalUnits: number
  occupiedUnits: number
  vacantUnits: number
  occupancyRate: number
  totalRentExpected: number
  totalRentCollected: number
  totalPending: number
  totalOverdue: number
  vacancyLoss: number
  collectionRate: number
  period: {
    start: string
    end: string
  }
}

interface FinancialSummaryCardsProps {
  propertyId: string
  month?: string // Format: YYYY-MM
}

export function FinancialSummaryCards({ propertyId, month }: FinancialSummaryCardsProps) {
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true)
        const url = month
          ? `/api/properties/${propertyId}/financial-summary?month=${month}`
          : `/api/properties/${propertyId}/financial-summary`

        const response = await fetch(url)
        if (!response.ok) throw new Error("Failed to fetch summary")

        const data = await response.json()
        setSummary(data.summary)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [propertyId, month])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-4 bg-gray-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-20 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error || "Failed to load financial summary"}
      </div>
    )
  }

  const cards = [
    {
      title: "Total Rent Expected",
      value: formatCurrency(summary.totalRentExpected),
      description: `${summary.occupiedUnits} of ${summary.totalUnits} units occupied`,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Rent Collected",
      value: formatCurrency(summary.totalRentCollected),
      description: `${summary.collectionRate}% collection rate`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Outstanding Balance",
      value: formatCurrency(summary.totalPending + summary.totalOverdue),
      description: summary.totalOverdue > 0
        ? `${formatCurrency(summary.totalOverdue)} overdue`
        : "All current",
      icon: AlertTriangle,
      color: summary.totalOverdue > 0 ? "text-red-600" : "text-yellow-600",
      bgColor: summary.totalOverdue > 0 ? "bg-red-50" : "bg-yellow-50"
    },
    {
      title: "Occupancy",
      value: `${summary.occupancyRate}%`,
      description: summary.vacantUnits > 0
        ? `${summary.vacantUnits} vacant (${formatCurrency(summary.vacancyLoss)} loss)`
        : "Fully occupied",
      icon: Home,
      color: summary.occupancyRate >= 90 ? "text-green-600" : "text-orange-600",
      bgColor: summary.occupancyRate >= 90 ? "bg-green-50" : "bg-orange-50"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <div className={`rounded-full p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-gray-500 mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
