import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Home, CreditCard, Ticket, FileText, AlertCircle, CheckCircle, Plus } from "lucide-react"

async function getTenantData(userId: string) {
  const [lease, tickets, payments] = await Promise.all([
    prisma.lease.findFirst({
      where: {
        tenantId: userId,
        status: "ACTIVE",
      },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
      },
    }),
    prisma.ticket.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { lease: { tenantId: userId } },
      take: 5,
      orderBy: { dueDate: "desc" },
    }),
  ])

  return { lease, tickets, payments }
}

export default async function TenantDashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const data = await getTenantData(session.user.id)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Tenant Dashboard</h1>
        <p className="text-slate-600">Welcome back, {session.user.name}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link href="/dashboard/tenant/tickets/new">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center space-x-4 py-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Ticket className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">Submit Request</p>
                <p className="text-sm text-slate-500">Maintenance or support</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/tenant/payments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center space-x-4 py-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Pay Rent</p>
                <p className="text-sm text-slate-500">View & pay bills</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/tenant/documents">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center space-x-4 py-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Documents</p>
                <p className="text-sm text-slate-500">Lease & notices</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/tenant/unit">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center space-x-4 py-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Home className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">My Unit</p>
                <p className="text-sm text-slate-500">View details</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lease Info */}
        <Card>
          <CardHeader>
            <CardTitle>Your Lease</CardTitle>
          </CardHeader>
          <CardContent>
            {data.lease ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Home className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">
                        {data.lease.unit.property.name}
                      </p>
                      <p className="text-slate-500">
                        Unit {data.lease.unit.unitNumber}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Monthly Rent</p>
                      <p className="font-medium text-lg">
                        ${data.lease.rentAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Lease Ends</p>
                      <p className="font-medium">
                        {new Date(data.lease.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  <p>
                    {data.lease.unit.property.address}, {data.lease.unit.property.city},{" "}
                    {data.lease.unit.property.state} {data.lease.unit.property.zipCode}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Home className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No active lease found</p>
                <p className="text-sm text-slate-400">
                  Contact property management for assistance
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Requests</CardTitle>
            <Link href="/dashboard/tenant/tickets/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.tickets.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No requests yet</p>
                <Link href="/dashboard/tenant/tickets/new">
                  <Button variant="outline" className="mt-4">
                    Submit a Request
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/dashboard/tenant/tickets/${ticket.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        {ticket.status === "OPEN" ? (
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        ) : ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Ticket className="h-4 w-4 text-blue-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{ticket.title}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          ticket.status === "OPEN"
                            ? "bg-orange-100 text-orange-700"
                            : ticket.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {data.payments.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No payment history</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-slate-500 border-b">
                      <th className="pb-3 font-medium">Due Date</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Paid Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((payment) => (
                      <tr key={payment.id} className="border-b last:border-0">
                        <td className="py-3">
                          {new Date(payment.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 font-medium">
                          ${payment.amount.toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              payment.status === "PAID"
                                ? "bg-green-100 text-green-700"
                                : payment.status === "LATE"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">
                          {payment.paidDate
                            ? new Date(payment.paidDate).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
