import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DollarSign, TrendingUp, CheckCircle, Clock, Building } from "lucide-react"

export default async function OwnerFinancialsPage() {
  const session = await getServerSession(authOptions)

  const properties = await prisma.property.findMany({
    where: { ownerId: session?.user?.id },
    include: {
      units: {
        include: {
          leases: {
            where: { status: "ACTIVE" },
            include: {
              payments: {
                orderBy: { dueDate: "desc" },
                take: 10,
              },
            },
          },
        },
      },
    },
  })

  // Calculate totals
  let totalMonthlyIncome = 0
  let totalCollected = 0
  let totalPending = 0
  const allPayments: Array<{
    id: string
    propertyName: string
    unitNumber: string
    amount: number
    status: string
    dueDate: Date
    paidDate: Date | null
  }> = []

  properties.forEach(property => {
    property.units.forEach(unit => {
      unit.leases.forEach(lease => {
        totalMonthlyIncome += lease.rentAmount
        lease.payments.forEach(payment => {
          if (payment.status === "PAID") {
            totalCollected += payment.amount
          } else if (payment.status === "PENDING") {
            totalPending += payment.amount
          }
          allPayments.push({
            id: payment.id,
            propertyName: property.name,
            unitNumber: unit.unitNumber,
            amount: payment.amount,
            status: payment.status,
            dueDate: payment.dueDate,
            paidDate: payment.paidDate,
          })
        })
      })
    })
  })

  // Sort payments by date
  allPayments.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Financials</h1>
        <p className="text-slate-600">Overview of your rental income and payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 text-sm">Monthly Income</span>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold">${totalMonthlyIncome.toLocaleString()}</p>
          <p className="text-sm text-slate-500">Expected rent</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 text-sm">Collected</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">${totalCollected.toLocaleString()}</p>
          <p className="text-sm text-slate-500">Payments received</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 text-sm">Pending</span>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">${totalPending.toLocaleString()}</p>
          <p className="text-sm text-slate-500">Awaiting payment</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 text-sm">Properties</span>
            <Building className="h-5 w-5 text-slate-600" />
          </div>
          <p className="text-2xl font-bold">{properties.length}</p>
          <p className="text-sm text-slate-500">Active properties</p>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Payments</h2>
        {allPayments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p>No payment history</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allPayments.slice(0, 10).map((payment) => (
              <div key={payment.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {payment.status === "PAID" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  )}
                  <div>
                    <p className="font-medium text-slate-900">
                      {payment.propertyName} - Unit {payment.unitNumber}
                    </p>
                    <p className="text-sm text-slate-500">
                      Due: {new Date(payment.dueDate).toLocaleDateString()}
                      {payment.paidDate && ` | Paid: ${new Date(payment.paidDate).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${payment.amount.toLocaleString()}</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    payment.status === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
