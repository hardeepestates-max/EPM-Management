"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Send, User } from "lucide-react"

interface Message {
  id: string
  message: string
  createdAt: string
  user: { id: string; name: string; role: string }
}

interface TicketDetail {
  id: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  createdAt: string
  user: { id: string; name: string; email: string }
  property?: { id: string; name: string; address: string }
  unit?: { id: string; unitNumber: string }
  messages: Message[]
}

const statusColors: Record<string, string> = {
  OPEN: "bg-orange-100 text-orange-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-slate-100 text-slate-700",
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchTicket()
  }, [id])

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`)
      const data = await res.json()
      setTicket(data.ticket)
    } catch (error) {
      console.error("Error fetching ticket:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (status: string) => {
    try {
      await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      fetchTicket()
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    setSending(true)

    try {
      await fetch(`/api/tickets/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      })
      setNewMessage("")
      fetchTicket()
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading...</p>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="p-8">
        <p>Ticket not found</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <Link href="/dashboard/admin/tickets" className="flex items-center text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Tickets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{ticket.title}</CardTitle>
                <Badge className={statusColors[ticket.status]}>
                  {ticket.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.messages.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No messages yet</p>
              ) : (
                ticket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.user.id === session?.user?.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        msg.user.role === "ADMIN"
                          ? "bg-blue-50 border border-blue-100"
                          : "bg-slate-50 border border-slate-100"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="h-3 w-3" />
                        </div>
                        <span className="text-sm font-medium">{msg.user.name}</span>
                        <span className="text-xs text-slate-400">
                          {msg.user.role === "ADMIN" && "(Staff)"}
                        </span>
                      </div>
                      <p className="text-slate-700">{msg.message}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {/* Reply Form */}
              <div className="flex space-x-2 pt-4 border-t">
                <Textarea
                  placeholder="Type your reply..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Submitted by</p>
                <p className="font-medium">{ticket.user.name}</p>
                <p className="text-sm text-slate-600">{ticket.user.email}</p>
              </div>

              {ticket.property && (
                <div>
                  <p className="text-sm text-slate-500">Property</p>
                  <p className="font-medium">{ticket.property.name}</p>
                  {ticket.unit && (
                    <p className="text-sm text-slate-600">Unit {ticket.unit.unitNumber}</p>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm text-slate-500">Category</p>
                <p className="font-medium">{ticket.category}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Priority</p>
                <p className="font-medium">{ticket.priority}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Created</p>
                <p className="font-medium">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-2">Update Status</p>
                <Select value={ticket.status} onValueChange={updateStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
