"use client"

import { useState, useEffect } from "react"
import { DollarSign, CheckCircle, Clock, XCircle } from "lucide-react"

interface Payment {
  id: string
  amount: number
  status: string
  createdAt: string
  lease?: {
    tenant?: {
      name: string
      email: string
    }
    unit?: {
      unitNumber: string
      property?: {
        address: string
      }
    }
  }
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "FAILED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="text-slate-600">View all payment transactions</p>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No payments yet</h3>
          <p className="text-slate-600">Payment records will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-slate-600">Tenant</th>
                <th className="text-left p-4 font-medium text-slate-600">Property</th>
                <th className="text-left p-4 font-medium text-slate-600">Amount</th>
                <th className="text-left p-4 font-medium text-slate-600">Status</th>
                <th className="text-left p-4 font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-4">
                    <p className="font-medium text-slate-900">
                      {payment.lease?.tenant?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {payment.lease?.tenant?.email || ""}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-900">
                      {payment.lease?.unit?.property?.address || "Unknown"}
                    </p>
                    <p className="text-sm text-slate-500">
                      Unit {payment.lease?.unit?.unitNumber || ""}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-slate-900">
                      ${payment.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1">{payment.status}</span>
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
