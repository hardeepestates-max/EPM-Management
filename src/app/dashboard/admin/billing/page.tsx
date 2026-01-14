"use client"

import { useState, useEffect } from "react"
import { DollarSign, Percent, Building, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Owner {
  id: string
  name: string
  email: string
  propertyCount: number
  monthlyRevenue: number
  billingSettings: {
    managementFeePercent: number
    billingDay: number
  }
}

export default function AdminBillingPage() {
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editedFees, setEditedFees] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchOwners()
  }, [])

  const fetchOwners = async () => {
    try {
      const res = await fetch("/api/billing")
      const data = await res.json()
      setOwners(data.owners || [])

      // Initialize edited fees
      const fees: Record<string, number> = {}
      data.owners?.forEach((owner: Owner) => {
        fees[owner.id] = owner.billingSettings.managementFeePercent
      })
      setEditedFees(fees)
    } catch (error) {
      console.error("Error fetching owners:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFeeChange = (ownerId: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setEditedFees(prev => ({ ...prev, [ownerId]: numValue }))
  }

  const saveFee = async (ownerId: string) => {
    setSaving(ownerId)
    try {
      await fetch("/api/billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          managementFeePercent: editedFees[ownerId],
          billingDay: 1,
        }),
      })
      fetchOwners()
    } catch (error) {
      console.error("Error saving fee:", error)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Owner Billing Settings</h1>
        <p className="text-slate-600">Set management fee percentages for each property owner</p>
      </div>

      {owners.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No owners found</h3>
          <p className="text-slate-600">Property owners will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border">
          <div className="grid grid-cols-6 gap-4 p-4 border-b bg-slate-50 font-medium text-sm text-slate-600">
            <div className="col-span-2">Owner</div>
            <div>Properties</div>
            <div>Monthly Revenue</div>
            <div>Management Fee %</div>
            <div>Est. Monthly Fee</div>
          </div>

          {owners.map((owner) => {
            const currentFee = editedFees[owner.id] || owner.billingSettings.managementFeePercent
            const estimatedFee = (owner.monthlyRevenue * currentFee) / 100
            const hasChanged = currentFee !== owner.billingSettings.managementFeePercent

            return (
              <div key={owner.id} className="grid grid-cols-6 gap-4 p-4 border-b last:border-0 items-center">
                <div className="col-span-2">
                  <p className="font-medium text-slate-900">{owner.name}</p>
                  <p className="text-sm text-slate-500">{owner.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-slate-400" />
                  <span>{owner.propertyCount}</span>
                </div>
                <div className="font-medium">
                  ${owner.monthlyRevenue.toLocaleString()}
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={currentFee}
                    onChange={(e) => handleFeeChange(owner.id, e.target.value)}
                    className="w-20"
                  />
                  <Percent className="h-4 w-4 text-slate-400" />
                  {hasChanged && (
                    <Button
                      size="sm"
                      onClick={() => saveFee(owner.id)}
                      disabled={saving === owner.id}
                    >
                      {saving === owner.id ? "..." : <Save className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
                <div className="font-medium text-green-600">
                  ${estimatedFee.toFixed(2)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
