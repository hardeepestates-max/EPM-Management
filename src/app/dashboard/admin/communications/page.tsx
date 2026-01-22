"use client"

import { useState, useEffect } from "react"
import { Mail, Send, Users, Building, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BulkEmail {
  id: string
  subject: string
  body: string
  recipientType: string
  recipientCount: number
  sentAt: string
  sentBy: {
    name: string
  }
}

export default function AdminCommunicationsPage() {
  const [bulkEmails, setBulkEmails] = useState<BulkEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [recipientCount, setRecipientCount] = useState<number | null>(null)

  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [recipientType, setRecipientType] = useState("ALL")

  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    fetchBulkEmails()
  }, [])

  useEffect(() => {
    fetchRecipientCount(recipientType)
  }, [recipientType])

  const fetchBulkEmails = async () => {
    try {
      const res = await fetch("/api/communications/bulk")
      const data = await res.json()
      setBulkEmails(data || [])
    } catch (error) {
      console.error("Error fetching bulk emails:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecipientCount = async (type: string) => {
    try {
      const res = await fetch(`/api/communications/recipients?type=${type}`)
      const data = await res.json()
      setRecipientCount(data.count)
    } catch (error) {
      console.error("Error fetching recipient count:", error)
      setRecipientCount(null)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage("")
    setErrorMessage("")

    if (!subject.trim() || !body.trim()) {
      setErrorMessage("Please fill in both subject and message")
      return
    }

    if (!confirm(`Are you sure you want to send this email to ${recipientCount} recipient(s)?`)) {
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/communications/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, recipientType })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccessMessage(`Successfully sent to ${data.stats.sent} recipient(s)`)
        setSubject("")
        setBody("")
        fetchBulkEmails()
      } else {
        setErrorMessage(data.error || "Failed to send emails")
      }
    } catch (error) {
      console.error("Error sending bulk email:", error)
      setErrorMessage("Failed to send emails")
    } finally {
      setSending(false)
    }
  }

  const getRecipientLabel = (type: string) => {
    switch (type) {
      case "OWNER":
        return "Owners"
      case "TENANT":
        return "Tenants"
      default:
        return "All Users"
    }
  }

  const getRecipientBadgeColor = (type: string) => {
    switch (type) {
      case "OWNER":
        return "bg-blue-100 text-blue-800"
      case "TENANT":
        return "bg-green-100 text-green-800"
      default:
        return "bg-purple-100 text-purple-800"
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Bulk Communications</h1>
        <p className="text-slate-600">Send mass emails to owners and tenants</p>
      </div>

      {/* Compose Form */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Mail className="h-5 w-5 mr-2" />
          Compose Email
        </h2>

        {successMessage && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <Label htmlFor="recipientType">Send To</Label>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    All Users (Owners & Tenants)
                  </div>
                </SelectItem>
                <SelectItem value="OWNER">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Property Owners Only
                  </div>
                </SelectItem>
                <SelectItem value="TENANT">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Tenants Only
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {recipientCount !== null && (
              <p className="text-sm text-slate-500 mt-1">
                {recipientCount} recipient{recipientCount !== 1 ? "s" : ""} will receive this email
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="body">Message</Label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your message..."
              className="mt-1 w-full min-h-[200px] p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              required
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={sending || recipientCount === 0}>
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </form>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Communications
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-slate-500">Loading...</div>
        ) : bulkEmails.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No communications sent yet</h3>
            <p className="text-slate-600">Compose your first bulk email above</p>
          </div>
        ) : (
          <div className="divide-y">
            {bulkEmails.map((email) => (
              <div key={email.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">{email.subject}</h3>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{email.body}</p>
                    <div className="flex items-center mt-2 space-x-3 text-xs text-slate-500">
                      <span>{new Date(email.sentAt).toLocaleDateString()} at {new Date(email.sentAt).toLocaleTimeString()}</span>
                      <span>by {email.sentBy.name}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end space-y-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRecipientBadgeColor(email.recipientType)}`}>
                      {getRecipientLabel(email.recipientType)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {email.recipientCount} sent
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
