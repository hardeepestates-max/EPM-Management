"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ExpenseForm } from "@/components/expenses/ExpenseForm"
import { ExpenseTable } from "@/components/expenses/ExpenseTable"
import { ExpenseImportModal } from "@/components/expenses/ExpenseImportModal"
import { ExpenseSummaryCards } from "@/components/expenses/ExpenseSummaryCards"
import { Plus, Upload, Download, Loader2, Filter } from "lucide-react"

const EXPENSE_CATEGORIES = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "REPAIRS", label: "Repairs" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "TAX", label: "Property Tax" },
  { value: "MORTGAGE", label: "Mortgage/Loan" },
  { value: "HOA", label: "HOA Fees" },
  { value: "LEGAL", label: "Legal/Professional" },
  { value: "ADVERTISING", label: "Advertising" },
  { value: "OTHER", label: "Other" },
]

interface Property {
  id: string
  name: string
  address: string
}

interface Expense {
  id: string
  amount: number
  date: string
  category: string
  description: string | null
  vendorName?: string | null
  notes?: string | null
  propertyId: string | null
  property: Property | null
}

interface CategorySummary {
  category: string
  amount: number
}

export default function ExpensesPage() {
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [summary, setSummary] = useState<{ total: number; byCategory: CategorySummary[] }>({
    total: 0,
    byCategory: [],
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  })

  // Filters
  const [propertyFilter, setPropertyFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/properties")
      const data = await res.json()
      setProperties(data.properties || data || [])
    } catch (error) {
      console.error("Error fetching properties:", error)
    }
  }

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", pagination.page.toString())
      params.set("limit", pagination.limit.toString())
      if (propertyFilter) params.set("propertyId", propertyFilter)
      if (categoryFilter) params.set("category", categoryFilter)
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)

      const res = await fetch(`/api/expenses?${params.toString()}`)
      const data = await res.json()

      setExpenses(data.expenses || [])
      setSummary(data.summary || { total: 0, byCategory: [] })
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      }))
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, propertyFilter, categoryFilter, startDate, endDate])

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const handleDelete = async (expense: Expense) => {
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchExpenses()
      }
    } catch (error) {
      console.error("Error deleting expense:", error)
    }
  }

  const handleExport = async () => {
    const params = new URLSearchParams()
    if (propertyFilter) params.set("propertyId", propertyFilter)
    if (categoryFilter) params.set("category", categoryFilter)
    if (startDate) params.set("startDate", startDate)
    if (endDate) params.set("endDate", endDate)

    window.location.href = `/api/expenses/export?${params.toString()}`
  }

  const clearFilters = () => {
    setPropertyFilter("")
    setCategoryFilter("")
    setStartDate("")
    setEndDate("")
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const hasFilters = propertyFilter || categoryFilter || startDate || endDate

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-slate-600">Track and manage property expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <ExpenseSummaryCards
        total={summary.total}
        byCategory={summary.byCategory}
        expenseCount={pagination.total}
        propertyCount={properties.length}
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="font-medium text-slate-700">Filters</span>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto text-slate-500"
            >
              Clear all
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Properties</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {EXPENSE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            type="date"
            placeholder="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Expense Table */}
      {loading ? (
        <div className="bg-white rounded-xl border p-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 mr-2" />
          <span className="text-slate-600">Loading expenses...</span>
        </div>
      ) : (
        <ExpenseTable
          expenses={expenses}
          onEdit={(expense) => setEditExpense(expense)}
          onDelete={handleDelete}
        />
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} expenses
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <ExpenseForm
        open={showAddModal || !!editExpense}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddModal(false)
            setEditExpense(null)
          }
        }}
        expense={editExpense}
        properties={properties}
        onSuccess={fetchExpenses}
      />

      {/* Import Modal */}
      <ExpenseImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        properties={properties}
        onSuccess={fetchExpenses}
      />
    </div>
  )
}
