"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  CreditCard,
  Landmark,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  Clock,
  ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PaymentMethod {
  id: string
  type: "card" | "bank"
  brand?: string
  bankName?: string
  last4: string
  expMonth?: number
  expYear?: number
  accountType?: string
  isDefault: boolean
  verificationStatus?: string // "verified" | "pending" | "unverified"
}

export default function PaymentMethodsPage() {
  const { data: session } = useSession()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingMethod, setAddingMethod] = useState<"card" | "bank" | null>(null)
  const [processing, setProcessing] = useState(false)
  const [deleteMethod, setDeleteMethod] = useState<PaymentMethod | null>(null)
  const [visibleMethods, setVisibleMethods] = useState<Set<string>>(new Set())
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch("/api/payments/methods")
      const data = await res.json()
      setPaymentMethods(data.paymentMethods || [])
    } catch (error) {
      console.error("Error fetching payment methods:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = (methodId: string) => {
    setVisibleMethods(prev => {
      const next = new Set(prev)
      if (next.has(methodId)) {
        next.delete(methodId)
      } else {
        next.add(methodId)
      }
      return next
    })
  }

  const handleAddPaymentMethod = async (type: "card" | "bank" | "bank-instant") => {
    setAddingMethod(type === "bank-instant" ? "bank" : type)
    setProcessing(true)

    try {
      // Use different endpoint for instant bank verification
      const endpoint = type === "bank-instant"
        ? "/api/payments/setup-bank"
        : "/api/payments/setup-intent"

      const res = await fetch(endpoint, {
        method: "POST",
      })
      const { clientSecret } = await res.json()

      if (!clientSecret) {
        throw new Error("Failed to create setup intent")
      }

      // Load Stripe.js dynamically
      const stripeJs = await import("@stripe/stripe-js")
      const stripe = await stripeJs.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

      if (!stripe) {
        throw new Error("Failed to load Stripe")
      }

      // Redirect to Stripe's hosted page for adding payment methods
      const { error } = await stripe.confirmSetup({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/tenant/payment-methods?success=true`,
        },
      })

      if (error) {
        console.error("Setup error:", error)
        alert(error.message || "Failed to add payment method")
      }
    } catch (error) {
      console.error("Error adding payment method:", error)
      alert("Failed to add payment method. Please try again.")
    } finally {
      setProcessing(false)
      setAddingMethod(null)
    }
  }

  const handleDeleteMethod = async () => {
    if (!deleteMethod) return

    try {
      const res = await fetch("/api/payments/methods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId: deleteMethod.id }),
      })

      if (res.ok) {
        setPaymentMethods(prev => prev.filter(pm => pm.id !== deleteMethod.id))
        setSuccessMessage("Payment method removed successfully")
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      console.error("Error deleting payment method:", error)
      alert("Failed to remove payment method")
    } finally {
      setDeleteMethod(null)
    }
  }

  const formatLast4 = (last4: string, visible: boolean) => {
    if (visible) {
      return `**** **** **** ${last4}`
    }
    return `**** **** **** ****`
  }

  const formatBankLast4 = (last4: string, visible: boolean) => {
    if (visible) {
      return `****${last4}`
    }
    return `********`
  }

  const getCardBrandIcon = (brand?: string) => {
    // Could add specific brand icons here
    return <CreditCard className="h-8 w-8 text-slate-600" />
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Loading payment methods...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Methods</h1>
          <p className="text-slate-600">Manage your saved payment methods for rent payments</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {paymentMethods.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No payment methods saved</h3>
          <p className="text-slate-600 mb-4">Add a bank account or card to make rent payments easier</p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => {
            const isVisible = visibleMethods.has(method.id)

            return (
              <div
                key={method.id}
                className="bg-white rounded-xl border p-6 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  {method.type === "card" ? (
                    <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-slate-600" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Landmark className="h-6 w-6 text-blue-600" />
                    </div>
                  )}

                  <div>
                    {method.type === "card" ? (
                      <>
                        <p className="font-medium text-slate-900 capitalize">
                          {method.brand || "Card"}
                        </p>
                        <p className="text-slate-600 font-mono text-sm">
                          {formatLast4(method.last4, isVisible)}
                        </p>
                        {method.expMonth && method.expYear && (
                          <p className="text-sm text-slate-500">
                            Expires {method.expMonth.toString().padStart(2, "0")}/{method.expYear.toString().slice(-2)}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">
                            {method.bankName || "Bank Account"}
                          </p>
                          {method.verificationStatus === "verified" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                              <ShieldCheck className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                          {method.verificationStatus === "pending" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                              <Clock className="h-3 w-3" />
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 font-mono text-sm">
                          Account ending in {isVisible ? method.last4 : "****"}
                        </p>
                        {method.accountType && (
                          <p className="text-sm text-slate-500 capitalize">
                            {method.accountType} account
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleVisibility(method.id)}
                    title={isVisible ? "Hide details" : "Show details"}
                  >
                    {isVisible ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteMethod(method)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}

          {/* Fee Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h4 className="font-medium text-blue-900 mb-2">Payment Processing Fees</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p className="flex items-center">
                <Landmark className="h-4 w-4 mr-2" />
                <span><strong>Bank Transfer (ACH):</strong> Free - No convenience fee</span>
              </p>
              <p className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                <span><strong>Credit/Debit Card:</strong> 2.9% convenience fee</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Choose how you'd like to pay rent
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {/* Instant Bank Verification - Recommended */}
            <button
              onClick={() => handleAddPaymentMethod("bank-instant")}
              disabled={processing}
              className="w-full p-4 border-2 border-green-200 bg-green-50 rounded-lg flex items-center space-x-4 hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">Instant Bank Verification</p>
                  <span className="px-2 py-0.5 rounded-full bg-green-200 text-green-800 text-xs font-medium">
                    Recommended
                  </span>
                </div>
                <p className="text-sm text-green-600">Free - Verify instantly, pay today</p>
                <p className="text-xs text-slate-500 mt-1">Connect your bank securely via Plaid</p>
              </div>
              {processing && addingMethod === "bank" && (
                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              )}
            </button>

            {/* Regular Bank Account with micro-deposits */}
            <button
              onClick={() => handleAddPaymentMethod("bank")}
              disabled={processing}
              className="w-full p-4 border rounded-lg flex items-center space-x-4 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Landmark className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-slate-900">Bank Account (Manual)</p>
                <p className="text-sm text-slate-500">Free - Takes 2-3 days to verify</p>
                <p className="text-xs text-slate-400 mt-1">Verify via micro-deposits</p>
              </div>
              {processing && addingMethod === "bank" && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
            </button>

            <button
              onClick={() => handleAddPaymentMethod("card")}
              disabled={processing}
              className="w-full p-4 border rounded-lg flex items-center space-x-4 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-slate-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-slate-900">Credit or Debit Card</p>
                <p className="text-sm text-slate-500">2.9% convenience fee</p>
              </div>
              {processing && addingMethod === "card" && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Your payment information is securely stored by Stripe
          </p>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteMethod} onOpenChange={() => setDeleteMethod(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this payment method?
              {deleteMethod?.type === "card"
                ? ` Card ending in ${deleteMethod.last4}`
                : ` Bank account ending in ${deleteMethod?.last4}`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMethod}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
