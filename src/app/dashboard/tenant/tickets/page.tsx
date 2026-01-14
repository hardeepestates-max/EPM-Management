import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Ticket } from "lucide-react"

export default async function TenantTicketsPage() {
  const session = await getServerSession(authOptions)

  const tickets = await prisma.ticket.findMany({
    where: { userId: session?.user?.id },
    include: {
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Requests</h1>
          <p className="text-slate-600">View and track your maintenance requests</p>
        </div>
        <Link href="/dashboard/tenant/tickets/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Ticket className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No requests yet</h3>
          <p className="text-slate-600 mb-4">Submit a maintenance request to get started</p>
          <Link href="/dashboard/tenant/tickets/new">
            <Button>Submit a Request</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/dashboard/tenant/tickets/${ticket.id}`}>
              <div className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Ticket className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{ticket.title}</h3>
                      <p className="text-sm text-slate-600">
                        {ticket.property?.name} {ticket.unit?.unitNumber && `- Unit ${ticket.unit.unitNumber}`}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
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
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
