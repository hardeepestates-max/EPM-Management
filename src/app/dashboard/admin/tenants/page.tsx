"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Mail, Home, Plus, X, Send, Copy, Check, UserPlus, Building } from "lucide-react"

interface Property {
  id: string
  name: string
  units: Unit[]
}

interface Unit {
  id: string
  unitNumber: string
  rentAmount: number
  status: string
}

interface Tenant {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  leases: {
    id: string
    status: string
    unit: {
      id: string
      unitNumber: string
      property: {
        id: string
        name: string
      }
    }
  }[]
}

interface PendingInvite {
  id: string
  token: string
  email: string
  status: string
  expiresAt: string
  property: { id: string; name: string }
  unit: { id: string; unitNumber: string }
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const [inviteForm, setInviteForm] = useState({
    emails: [""],
    propertyId: "",
    unitId: ""
  })
  const [generatedLinks, setGeneratedLinks] = useState<{ email: string; link: string }[]>([])
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tenantsRes, propertiesRes, invitesRes] = await Promise.all([
        fetch("/api/users?role=TENANT"),
        fetch("/api/properties"),
        fetch("/api/invites")
      ])

      const tenantsData = await tenantsRes.json()
      const propertiesData = await propertiesRes.json()
      const invitesData = await invitesRes.json()

      // Fetch lease data for each tenant
      const tenantsWithLeases = await Promise.all(
        (tenantsData.users || []).map(async (tenant: Tenant) => {
          const leaseRes = await fetch(`/api/leases?tenantId=${tenant.id}`)
          const leaseData = await leaseRes.json()
          return { ...tenant, leases: leaseData.leases || [] }
        })
      )

      setTenants(tenantsWithLeases)
      setProperties(propertiesData.properties || [])
      setPendingInvites((invitesData.invites || []).filter((i: PendingInvite) => i.status === "PENDING"))
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePropertyChange = async (propertyId: string) => {
    setInviteForm({ ...inviteForm, propertyId, unitId: "" })
    setGeneratedLink("")

    if (propertyId) {
      try {
        const res = await fetch(`/api/units?propertyId=${propertyId}`)
        const data = await res.json()
        // Only show available units
        setAvailableUnits((data.units || []).filter((u: Unit) => u.status === "AVAILABLE"))
      } catch (error) {
        console.error("Error fetching units:", error)
        setAvailableUnits([])
      }
    } else {
      setAvailableUnits([])
    }
  }

  const addEmailField = () => {
    if (inviteForm.emails.length >= 7) return // Max 7 tenants per unit
    setInviteForm({ ...inviteForm, emails: [...inviteForm.emails, ""] })
  }

  const removeEmailField = (index: number) => {
    const newEmails = inviteForm.emails.filter((_, i) => i !== index)
    setInviteForm({ ...inviteForm, emails: newEmails.length ? newEmails : [""] })
  }

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...inviteForm.emails]
    newEmails[index] = value
    setInviteForm({ ...inviteForm, emails: newEmails })
  }

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault()
    const validEmails = inviteForm.emails.filter(email => email.trim())
    if (validEmails.length === 0 || !inviteForm.propertyId || !inviteForm.unitId) return

    setSaving(true)
    const links: { email: string; link: string }[] = []
    const errors: string[] = []

    try {
      for (const email of validEmails) {
        const res = await fetch("/api/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            propertyId: inviteForm.propertyId,
            unitId: inviteForm.unitId
          })
        })

        const data = await res.json()
        if (res.ok) {
          const link = `${window.location.origin}/register/invite/${data.invite.token}`
          links.push({ email: email.trim(), link })
        } else {
          errors.push(`${email}: ${data.error || "Failed"}`)
        }
      }

      if (links.length > 0) {
        setGeneratedLinks(links)
        fetchData()
      }

      if (errors.length > 0) {
        alert(`Some invites failed:\n${errors.join("\n")}`)
      }
    } catch (error) {
      console.error("Error creating invites:", error)
      alert("Failed to create invites")
    } finally {
      setSaving(false)
    }
  }

  const handleCancelInvite = async (token: string) => {
    if (!confirm("Are you sure you want to cancel this invite?")) return

    try {
      const res = await fetch(`/api/invites/${token}`, { method: "DELETE" })
      if (res.ok) {
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to cancel invite")
      }
    } catch (error) {
      console.error("Error canceling invite:", error)
      alert("Failed to cancel invite")
    }
  }

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const resetModal = () => {
    setShowInviteModal(false)
    setInviteForm({ emails: [""], propertyId: "", unitId: "" })
    setGeneratedLinks([])
    setAvailableUnits([])
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
          <p className="text-slate-600">Manage tenants and send invite links</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Tenant
        </Button>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Invite New Tenant</h2>
              <button onClick={resetModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {generatedLinks.length === 0 ? (
              <form onSubmit={handleSendInvites} className="space-y-4">
                <div>
                  <Label htmlFor="invite-property">Property</Label>
                  <Select
                    value={inviteForm.propertyId}
                    onValueChange={handlePropertyChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="invite-unit">Unit</Label>
                  <Select
                    value={inviteForm.unitId}
                    onValueChange={(value) => setInviteForm({ ...inviteForm, unitId: value })}
                    disabled={!inviteForm.propertyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={inviteForm.propertyId ? "Select unit" : "Select property first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.length === 0 ? (
                        <SelectItem value="none" disabled>No available units</SelectItem>
                      ) : (
                        availableUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            Unit {unit.unitNumber} - ${unit.rentAmount}/mo
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Tenant Email(s) <span className="text-slate-400 font-normal">({inviteForm.emails.length}/7)</span></Label>
                    {inviteForm.emails.length < 7 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addEmailField}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Another
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {inviteForm.emails.map((email, index) => (
                      <div key={index} className="flex space-x-2">
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => updateEmail(index, e.target.value)}
                          placeholder={`tenant${index + 1}@email.com`}
                          required={index === 0}
                        />
                        {inviteForm.emails.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmailField(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Add multiple emails for roommates moving into the same unit (max 7)
                  </p>
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button type="submit" disabled={saving || !inviteForm.unitId} className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    {saving ? "Creating..." : `Create ${inviteForm.emails.filter(e => e.trim()).length || 1} Invite Link(s)`}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetModal}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium mb-2">
                    {generatedLinks.length} invite link{generatedLinks.length > 1 ? "s" : ""} created!
                  </p>
                  <p className="text-green-700 text-sm">Share these links with the tenants. They expire in 7 days.</p>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {generatedLinks.map((item, index) => (
                    <div key={index} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-slate-700 mb-1">{item.email}</p>
                      <div className="flex">
                        <Input value={item.link} readOnly className="rounded-r-none text-xs" />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => copyLink(item.link, `link-${index}`)}
                          className="rounded-l-none"
                        >
                          {copied === `link-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const allLinks = generatedLinks.map(l => `${l.email}:\n${l.link}`).join("\n\n")
                    navigator.clipboard.writeText(allLinks)
                    setCopied("all")
                    setTimeout(() => setCopied(null), 2000)
                  }}
                >
                  {copied === "all" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy All Links
                </Button>

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setGeneratedLinks([])
                      setInviteForm({ emails: [""], propertyId: "", unitId: "" })
                      setAvailableUnits([])
                    }}
                  >
                    Send More
                  </Button>
                  <Button type="button" onClick={resetModal}>
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Invites Section */}
      {pendingInvites.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-yellow-600" />
              Pending Invites ({pendingInvites.length})
            </h3>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-slate-600">
                      {invite.property.name} - Unit {invite.unit.unitNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLink(`${window.location.origin}/register/invite/${invite.token}`, invite.id)}
                    >
                      {copied === invite.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleCancelInvite(invite.token)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tenants List */}
      {tenants.length === 0 && pendingInvites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No tenants yet</h3>
            <p className="text-slate-600 mb-4">Invite your first tenant to get started</p>
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Tenant
            </Button>
          </CardContent>
        </Card>
      ) : tenants.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Active Tenants ({tenants.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-slate-600">Tenant</th>
                    <th className="text-left p-4 font-medium text-slate-600">Property / Unit</th>
                    <th className="text-left p-4 font-medium text-slate-600">Status</th>
                    <th className="text-left p-4 font-medium text-slate-600">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 font-medium">
                              {tenant.name?.charAt(0).toUpperCase() || "T"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{tenant.name}</p>
                            <p className="text-sm text-slate-500">{tenant.email}</p>
                            {tenant.phone && (
                              <p className="text-sm text-slate-500">{tenant.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {tenant.leases.length > 0 ? (
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-slate-400" />
                            <div>
                              <p className="font-medium">{tenant.leases[0].unit.property.name}</p>
                              <p className="text-sm text-slate-500">Unit {tenant.leases[0].unit.unitNumber}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">No active lease</span>
                        )}
                      </td>
                      <td className="p-4">
                        {tenant.leases.length > 0 ? (
                          <Badge className="bg-green-100 text-green-800">
                            {tenant.leases[0].status}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Unassigned</Badge>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
