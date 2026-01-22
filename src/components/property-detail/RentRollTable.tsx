"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Mail, CreditCard, FileText, UserPlus } from "lucide-react"

interface Tenant {
  id: string
  name: string
  email: string
  phone: string | null
}

interface RentRollItem {
  unitId: string
  unitNumber: string
  status: string
  bedrooms: number
  bathrooms: number
  sqft: number | null
  marketRent: number
  leaseRent: number | null
  tenant: Tenant | null
  leaseId?: string
  leaseStart: string | null
  leaseEnd: string | null
  currentBalance: number
  lastPaymentDate: string | null
  lastPaymentAmount: number | null
  pendingInvite: { email: string; status: string } | null
  aging: {
    current: number
    days30: number
    days60: number
    days90Plus: number
  }
}

interface RentRollTotals {
  totalUnits: number
  occupiedUnits: number
  totalMarketRent: number
  totalLeaseRent: number
  totalBalance: number
  agingTotals: {
    current: number
    days30: number
    days60: number
    days90Plus: number
  }
}

interface RentRollTableProps {
  propertyId: string
  onInviteTenant?: (unitId: string) => void
  onRecordPayment?: (leaseId: string, tenantName: string) => void
}

export function RentRollTable({
  propertyId,
  onInviteTenant,
  onRecordPayment
}: RentRollTableProps) {
  const [rentRoll, setRentRoll] = useState<RentRollItem[]>([])
  const [totals, setTotals] = useState<RentRollTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "current" | "overdue">("all")

  useEffect(() => {
    const fetchRentRoll = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/properties/${propertyId}/rent-roll?status=${filter}`
        )
        if (!response.ok) throw new Error("Failed to fetch rent roll")

        const data = await response.json()
        setRentRoll(data.rentRoll)
        setTotals(data.totals)
      } catch (error) {
        console.error("Error fetching rent roll:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRentRoll()
  }, [propertyId, filter])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      AVAILABLE: "outline",
      OCCUPIED: "default",
      MAINTENANCE: "secondary"
    }
    const colors: Record<string, string> = {
      AVAILABLE: "bg-green-100 text-green-800 border-green-200",
      OCCUPIED: "bg-blue-100 text-blue-800 border-blue-200",
      MAINTENANCE: "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
    return (
      <Badge variant={variants[status] || "outline"} className={colors[status]}>
        {status}
      </Badge>
    )
  }

  const getBalanceBadge = (balance: number, aging: RentRollItem["aging"]) => {
    if (balance === 0) {
      return <Badge className="bg-green-100 text-green-800">Current</Badge>
    }

    if (aging.days90Plus > 0) {
      return <Badge className="bg-red-100 text-red-800">90+ Days</Badge>
    }
    if (aging.days60 > 0) {
      return <Badge className="bg-orange-100 text-orange-800">60+ Days</Badge>
    }
    if (aging.days30 > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">30+ Days</Badge>
    }
    return <Badge className="bg-blue-100 text-blue-800">Current</Badge>
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-full" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All Units ({totals?.totalUnits || 0})
        </Button>
        <Button
          variant={filter === "current" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("current")}
        >
          Current
        </Button>
        <Button
          variant={filter === "overdue" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("overdue")}
          className={filter === "overdue" ? "" : totals?.totalBalance && totals.totalBalance > 0 ? "text-red-600" : ""}
        >
          Outstanding {totals?.totalBalance ? `(${formatCurrency(totals.totalBalance)})` : ""}
        </Button>
      </div>

      {/* Rent Roll Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead className="text-right">Rent</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Last Payment</TableHead>
              <TableHead>Lease End</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rentRoll.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No units found
                </TableCell>
              </TableRow>
            ) : (
              rentRoll.map((item) => (
                <TableRow key={item.unitId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.unitNumber}</div>
                      <div className="text-xs text-gray-500">
                        {item.bedrooms}bd / {item.bathrooms}ba
                        {item.sqft && ` / ${item.sqft} sqft`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    {item.tenant ? (
                      <div>
                        <div className="font-medium">{item.tenant.name}</div>
                        <div className="text-xs text-gray-500">{item.tenant.email}</div>
                      </div>
                    ) : item.pendingInvite ? (
                      <div className="text-yellow-600">
                        <div className="text-sm">Invite Pending</div>
                        <div className="text-xs">{item.pendingInvite.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Vacant</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium">
                      {formatCurrency(item.leaseRent || item.marketRent)}
                    </div>
                    {item.leaseRent && item.leaseRent !== item.marketRent && (
                      <div className="text-xs text-gray-500">
                        Market: {formatCurrency(item.marketRent)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.tenant ? (
                      <div>
                        <div className={`font-medium ${item.currentBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                          {item.currentBalance > 0 ? formatCurrency(item.currentBalance) : "Paid"}
                        </div>
                        {item.currentBalance > 0 && (
                          <div className="mt-1">
                            {getBalanceBadge(item.currentBalance, item.aging)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.lastPaymentDate ? (
                      <div>
                        <div className="text-sm">{formatDate(item.lastPaymentDate)}</div>
                        <div className="text-xs text-gray-500">
                          {item.lastPaymentAmount && formatCurrency(item.lastPaymentAmount)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.leaseEnd ? (
                      <div className="text-sm">{formatDate(item.leaseEnd)}</div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {item.tenant ? (
                          <>
                            <DropdownMenuItem
                              onClick={() => onRecordPayment?.(item.leaseId!, item.tenant!.name)}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Record Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Reminder
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              View Lease
                            </DropdownMenuItem>
                          </>
                        ) : !item.pendingInvite ? (
                          <DropdownMenuItem
                            onClick={() => onInviteTenant?.(item.unitId)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite Tenant
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Resend Invite
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Totals Row */}
      {totals && (
        <div className="flex justify-between items-center bg-gray-50 rounded-lg p-4 text-sm">
          <div>
            <span className="text-gray-600">Total: </span>
            <span className="font-medium">{totals.occupiedUnits}/{totals.totalUnits} units occupied</span>
          </div>
          <div className="flex gap-6">
            <div>
              <span className="text-gray-600">Monthly Rent: </span>
              <span className="font-medium">{formatCurrency(totals.totalLeaseRent)}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Due: </span>
              <span className={`font-medium ${totals.totalBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(totals.totalBalance)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
