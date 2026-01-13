import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Users, Ticket, CreditCard, AlertCircle, CheckCircle } from "lucide-react"

async function getStats() {
  const [
    totalProperties,
    totalUnits,
    totalUsers,
    openTickets,
    pendingPayments,
    recentTickets,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.unit.count(),
    prisma.user.count(),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.ticket.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
  ])

  return {
    totalProperties,
    totalUnits,
    totalUsers,
    openTickets,
    pendingPayments,
    recentTickets,
  }
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard/tenant")
  }

  const stats = await getStats()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600">Welcome back, {session?.user?.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Properties</CardTitle>
            <Building className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalProperties}</div>
            <p className="text-sm text-slate-500">{stats.totalUnits} total units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Users</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-sm text-slate-500">Owners & Tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Open Tickets</CardTitle>
            <Ticket className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.openTickets}</div>
            <p className="text-sm text-slate-500">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Payments</CardTitle>
            <CreditCard className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingPayments}</div>
            <p className="text-sm text-slate-500">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentTickets.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No tickets yet</p>
          ) : (
            <div className="space-y-4">
              {stats.recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    {ticket.status === "OPEN" ? (
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                    ) : ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Ticket className="h-5 w-5 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium">{ticket.title}</p>
                      <p className="text-sm text-slate-500">
                        by {ticket.user.name} - {ticket.category}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
