import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Ticket } from "lucide-react"
import Link from "next/link"

export default async function OwnerTicketsPage() {
  const session = await getServerSession(authOptions)

  // Get all properties owned by this user
  const properties = await prisma.property.findMany({
    where: { ownerId: session?.user?.id },
    select: { id: true },
  })

  const propertyIds = properties.map(p => p.id)

  // Get tickets for those properties
  const tickets = await prisma.ticket.findMany({
    where: {
      propertyId: { in: propertyIds },
    },
    include: {
      user: true,
      property: true,
      unit: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-yellow-100 text-yellow-800"
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800"
      case "RESOLVED": return "bg-green-100 text-green-800"
      case "CLOSED": return "bg-slate-100 text-slate-800"
      default: return "bg-slate-100 text-slate-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-100 text-red-800"
      case "MEDIUM": return "bg-orange-100 text-orange-800"
      case "LOW": return "bg-green-100 text-green-800"
      default: return "bg-slate-100 text-slate-800"
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
        <p className="text-slate-600">View maintenance requests for your properties</p>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Ticket className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No tickets</h3>
          <p className="text-slate-600">Support tickets will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Ticket className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{ticket.title}</h3>
                    <p className="text-sm text-slate-600">
                      {ticket.property?.name} {ticket.unit && `- Unit ${ticket.unit.unitNumber}`}
                    </p>
                    <p className="text-sm text-slate-500">
                      by {ticket.user?.name} | {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
