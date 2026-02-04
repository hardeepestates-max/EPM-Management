"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Landmark,
  ExternalLink,
  DollarSign,
  Clock,
  RefreshCw,
} from "lucide-react"

interface BankAccount {
  id: string
  type: string
  bankName: string
  last4: string
  currency: string
}

interface ConnectStatus {
  connected: boolean
  status: string | null
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  externalAccounts?: BankAccount[]
}

interface Payout {
  id: string
  amount: number
  status: string
  arrivalDate: number
  created: number
  method: string
  description: string | null
}

interface PayoutData {
  balance: {
    available: number
    pending: number
  }
  payouts: Payout[]
}

export default function PayoutsPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [connectLoading, setConnectLoading] = useState(false)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null)
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setMessage({ type: "success", text: "Bank account setup completed successfully!" })
    } else if (searchParams.get("refresh") === "true") {
      setMessage({ type: "error", text: "Please complete the onboarding process." })
    }
  }, [searchParams])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [connectRes, payoutsRes] = await Promise.all([
        fetch("/api/owner/payouts/connect"),
        fetch("/api/owner/payouts"),
      ])

      const connectData = await connectRes.json()
      const payoutsData = await payoutsRes.json()

      setConnectStatus(connectData)
      setPayoutData(payoutsData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleConnectBank = async () => {
    setConnectLoading(true)
    try {
      const res = await fetch("/api/owner/payouts/connect", {
        method: "POST",
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || "Failed to create onboarding link")
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to start setup",
      })
      setConnectLoading(false)
    }
  }

  const handleOpenDashboard = async () => {
    setDashboardLoading(true)
    try {
      const res = await fetch("/api/owner/payouts/dashboard", {
        method: "POST",
      })
      const data = await res.json()

      if (data.url) {
        window.open(data.url, "_blank")
      } else {
        throw new Error(data.error || "Failed to open dashboard")
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to open dashboard",
      })
    } finally {
      setDashboardLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      in_transit: "bg-blue-100 text-blue-800",
      canceled: "bg-red-100 text-red-800",
      failed: "bg-red-100 text-red-800",
    }

    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
        {status.replace("_", " ")}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payouts</h1>
          <p className="text-slate-600">
            Manage your bank account and view payout history
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Bank Account Status */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Landmark className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Bank Account for Payouts
              </h2>
              {connectStatus?.connected && connectStatus.status === "active" ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Connected and ready to receive payouts</span>
                </div>
              ) : connectStatus?.connected && connectStatus.status === "pending" ? (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Clock className="h-4 w-4" />
                  <span>Setup in progress - complete onboarding</span>
                </div>
              ) : (
                <p className="text-slate-500">
                  Connect your bank account to receive rent payments
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {connectStatus?.connected && connectStatus.status === "active" && (
              <Button
                variant="outline"
                onClick={handleOpenDashboard}
                disabled={dashboardLoading}
              >
                {dashboardLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Manage in Stripe
              </Button>
            )}
            <Button onClick={handleConnectBank} disabled={connectLoading}>
              {connectLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Landmark className="h-4 w-4 mr-2" />
              )}
              {connectStatus?.connected
                ? connectStatus.status === "active"
                  ? "Update Bank"
                  : "Complete Setup"
                : "Connect Bank Account"}
            </Button>
          </div>
        </div>

        {/* Connected Bank Accounts */}
        {connectStatus?.externalAccounts && connectStatus.externalAccounts.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-slate-700 mb-2">
              Connected Accounts
            </p>
            <div className="space-y-2">
              {connectStatus.externalAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <Landmark className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="font-medium">{account.bankName}</p>
                    <p className="text-sm text-slate-500">
                      Account ending in {account.last4}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Balance Cards */}
      {connectStatus?.connected && connectStatus.status === "active" && payoutData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Available Balance</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(payoutData.balance.available)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Ready to be paid out
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending Balance</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {formatCurrency(payoutData.balance.pending)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Processing (usually 2-7 business days)
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout History */}
      {connectStatus?.connected && connectStatus.status === "active" && (
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-slate-900">Payout History</h3>
          </div>

          {payoutData?.payouts && payoutData.payouts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Arrival Date</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutData.payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>{formatDate(payout.created)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payout.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    <TableCell>{formatDate(payout.arrivalDate)}</TableCell>
                    <TableCell className="capitalize">{payout.method}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-slate-500">
              No payouts yet. Payouts are automatically processed when tenants pay rent.
            </div>
          )}
        </div>
      )}

      {/* Setup Required Message */}
      {(!connectStatus?.connected || connectStatus.status !== "active") && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Landmark className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Set Up Your Bank Account
          </h3>
          <p className="text-slate-600 mb-4 max-w-md mx-auto">
            Connect your bank account to receive rent payments from tenants.
            The setup process is quick and secure, powered by Stripe.
          </p>
          <Button onClick={handleConnectBank} disabled={connectLoading}>
            {connectLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Landmark className="h-4 w-4 mr-2" />
            )}
            Get Started
          </Button>
        </div>
      )}
    </div>
  )
}
