"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Building, MapPin, Pencil, Trash2, X } from "lucide-react"

interface Owner {
  id: string
  name: string
  email: string
}

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  description?: string
  status: string
  ownerId: string
  owner: Owner
  units: { id: string }[]
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editProperty, setEditProperty] = useState<Property | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchProperties()
    fetchOwners()
  }, [])

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/properties")
      const data = await res.json()
      setProperties(data.properties || [])
    } catch (error) {
      console.error("Error fetching properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOwners = async () => {
    try {
      const res = await fetch("/api/users?role=OWNER")
      const data = await res.json()
      setOwners(data.users || [])
    } catch (error) {
      console.error("Error fetching owners:", error)
    }
  }

  const handleDelete = async (propertyId: string, propertyName: string) => {
    if (!confirm(`Are you sure you want to delete "${propertyName}"? This cannot be undone.`)) {
      return
    }
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE"
      })
      if (res.ok) {
        fetchProperties()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to delete property")
      }
    } catch (error) {
      console.error("Error deleting property:", error)
      alert("Failed to delete property")
    }
  }

  const openEditModal = (property: Property) => {
    setEditProperty({ ...property })
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editProperty) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/properties/${editProperty.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editProperty.name,
          address: editProperty.address,
          city: editProperty.city,
          state: editProperty.state,
          zipCode: editProperty.zipCode,
          description: editProperty.description,
          ownerId: editProperty.ownerId,
          status: editProperty.status
        })
      })
      if (res.ok) {
        setShowEditModal(false)
        setEditProperty(null)
        fetchProperties()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to update property")
      }
    } catch (error) {
      console.error("Error updating property:", error)
      alert("Failed to update property")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Properties</h1>
          <p className="text-slate-600">Manage all properties in the system</p>
        </div>
        <Link href="/dashboard/admin/properties/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </Link>
      </div>

      {/* Edit Property Modal */}
      {showEditModal && editProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Property</h2>
              <button onClick={() => { setShowEditModal(false); setEditProperty(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Property Name</Label>
                <Input
                  id="edit-name"
                  value={editProperty.name}
                  onChange={(e) => setEditProperty({ ...editProperty, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={editProperty.address}
                  onChange={(e) => setEditProperty({ ...editProperty, address: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    value={editProperty.city}
                    onChange={(e) => setEditProperty({ ...editProperty, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-state">State</Label>
                  <Input
                    id="edit-state"
                    value={editProperty.state}
                    onChange={(e) => setEditProperty({ ...editProperty, state: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-zip">ZIP</Label>
                  <Input
                    id="edit-zip"
                    value={editProperty.zipCode}
                    onChange={(e) => setEditProperty({ ...editProperty, zipCode: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-owner">Owner</Label>
                <Select
                  value={editProperty.ownerId}
                  onValueChange={(value) => setEditProperty({ ...editProperty, ownerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name} ({owner.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editProperty.status}
                  onValueChange={(value) => setEditProperty({ ...editProperty, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-3 pt-2">
                <Button type="submit" disabled={updating} className="flex-1">
                  {updating ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowEditModal(false); setEditProperty(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No properties yet</h3>
            <p className="text-slate-500 mb-4">Get started by adding your first property</p>
            <Link href="/dashboard/admin/properties/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{property.name}</CardTitle>
                  <Badge
                    variant={property.status === "ACTIVE" ? "default" : "secondary"}
                  >
                    {property.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-2 text-slate-600 mb-3">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span className="text-sm">
                    {property.address}, {property.city}, {property.state} {property.zipCode}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">
                    {property.units.length} unit{property.units.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-slate-500">Owner: {property.owner?.name || "Unassigned"}</span>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(property)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(property.id, property.name)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
