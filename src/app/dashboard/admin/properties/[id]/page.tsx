"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Building, Home, Pencil, Trash2, X, Mail, Copy, Check, UserPlus } from "lucide-react"

interface Unit {
  id: string
  unitNumber: string
  bedrooms: number
  bathrooms: number
  sqft: number | null
  rentAmount: number
  status: string
  leases: {
    id: string
    tenant: { id: string; name: string; email: string }
  }[]
  tenantInvites: {
    id: string
    email: string
    token: string
    status: string
  }[]
}

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  status: string
  owner: { id: string; name: string; email: string }
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [property, setProperty] = useState<Property | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUnitModal, setShowAddUnitModal] = useState(false)
  const [showEditUnitModal, setShowEditUnitModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [inviteLink, setInviteLink] = useState("")

  const [newUnit, setNewUnit] = useState({
    unitNumber: "",
    bedrooms: "1",
    bathrooms: "1",
    sqft: "",
    rentAmount: ""
  })

  const [inviteEmail, setInviteEmail] = useState("")

  useEffect(() => {
    fetchProperty()
    fetchUnits()
  }, [id])

  const fetchProperty = async () => {
    try {
      const res = await fetch(`/api/properties/${id}`)
      const data = await res.json()
      setProperty(data.property)
    } catch (error) {
      console.error("Error fetching property:", error)
    }
  }

  const fetchUnits = async () => {
    try {
      const res = await fetch(`/api/units?propertyId=${id}`)
      const data = await res.json()
      setUnits(data.units || [])
    } catch (error) {
      console.error("Error fetching units:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: id,
          ...newUnit
        })
      })
      if (res.ok) {
        setShowAddUnitModal(false)
        setNewUnit({ unitNumber: "", bedrooms: "1", bathrooms: "1", sqft: "", rentAmount: "" })
        fetchUnits()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to add unit")
      }
    } catch (error) {
      console.error("Error adding unit:", error)
      alert("Failed to add unit")
    } finally {
      setSaving(false)
    }
  }

  const handleEditUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUnit) return
    setSaving(true)
    try {
      const res = await fetch(`/api/units/${selectedUnit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitNumber: selectedUnit.unitNumber,
          bedrooms: selectedUnit.bedrooms,
          bathrooms: selectedUnit.bathrooms,
          sqft: selectedUnit.sqft,
          rentAmount: selectedUnit.rentAmount,
          status: selectedUnit.status
        })
      })
      if (res.ok) {
        setShowEditUnitModal(false)
        setSelectedUnit(null)
        fetchUnits()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to update unit")
      }
    } catch (error) {
      console.error("Error updating unit:", error)
      alert("Failed to update unit")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUnit = async (unitId: string, unitNumber: string) => {
    if (!confirm(`Are you sure you want to delete Unit ${unitNumber}? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/units/${unitId}`, { method: "DELETE" })
      if (res.ok) {
        fetchUnits()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to delete unit")
      }
    } catch (error) {
      console.error("Error deleting unit:", error)
      alert("Failed to delete unit")
    }
  }

  const openInviteModal = (unit: Unit) => {
    setSelectedUnit(unit)
    setInviteEmail("")
    setInviteLink("")
    setShowInviteModal(true)
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUnit) return
    setSaving(true)
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          unitId: selectedUnit.id,
          propertyId: id
        })
      })
      const data = await res.json()
      if (res.ok) {
        const link = `${window.location.origin}/register/invite/${data.invite.token}`
        setInviteLink(link)
        fetchUnits()
      } else {
        alert(data.error || "Failed to send invite")
      }
    } catch (error) {
      console.error("Error sending invite:", error)
      alert("Failed to send invite")
    } finally {
      setSaving(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-green-100 text-green-800"
      case "OCCUPIED": return "bg-blue-100 text-blue-800"
      case "MAINTENANCE": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!property) {
    return <div className="p-8">Property not found</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/dashboard/admin/properties" className="flex items-center text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Properties
        </Link>
      </div>

      {/* Property Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-slate-900">{property.name}</h1>
            <Badge variant={property.status === "ACTIVE" ? "default" : "secondary"}>
              {property.status}
            </Badge>
          </div>
          <p className="text-slate-600 mt-1">
            {property.address}, {property.city}, {property.state} {property.zipCode}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Owner: {property.owner?.name || "Unassigned"}
          </p>
        </div>
        <Button onClick={() => setShowAddUnitModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Unit
        </Button>
      </div>

      {/* Units Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Home className="h-5 w-5 mr-2" />
            Units ({units.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No units yet</h3>
              <p className="text-slate-500 mb-4">Add units to this property to start managing tenants</p>
              <Button onClick={() => setShowAddUnitModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Unit
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-slate-600">Unit #</th>
                    <th className="text-left p-4 font-medium text-slate-600">Beds/Baths</th>
                    <th className="text-left p-4 font-medium text-slate-600">Sq Ft</th>
                    <th className="text-left p-4 font-medium text-slate-600">Rent</th>
                    <th className="text-left p-4 font-medium text-slate-600">Status</th>
                    <th className="text-left p-4 font-medium text-slate-600">Tenant</th>
                    <th className="text-left p-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit) => (
                    <tr key={unit.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-4 font-medium">{unit.unitNumber}</td>
                      <td className="p-4">{unit.bedrooms} bd / {unit.bathrooms} ba</td>
                      <td className="p-4">{unit.sqft ? `${unit.sqft} sqft` : "-"}</td>
                      <td className="p-4">${unit.rentAmount.toLocaleString()}/mo</td>
                      <td className="p-4">
                        <Badge className={getStatusColor(unit.status)}>{unit.status}</Badge>
                      </td>
                      <td className="p-4">
                        {unit.leases.length > 0 ? (
                          <div>
                            <p className="font-medium">{unit.leases[0].tenant.name}</p>
                            <p className="text-sm text-slate-500">{unit.leases[0].tenant.email}</p>
                          </div>
                        ) : unit.tenantInvites.length > 0 ? (
                          <div className="text-sm">
                            <span className="text-yellow-600">Invite pending:</span>
                            <p className="text-slate-500">{unit.tenantInvites[0].email}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">No tenant</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-1">
                          {unit.status === "AVAILABLE" && unit.leases.length === 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => openInviteModal(unit)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUnit({ ...unit })
                              setShowEditUnitModal(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteUnit(unit.id, unit.unitNumber)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Unit</h2>
              <button onClick={() => setShowAddUnitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddUnit} className="space-y-4">
              <div>
                <Label htmlFor="unitNumber">Unit Number</Label>
                <Input
                  id="unitNumber"
                  value={newUnit.unitNumber}
                  onChange={(e) => setNewUnit({ ...newUnit, unitNumber: e.target.value })}
                  placeholder="e.g., 101, A1, etc."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Select
                    value={newUnit.bedrooms}
                    onValueChange={(value) => setNewUnit({ ...newUnit, bedrooms: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Select
                    value={newUnit.bathrooms}
                    onValueChange={(value) => setNewUnit({ ...newUnit, bathrooms: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 1.5, 2, 2.5, 3, 3.5, 4].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="sqft">Square Feet (optional)</Label>
                <Input
                  id="sqft"
                  type="number"
                  value={newUnit.sqft}
                  onChange={(e) => setNewUnit({ ...newUnit, sqft: e.target.value })}
                  placeholder="e.g., 850"
                />
              </div>
              <div>
                <Label htmlFor="rentAmount">Monthly Rent ($)</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  value={newUnit.rentAmount}
                  onChange={(e) => setNewUnit({ ...newUnit, rentAmount: e.target.value })}
                  placeholder="e.g., 1500"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "Adding..." : "Add Unit"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddUnitModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Unit Modal */}
      {showEditUnitModal && selectedUnit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Unit {selectedUnit.unitNumber}</h2>
              <button onClick={() => { setShowEditUnitModal(false); setSelectedUnit(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditUnit} className="space-y-4">
              <div>
                <Label htmlFor="edit-unitNumber">Unit Number</Label>
                <Input
                  id="edit-unitNumber"
                  value={selectedUnit.unitNumber}
                  onChange={(e) => setSelectedUnit({ ...selectedUnit, unitNumber: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-bedrooms">Bedrooms</Label>
                  <Select
                    value={selectedUnit.bedrooms.toString()}
                    onValueChange={(value) => setSelectedUnit({ ...selectedUnit, bedrooms: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-bathrooms">Bathrooms</Label>
                  <Select
                    value={selectedUnit.bathrooms.toString()}
                    onValueChange={(value) => setSelectedUnit({ ...selectedUnit, bathrooms: parseFloat(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 1.5, 2, 2.5, 3, 3.5, 4].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-sqft">Square Feet</Label>
                <Input
                  id="edit-sqft"
                  type="number"
                  value={selectedUnit.sqft || ""}
                  onChange={(e) => setSelectedUnit({ ...selectedUnit, sqft: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>
              <div>
                <Label htmlFor="edit-rentAmount">Monthly Rent ($)</Label>
                <Input
                  id="edit-rentAmount"
                  type="number"
                  value={selectedUnit.rentAmount}
                  onChange={(e) => setSelectedUnit({ ...selectedUnit, rentAmount: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={selectedUnit.status}
                  onValueChange={(value) => setSelectedUnit({ ...selectedUnit, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="OCCUPIED">Occupied</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowEditUnitModal(false); setSelectedUnit(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Tenant Modal */}
      {showInviteModal && selectedUnit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Invite Tenant</h2>
              <button onClick={() => { setShowInviteModal(false); setSelectedUnit(null); setInviteLink(""); }} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Property:</span> {property.name}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Unit:</span> {selectedUnit.unitNumber}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Rent:</span> ${selectedUnit.rentAmount.toLocaleString()}/mo
              </p>
            </div>

            {!inviteLink ? (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <Label htmlFor="inviteEmail">Tenant Email</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="tenant@email.com"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    An invite link will be generated for this email
                  </p>
                </div>
                <div className="flex space-x-3 pt-2">
                  <Button type="submit" disabled={saving} className="flex-1">
                    <Mail className="h-4 w-4 mr-2" />
                    {saving ? "Creating..." : "Create Invite"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowInviteModal(false); setSelectedUnit(null); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Invite Link</Label>
                  <div className="flex mt-1">
                    <Input
                      value={inviteLink}
                      readOnly
                      className="rounded-r-none text-sm"
                    />
                    <Button
                      type="button"
                      onClick={copyLink}
                      className="rounded-l-none"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Share this link with the tenant. It will expire in 7 days.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => { setShowInviteModal(false); setSelectedUnit(null); setInviteLink(""); }}
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
