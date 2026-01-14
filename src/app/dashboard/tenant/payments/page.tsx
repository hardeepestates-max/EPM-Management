"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { CreditCard, CheckCircle, Clock, AlertCircle, Building, Landmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Payment {
  id: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: string
  paymentMethod: string | null
  convenienceFee: number | null
  totalPaid: number | null
  lease: {
    unit: {
      unitNumber: string
      property: {
        name: string
      }
    }
  }
}

const CARD_FEE_PERCENT = 2.9
const ACH_FEE = 1.50

export default function TenantPaymentsPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach" | null>(null)
  const [processing, setProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    fetchPayments()

    // Check for success parameter
    if (searchParams.get("success") === "true") {
      setShowSuccess(true)
    }
  }, [searchParams])

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/payments/tenant")
      const data = await res.json()
      setPayments(data.payments || [])
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateFee = (amount: number, method: "card" | "ach") => {
    if (method === "card") {
      return Math.round((amount * CARD_FEE_PERCENT / 100) * 100) / 100
    }
    return ACH_FEE
  }

  const handlePayment = async () => {
    if (!selectedPayment || !paymentMethod) return

    setProcessing(true)
    try {
      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          paymentMethod,
        }),
      })

      const data = await res.json()

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error(data.error || "Failed to create checkout")
      }
    } catch (error) {
      console.error("Error creating checkout:", error)
      alert("Failed to process payment. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID": return <CheckCircle className="h-5 w-5 text-green-600" />
      case "PENDING": return <Clock className="h-5 w-5 text-yellow-600" />
      case "OVERDUE": return <AlertCircle className="h-5 w-5 text-red-600" />
      default: return <Clock className="h-5 w-5 text-slate-400" />
    }
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
    return (
      <div className="p-6">
        <p>Loading payments...</p>
      </div>
    )
  }

  const pendingPayments = payments.filter(p => p.status === "PENDING" || p.status === "OVERDUE")
  const completedPayments = payments.filter(p => p.status === "PAID")

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-600">View your payment history and pay rent</p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Payment Successful!</p>
            <p className="text-sm text-green-600">Your payment has been processed successfully.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowSuccess(false)}>
            Dismiss
          </Button>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No payments</h3>
          <p className="text-slate-600">Payment records will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Payments */}
          {pendingPayments.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Balance Due</h2>
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg mb-3 last:mb-0">
                  <div>
                    <p className="font-semibold text-slate-900">
                      ${payment.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-600">
                      {payment.lease.unit.property.name} - Unit {payment.lease.unit.unitNumber}
                    </p>
                    <p className="text-sm text-slate-500">
                      Due: {new Date(payment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button onClick={() => setSelectedPayment(payment)}>
                    Pay Now
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Payment History */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment History</h2>
            {completedPayments.length === 0 ? (
              <p className="text-slate-600 text-center py-4">No payment history</p>
            ) : (
              <div className="space-y-3">
                {completedPayments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="font-medium text-slate-900">
                          Rent Payment - ${payment.amount.toLocaleString()}
                          {payment.convenienceFee && payment.convenienceFee > 0 && (
                            <span className="text-sm text-slate-500 ml-2">
                              (+ ${payment.convenienceFee.toFixed(2)} fee)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-slate-500">
                          {payment.lease.unit.property.name} - Unit {payment.lease.unit.unitNumber}
                        </p>
                        <p className="text-sm text-slate-500">
                          Paid: {payment.paidDate && new Date(payment.paidDate).toLocaleDateString()}
                          {payment.paymentMethod && ` via ${payment.paymentMethod.toUpperCase()}`}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={() => { setSelectedPayment(null); setPaymentMethod(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Rent</DialogTitle>
            <DialogDescription>
              Choose your payment method
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              {/* Amount Summary */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Rent Amount</span>
                  <span className="font-semibold">${selectedPayment.amount.toLocaleString()}</span>
                </div>
                {paymentMethod && (
                  <>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-slate-500">
                        {paymentMethod === "card" ? "Card Processing Fee (2.9%)" : "ACH Processing Fee"}
                      </span>
                      <span>${calculateFee(selectedPayment.amount, paymentMethod).toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>
                        ${(selectedPayment.amount + calculateFee(selectedPayment.amount, paymentMethod)).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod("ach")}
                  className={`w-full p-4 border rounded-lg flex items-center space-x-4 transition-colors ${
                    paymentMethod === "ach" ? "border-blue-500 bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <Landmark className="h-6 w-6 text-slate-600" />
                  <div className="flex-1 text-left">
                    <p className="font-medium">Bank Transfer (ACH)</p>
                    <p className="text-sm text-slate-500">$1.50 fee - Recommended</p>
                  </div>
                  {paymentMethod === "ach" && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </button>

                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`w-full p-4 border rounded-lg flex items-center space-x-4 transition-colors ${
                    paymentMethod === "card" ? "border-blue-500 bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <CreditCard className="h-6 w-6 text-slate-600" />
                  <div className="flex-1 text-left">
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-sm text-slate-500">2.9% convenience fee</p>
                  </div>
                  {paymentMethod === "card" && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </button>
              </div>

              {/* Pay Button */}
              <Button
                className="w-full"
                size="lg"
                disabled={!paymentMethod || processing}
                onClick={handlePayment}
              >
                {processing ? "Processing..." : `Pay $${paymentMethod ? (selectedPayment.amount + calculateFee(selectedPayment.amount, paymentMethod)).toFixed(2) : selectedPayment.amount.toFixed(2)}`}
              </Button>

              <p className="text-xs text-slate-500 text-center">
                Payments are securely processed by Stripe
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
