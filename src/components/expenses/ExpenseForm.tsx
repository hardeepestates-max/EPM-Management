"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

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

interface ExpenseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense | null
  properties: Property[]
  onSuccess: () => void
}

export function ExpenseForm({
  open,
  onOpenChange,
  expense,
  properties,
  onSuccess,
}: ExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category: "",
    description: "",
    vendorName: "",
    notes: "",
    propertyId: "",
  })

  useEffect(() => {
    if (expense) {
      setFormData({
        amount: expense.amount.toString(),
        date: new Date(expense.date).toISOString().split("T")[0],
        category: expense.category,
        description: expense.description || "",
        vendorName: expense.vendorName || "",
        notes: expense.notes || "",
        propertyId: expense.propertyId || "",
      })
    } else {
      setFormData({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        category: "",
        description: "",
        vendorName: "",
        notes: "",
        propertyId: properties[0]?.id || "",
      })
    }
    setError("")
  }, [expense, properties, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const url = expense
        ? `/api/expenses/${expense.id}`
        : "/api/expenses"
      const method = expense ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save expense")
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {expense ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyId">Property *</Label>
              <Select
                value={formData.propertyId}
                onValueChange={(value) =>
                  setFormData({ ...formData, propertyId: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="e.g., Plumbing repair, Electric bill"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorName">Vendor Name</Label>
            <Input
              id="vendorName"
              placeholder="e.g., ABC Plumbing, PSE&G"
              value={formData.vendorName}
              onChange={(e) =>
                setFormData({ ...formData, vendorName: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {expense ? "Save Changes" : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
