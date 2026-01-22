"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, Search, Building } from "lucide-react"
import Link from "next/link"

interface Tenant {
  id: string
  name: string
  email: string
  phone: string | null
}

interface RentRollItem {
  propertyId: string
  propertyName: string
  propertyAddress: string
  owner: { id: string; name: string; email: string }
  unitId: string
  unitNumber: string
  status: string
  bedrooms: number
  bathrooms: number
  sqft: number | null
  marketRent: number
  leaseRent: number | null
  tenant: Tenant | null
  leaseId: string | null
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
  totalProperties: number
  totalUnits: number
  occupiedUnits: number
  vacantUnits: number
  totalMarketRent: number
  totalLeaseRent: number
  totalBalance: number
  agingTotals: {
    current: number
    days30: number
    days60: number
    days90Plus: number
  }
  occupancyRate: number
}

interface PortfolioRentRollTableProps {
  initialPropertyId?: string
}

export function PortfolioRentRollTable({ initialPropertyId }: PortfolioRentRollTableProps) {
  const [rentRoll, setRentRoll] = useState<RentRollItem[]>([])
  const [filteredRentRoll, setFilteredRentRoll] = useState<RentRollItem[]>([])
  const [totals, setTotals] = useState<RentRollTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [propertyFilter, setPropertyFilter] = useState<string>(initialPropertyId || "all")
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetchRentRoll()
  }, [])

  useEffect(() => {
    filterRentRoll()
  }, [rentRoll, search, statusFilter, propertyFilter])

  const fetchRentRoll = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/rent-roll")
      if (!response.ok) throw new Error("Failed to fetch rent roll")

      const data = await response.json()
      setRentRoll(data.rentRoll)
      setTotals(data.totals)

      // Extract unique properties
      const uniqueProperties = Array.from(
        new Map(data.rentRoll.map((item: RentRollItem) => [
          item.propertyId,
          { id: item.propertyId, name: item.propertyName }
        ])).values()
      )
      setProperties(uniqueProperties as { id: string; name: string }[])
    } catch (error) {
      console.error("Error fetching rent roll:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterRentRoll = () => {
    let filtered = [...rentRoll]

    // Property filter
    if (propertyFilter !== "all") {
      filtered = filtered.filter(item => item.propertyId === propertyFilter)
    }

    // Status filter
    if (statusFilter === "occupied") {
      filtered = filtered.filter(item => item.tenant !== null)
    } else if (statusFilter === "vacant") {
      filtered = filtered.filter(item => item.tenant === null)
    } else if (statusFilter === "overdue") {
      filtered = filtered.filter(item => item.currentBalance > 0)
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(item =>
        item.propertyName.toLowerCase().includes(searchLower) ||
        item.unitNumber.toLowerCase().includes(searchLower) ||
        item.tenant?.name.toLowerCase().includes(searchLower) ||
        item.tenant?.email.toLowerCase().includes(searchLower)
      )
    }

    setFilteredRentRoll(filtered)
  }

  const handleExport = async () => {
    try {
      const url = propertyFilter !== "all"
        ? `/api/rent-roll/export?propertyId=${propertyFilter}&format=csv`
        : "/api/rent-roll/export?format=csv"

      const response = await fetch(url)
      const blob = await response.blob()

      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `rent-roll-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting rent roll:", error)
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: "bg-green-100 text-green-800",
      OCCUPIED: "bg-blue-100 text-blue-800",
      MAINTENANCE: "bg-yellow-100 text-yellow-800"
    }
    return <Badge className={colors[status]}>{status}</Badge>
  }

  const getBalanceColor = (balance: number, aging: RentRollItem["aging"]) => {
    if (balance === 0) return "text-green-600"
    if (aging.days90Plus > 0) return "text-red-600"
    if (aging.days60 > 0) return "text-orange-600"
    if (aging.days30 > 0) return "text-yellow-600"
    return "text-gray-900"
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="flex gap-4">
          <div className="h-10 w-64 bg-gray-200 rounded" />
          <div className="h-10 w-40 bg-gray-200 rounded" />
          <div className="h-10 w-40 bg-gray-200 rounded" />
        </div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search properties, units, tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={propertyFilter} onValueChange={setPropertyFilter}>
          <SelectTrigger className="w-[200px]">
            <Building className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Units</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="vacant">Vacant</SelectItem>
            <SelectItem value="overdue">Outstanding</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Stats */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-500">Properties</div>
            <div className="text-xl font-bold">{totals.totalProperties}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Units</div>
            <div className="text-xl font-bold">
              {totals.occupiedUnits}/{totals.totalUnits}
              <span className="text-sm font-normal text-gray-500 ml-1">
                ({totals.occupancyRate}%)
              </span>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Monthly Rent</div>
            <div className="text-xl font-bold">{formatCurrency(totals.totalLeaseRent)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Outstanding</div>
            <div className={`text-xl font-bold ${totals.totalBalance > 0 ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(totals.totalBalance)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Vacant Units</div>
            <div className="text-xl font-bold text-orange-600">{totals.vacantUnits}</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead className="text-right">Rent</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Lease End</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRentRoll.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No units found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredRentRoll.map((item) => (
                <TableRow key={`${item.propertyId}-${item.unitId}`}>
                  <TableCell>
                    <Link
                      href={`/dashboard/admin/properties/${item.propertyId}`}
                      className="hover:underline"
                    >
                      <div className="font-medium">{item.propertyName}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">
                        {item.propertyAddress}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.unitNumber}</div>
                    <div className="text-xs text-gray-500">
                      {item.bedrooms}bd / {item.bathrooms}ba
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
                      <div className="text-yellow-600 text-sm">
                        Invite pending
                        <div className="text-xs">{item.pendingInvite.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Vacant</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.leaseRent || item.marketRent)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${getBalanceColor(item.currentBalance, item.aging)}`}>
                      {item.currentBalance > 0 ? formatCurrency(item.currentBalance) : "Paid"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.leaseEnd ? formatDate(item.leaseEnd) : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filteredRentRoll.length} of {rentRoll.length} units
      </div>
    </div>
  )
}
