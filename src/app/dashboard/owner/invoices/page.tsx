"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { FileText, Download, CreditCard, Clock, CheckCircle, AlertCircle, Building, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  notes: string | null
  lineItems: LineItem[]
}

export default function OwnerInvoicesPage() {
  const searchParams = useSearchParams()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  useEffect(() => {
    fetchInvoices()

    // Check for payment success/cancel from URL params
    if (searchParams.get("success") === "true") {
      setPaymentSuccess(true)
      // Remove the query params from URL
      window.history.replaceState({}, "", "/dashboard/owner/invoices")
    }
  }, [searchParams])

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices")
      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch (error) {
      console.error("Error fetching invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayInvoice = async (paymentMethod: "card" | "ach") => {
    if (!selectedInvoice) return

    setProcessingPayment(true)
    try {
      const res = await fetch(`/api/invoices/${selectedInvoice.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod })
      })

      const data = await res.json()

      if (res.ok && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        alert(data.error || "Failed to initiate payment")
      }
    } catch (error) {
      console.error("Error initiating payment:", error)
      alert("Failed to initiate payment")
    } finally {
      setProcessingPayment(false)
      setShowPaymentModal(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "OVERDUE":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "OVERDUE":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Invoices</h1>
        <p className="text-slate-600">View and manage your property management invoices</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-xl font-bold">
                ${invoices
                  .filter(i => i.status === "PENDING")
                  .reduce((sum, i) => sum + i.totalAmount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Overdue</p>
              <p className="text-xl font-bold">
                ${invoices
                  .filter(i => i.status === "OVERDUE")
                  .reduce((sum, i) => sum + i.totalAmount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Paid This Year</p>
              <p className="text-xl font-bold">
                ${invoices
                  .filter(i => i.status === "PAID")
                  .reduce((sum, i) => sum + i.totalAmount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No invoices yet</h3>
          <p className="text-slate-600">Your invoices will appear here when created</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice List */}
          <div className="bg-white rounded-xl border">
            <div className="p-4 border-b">
              <h2 className="font-semibold">All Invoices</h2>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                    selectedInvoice?.id === invoice.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(invoice.status)}
                      <div>
                        <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-slate-500">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${invoice.totalAmount.toFixed(2)}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice Detail */}
          <div className="bg-white rounded-xl border">
            {selectedInvoice ? (
              <>
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold">Invoice Details</h2>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      {selectedInvoice.status !== "PAID" && (
                        <Button
                          size="sm"
                          onClick={() => setShowPaymentModal(true)}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Invoice Header */}
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                    <div>
                      <p className="text-sm text-slate-500">Invoice Number</p>
                      <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}>
                        {selectedInvoice.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Billing Period</p>
                      <p className="font-medium">
                        {new Date(selectedInvoice.periodStart).toLocaleDateString()} - {new Date(selectedInvoice.periodEnd).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Due Date</p>
                      <p className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-3">Line Items</h3>
                    <div className="space-y-2">
                      {selectedInvoice.lineItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-slate-500">
                              {item.quantity} x ${item.unitPrice.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-medium">${item.amount.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-semibold">Total Amount</p>
                      <p className="text-2xl font-bold">${selectedInvoice.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedInvoice.notes && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-slate-500">Notes</p>
                      <p className="text-slate-700">{selectedInvoice.notes}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Select an invoice to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Success Notification */}
      {paymentSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Payment Successful!</p>
              <p className="text-sm text-green-600">Your invoice has been paid.</p>
            </div>
            <button
              onClick={() => setPaymentSuccess(false)}
              className="ml-4 text-green-600 hover:text-green-800"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedInvoice && (
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-500">Invoice Total</p>
                <p className="text-2xl font-bold">${selectedInvoice.totalAmount.toFixed(2)}</p>
                <p className="text-sm text-slate-500">{selectedInvoice.invoiceNumber}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handlePayInvoice("card")}
                disabled={processingPayment}
                className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium">Pay with Card</p>
                    <p className="text-sm text-slate-500">Credit or debit card</p>
                  </div>
                </div>
                {processingPayment ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="text-sm text-slate-500">&rarr;</span>
                )}
              </button>

              <button
                onClick={() => handlePayInvoice("ach")}
                disabled={processingPayment}
                className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium">Pay with Bank Account (ACH)</p>
                    <p className="text-sm text-slate-500">Direct bank transfer - Lower fees</p>
                  </div>
                </div>
                {processingPayment ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="text-sm text-slate-500">&rarr;</span>
                )}
              </button>
            </div>

            <p className="text-xs text-center text-slate-500 mt-4">
              Payments are securely processed by Stripe
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
