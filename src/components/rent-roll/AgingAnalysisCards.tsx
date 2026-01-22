"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, AlertTriangle, Clock, CheckCircle } from "lucide-react"

interface AgingBucket {
  count: number
  amount: number
  tenants: Array<{
    propertyName: string
    unitNumber: string
    tenantName: string
    tenantEmail: string
    amount: number
    leaseId: string
  }>
}

interface AgingData {
  current: AgingBucket
  days30: AgingBucket
  days60: AgingBucket
  days90Plus: AgingBucket
}

interface AgingSummary {
  totalOutstanding: number
  delinquencyRate: number
  criticalCount: number
  criticalAmount: number
}

interface AgingAnalysisCardsProps {
  propertyId?: string
  showDetails?: boolean
}

export function AgingAnalysisCards({ propertyId, showDetails = false }: AgingAnalysisCardsProps) {
  const [aging, setAging] = useState<AgingData | null>(null)
  const [summary, setSummary] = useState<AgingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null)

  useEffect(() => {
    const fetchAging = async () => {
      try {
        setLoading(true)
        const url = propertyId
          ? `/api/rent-roll/aging?propertyId=${propertyId}`
          : "/api/rent-roll/aging"

        const response = await fetch(url)
        if (!response.ok) throw new Error("Failed to fetch aging")

        const data = await response.json()
        setAging(data.aging)
        setSummary(data.summary)
      } catch (error) {
        console.error("Error fetching aging analysis:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAging()
  }, [propertyId])

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
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!aging || !summary) {
    return null
  }

  const buckets = [
    {
      key: "current",
      label: "Current (0-30 Days)",
      data: aging.current,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      key: "days30",
      label: "31-60 Days",
      data: aging.days30,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      key: "days60",
      label: "61-90 Days",
      data: aging.days60,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    {
      key: "days90Plus",
      label: "90+ Days",
      data: aging.days90Plus,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    }
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {buckets.map((bucket) => (
          <Card
            key={bucket.key}
            className={`cursor-pointer transition-all hover:shadow-md ${
              expandedBucket === bucket.key ? bucket.borderColor + " border-2" : ""
            }`}
            onClick={() => setExpandedBucket(
              expandedBucket === bucket.key ? null : bucket.key
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {bucket.label}
              </CardTitle>
              <div className={`rounded-full p-2 ${bucket.bgColor}`}>
                <bucket.icon className={`h-4 w-4 ${bucket.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${bucket.color}`}>
                {formatCurrency(bucket.data.amount)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {bucket.data.count} {bucket.data.count === 1 ? "tenant" : "tenants"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expanded Details */}
      {showDetails && expandedBucket && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {buckets.find(b => b.key === expandedBucket)?.label} - Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aging[expandedBucket as keyof AgingData].tenants.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No outstanding balances</p>
            ) : (
              <div className="space-y-2">
                {aging[expandedBucket as keyof AgingData].tenants.slice(0, 10).map((tenant, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{tenant.tenantName}</div>
                      <div className="text-sm text-gray-500">
                        {tenant.propertyName} - Unit {tenant.unitNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-red-600">
                        {formatCurrency(tenant.amount)}
                      </div>
                      <div className="text-xs text-gray-500">{tenant.tenantEmail}</div>
                    </div>
                  </div>
                ))}
                {aging[expandedBucket as keyof AgingData].tenants.length > 10 && (
                  <p className="text-center text-sm text-gray-500 pt-2">
                    And {aging[expandedBucket as keyof AgingData].tenants.length - 10} more...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 justify-between">
            <div>
              <div className="text-sm text-gray-500">Total Outstanding</div>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalOutstanding)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Delinquency Rate</div>
              <div className="text-2xl font-bold">
                {summary.delinquencyRate}%
                {summary.delinquencyRate > 10 && (
                  <Badge className="ml-2 bg-red-100 text-red-800">High</Badge>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Critical (60+ Days)</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.criticalAmount)}
              </div>
              <div className="text-xs text-gray-500">{summary.criticalCount} tenants</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
