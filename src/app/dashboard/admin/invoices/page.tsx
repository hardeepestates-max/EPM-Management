"use client"

import { useState, useEffect } from "react"
import { FileText, Plus, DollarSign, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
  type: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  periodStart: string
  periodEnd: string
  subtotal: number
  totalAmount: number
  status: string
  dueDate: string
  paidDate: string | null
  owner: { id: string; name: string; email: string }
  lineItems: LineItem[]
}

interface Owner {
  id: string
  name: string
  email: string
  monthlyRevenue: number
  billingSettings: { managementFeePercent: number }
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)

  // Form state
  const [selectedOwner, setSelectedOwner] = useState("")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [lineItems, setLineItems] = useState<LineItem[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [invoicesRes, ownersRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/billing"),
      ])
      const invoicesData = await invoicesRes.json()
      const ownersData = await ownersRes.json()

      setInvoices(invoicesData.invoices || [])
      setOwners(ownersData.owners || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const addLineItem = (type: string) => {
    if (type === "management_fee" && selectedOwner) {
      const owner = owners.find(o => o.id === selectedOwner)
      if (owner) {
        const feePercent = owner.billingSettings.managementFeePercent
        const amount = (owner.monthlyRevenue * feePercent) / 100
        setLineItems([
          ...lineItems,
          {
            description: `Management Fee (${feePercent}% of $${owner.monthlyRevenue.toLocaleString()})`,
            quantity: 1,
            unitPrice: amount,
            amount,
            type: "management_fee",
          },
        ])
      }
    } else {
      setLineItems([
        ...lineItems,
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          amount: 0,
          type: "flat_fee",
        },
      ])
    }
  }

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }

    // Recalculate amount
    if (field === "quantity" || field === "unitPrice") {
      updated[index].amount = updated[index].quantity * updated[index].unitPrice
    }

    setLineItems(updated)
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0)
  }

  const handleCreate = async () => {
    if (!selectedOwner || !periodStart || !periodEnd || !dueDate || lineItems.length === 0) {
      alert("Please fill in all required fields and add at least one line item")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: selectedOwner,
          periodStart,
          periodEnd,
          dueDate,
          notes,
          lineItems,
        }),
      })

      if (res.ok) {
        setShowCreateDialog(false)
        resetForm()
        fetchData()
      }
    } catch (error) {
      console.error("Error creating invoice:", error)
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setSelectedOwner("")
    setPeriodStart("")
    setPeriodEnd("")
    setDueDate("")
    setNotes("")
    setLineItems([])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID": return "bg-green-100 text-green-800"
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "OVERDUE": return "bg-red-100 text-red-800"
      default: return "bg-slate-100 text-slate-800"
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Owner Invoices</h1>
          <p className="text-slate-600">Create and manage invoices for property owners</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Create an invoice for a property owner
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Owner Selection */}
              <div>
                <Label>Property Owner</Label>
                <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name} - ${owner.monthlyRevenue.toLocaleString()}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Period Start</Label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Period End</Label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Line Items</Label>
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addLineItem("management_fee")}
                      disabled={!selectedOwner}
                    >
                      + Management Fee
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addLineItem("flat_fee")}
                    >
                      + Custom Charge
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, "description", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
                        className="w-20"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-28"
                      />
                      <div className="w-24 text-right font-medium">
                        ${item.amount.toFixed(2)}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}

                  {lineItems.length === 0 && (
                    <p className="text-center text-slate-500 py-4">
                      Add line items using the buttons above
                    </p>
                  )}
                </div>

                {lineItems.length > 0 && (
                  <div className="flex justify-end mt-4 pt-4 border-t">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Total</p>
                      <p className="text-2xl font-bold">${calculateTotal().toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes for the invoice"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No invoices yet</h3>
          <p className="text-slate-600">Create your first invoice to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border">
          <div className="divide-y">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="p-4 hover:bg-slate-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-3">
                      <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{invoice.owner.name}</p>
                    <p className="text-sm text-slate-500">
                      Period: {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-500">
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${invoice.totalAmount.toFixed(2)}</p>
                    <p className="text-sm text-slate-500">{invoice.lineItems.length} items</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
