"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Owner {
  id: string
  name: string
  email: string
}

export default function NewPropertyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [owners, setOwners] = useState<Owner[]>([])
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    description: "",
    ownerId: "",
  })

  useEffect(() => {
    fetch("/api/users?role=OWNER")
      .then((res) => res.json())
      .then((data) => setOwners(data.users || []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push("/dashboard/admin/properties")
      }
    } catch (error) {
      console.error("Error creating property:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/dashboard/admin/properties" className="flex items-center text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Properties
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Add New Property</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Property Name</Label>
              <Input
                id="name"
                placeholder="e.g., Sunset Apartments"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                placeholder="123 Main Street"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Los Angeles"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="CA"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  placeholder="90001"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Property Owner</Label>
              {owners.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">
                    No owners found. You need to create an owner first.
                  </p>
                  <Link href="/dashboard/admin/users">
                    <Button type="button" size="sm" variant="outline">
                      Go to Users → Add Owner
                    </Button>
                  </Link>
                </div>
              ) : (
                <Select
                  value={formData.ownerId}
                  onValueChange={(value) => setFormData({ ...formData, ownerId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name} ({owner.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Property description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex space-x-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Property"}
              </Button>
              <Link href="/dashboard/admin/properties">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
