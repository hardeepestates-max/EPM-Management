import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Users, Ticket, DollarSign, AlertCircle, CheckCircle } from "lucide-react"

async function getOwnerStats(userId: string) {
  const [properties, openTickets, recentTickets] = await Promise.all([
    prisma.property.findMany({
      where: { ownerId: userId },
      include: {
        units: {
          include: {
            leases: {
              where: { status: "ACTIVE" },
              include: { tenant: true },
            },
          },
        },
      },
    }),
    prisma.ticket.count({
      where: {
        property: { ownerId: userId },
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    prisma.ticket.findMany({
      where: { property: { ownerId: userId } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true, property: true },
    }),
  ])

  const totalUnits = properties.reduce((sum, p) => sum + p.units.length, 0)
  const occupiedUnits = properties.reduce(
    (sum, p) => sum + p.units.filter((u) => u.leases.length > 0).length,
    0
  )

  return {
    properties,
    totalProperties: properties.length,
    totalUnits,
    occupiedUnits,
    openTickets,
    recentTickets,
  }
}

export default async function OwnerDashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    redirect("/dashboard/tenant")
  }

  const stats = await getOwnerStats(session.user.id)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Owner Dashboard</h1>
        <p className="text-slate-600">Welcome back, {session.user.name}</p>
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
            <CardTitle className="text-sm font-medium text-slate-600">Occupancy</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalUnits > 0
                ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100)
                : 0}%
            </div>
            <p className="text-sm text-slate-500">
              {stats.occupiedUnits} of {stats.totalUnits} units occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Open Tickets</CardTitle>
            <Ticket className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.openTickets}</div>
            <p className="text-sm text-slate-500">Pending requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Monthly Income</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${stats.properties
                .reduce(
                  (sum, p) =>
                    sum +
                    p.units.reduce(
                      (uSum, u) =>
                        uSum + (u.leases.length > 0 ? u.rentAmount : 0),
                      0
                    ),
                  0
                )
                .toLocaleString()}
            </div>
            <p className="text-sm text-slate-500">Expected rent</p>
          </CardContent>
        </Card>
      </div>

      {/* Properties Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Properties</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.properties.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No properties assigned to you yet
              </p>
            ) : (
              <div className="space-y-4">
                {stats.properties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{property.name}</p>
                      <p className="text-sm text-slate-500">
                        {property.address}, {property.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {property.units.filter((u) => u.leases.length > 0).length}/
                        {property.units.length}
                      </p>
                      <p className="text-sm text-slate-500">units occupied</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                          {ticket.property?.name} - {ticket.user.name}
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
    </div>
  )
}
