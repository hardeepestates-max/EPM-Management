"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarClock, AlertCircle, AlertTriangle, Info, ChevronRight } from "lucide-react"

interface LeaseExpiration {
  leaseId: string
  unitId: string
  unitNumber: string
  tenant: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  leaseStart: string
  leaseEnd: string
  rentAmount: number
  daysUntilExpiry: number
  urgency: "critical" | "warning" | "notice"
  monthYear: string
}

interface ExpirationSummary {
  total: number
  critical: number
  warning: number
  notice: number
  totalRentAtRisk: number
}

interface LeaseExpirationTimelineProps {
  propertyId: string
  monthsAhead?: number
  compact?: boolean
}

export function LeaseExpirationTimeline({
  propertyId,
  monthsAhead = 6,
  compact = false
}: LeaseExpirationTimelineProps) {
  const [expirations, setExpirations] = useState<LeaseExpiration[]>([])
  const [byMonth, setByMonth] = useState<Record<string, LeaseExpiration[]>>({})
  const [summary, setSummary] = useState<ExpirationSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExpirations = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/properties/${propertyId}/lease-expirations?months=${monthsAhead}`
        )
        if (!response.ok) throw new Error("Failed to fetch expirations")

        const data = await response.json()
        setExpirations(data.expirations)
        setByMonth(data.byMonth)
        setSummary(data.summary)
      } catch (error) {
        console.error("Error fetching lease expirations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchExpirations()
  }, [propertyId, monthsAhead])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getUrgencyBadge = (urgency: string, days: number) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800 border-red-200",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
      notice: "bg-blue-100 text-blue-800 border-blue-200"
    }
    return (
      <Badge className={colors[urgency]}>
        {days} days
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="h-5 w-5" />
            Lease Expirations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (expirations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="h-5 w-5" />
            Lease Expirations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <CalendarClock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No leases expiring in the next {monthsAhead} months</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Compact view for sidebar/widget
  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Expiring Leases
            </span>
            {summary && summary.critical > 0 && (
              <Badge className="bg-red-100 text-red-800">
                {summary.critical} urgent
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {expirations.slice(0, 5).map((exp) => (
            <div
              key={exp.leaseId}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div className="flex items-center gap-2">
                {getUrgencyIcon(exp.urgency)}
                <div>
                  <div className="font-medium text-sm">{exp.unitNumber}</div>
                  <div className="text-xs text-gray-500">{exp.tenant.name}</div>
                </div>
              </div>
              {getUrgencyBadge(exp.urgency, exp.daysUntilExpiry)}
            </div>
          ))}
          {expirations.length > 5 && (
            <Button variant="ghost" className="w-full text-sm" size="sm">
              View all {expirations.length} expirations
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Full timeline view
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <CalendarClock className="h-5 w-5" />
            Lease Expirations Timeline
          </span>
          {summary && (
            <div className="flex gap-2 text-sm font-normal">
              {summary.critical > 0 && (
                <Badge className="bg-red-100 text-red-800">
                  {summary.critical} critical
                </Badge>
              )}
              {summary.warning > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  {summary.warning} warning
                </Badge>
              )}
              {summary.notice > 0 && (
                <Badge className="bg-blue-100 text-blue-800">
                  {summary.notice} upcoming
                </Badge>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        {summary && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-xs text-gray-500">Total Expiring</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
                <div className="text-xs text-gray-500">Within 30 Days</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{summary.warning}</div>
                <div className="text-xs text-gray-500">31-60 Days</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalRentAtRisk)}</div>
                <div className="text-xs text-gray-500">Monthly Rent at Risk</div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline by Month */}
        <div className="space-y-6">
          {Object.entries(byMonth).map(([month, leases]) => (
            <div key={month}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-sm font-medium text-gray-600 px-2">{month}</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="space-y-2">
                {leases.map((exp) => (
                  <div
                    key={exp.leaseId}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      exp.urgency === "critical"
                        ? "border-red-200 bg-red-50"
                        : exp.urgency === "warning"
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getUrgencyIcon(exp.urgency)}
                      <div>
                        <div className="font-medium">
                          Unit {exp.unitNumber} - {exp.tenant.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(exp.rentAmount)}/mo | Ends{" "}
                          {new Date(exp.leaseEnd).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getUrgencyBadge(exp.urgency, exp.daysUntilExpiry)}
                      <Button size="sm" variant="outline">
                        Renew
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
