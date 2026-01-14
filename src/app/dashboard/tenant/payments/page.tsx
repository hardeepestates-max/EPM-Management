import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function TenantPaymentsPage() {
  const session = await getServerSession(authOptions)

  const lease = await prisma.lease.findFirst({
    where: {
      tenantId: session?.user?.id,
      status: "ACTIVE"
    },
    include: {
      payments: {
        orderBy: { dueDate: "desc" },
      },
    },
  })

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-600">View your payment history and pay rent</p>
        </div>
      </div>

      {!lease ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No active lease</h3>
          <p className="text-slate-600">Contact property management for assistance</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Balance */}
          {lease.payments.some(p => p.status === "PENDING") && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Current Balance Due</h2>
              {lease.payments.filter(p => p.status === "PENDING").map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">
                      ${payment.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-600">
                      Due: {new Date(payment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button>Pay Now</Button>
                </div>
              ))}
            </div>
          )}

          {/* Payment History */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment History</h2>
            {lease.payments.length === 0 ? (
              <p className="text-slate-600 text-center py-4">No payment history</p>
            ) : (
              <div className="space-y-3">
                {lease.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="font-medium text-slate-900">
                          Rent Payment - ${payment.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-600">
                          Due: {new Date(payment.dueDate).toLocaleDateString()}
                          {payment.paidDate && ` | Paid: ${new Date(payment.paidDate).toLocaleDateString()}`}
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
    </div>
  )
}
