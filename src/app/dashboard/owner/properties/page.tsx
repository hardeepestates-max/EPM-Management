import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Building, MapPin, Home } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function OwnerPropertiesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin/properties")
  }

  if (session.user.role !== "OWNER") {
    redirect("/dashboard/tenant")
  }

  const properties = await prisma.property.findMany({
    where: { ownerId: session?.user?.id },
    include: {
      units: {
        include: {
          leases: {
            where: { status: "ACTIVE" },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Properties</h1>
        <p className="text-slate-600">View and manage your properties</p>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Building className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No properties</h3>
          <p className="text-slate-600">Contact property management to add properties</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {properties.map((property) => {
            const totalUnits = property.units.length
            const occupiedUnits = property.units.filter(u => u.leases.length > 0).length
            const monthlyIncome = property.units.reduce((sum, unit) => {
              const activeLease = unit.leases[0]
              return sum + (activeLease ? activeLease.rentAmount : 0)
            }, 0)

            return (
              <div key={property.id} className="bg-white rounded-xl border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900">{property.name}</h3>
                      <div className="flex items-center text-slate-600 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{property.address}, {property.city}, {property.state} {property.zipCode}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    property.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"
                  }`}>
                    {property.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm text-slate-500">Units</p>
                    <p className="text-xl font-semibold">{totalUnits}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm text-slate-500">Occupancy</p>
                    <p className="text-xl font-semibold">{occupiedUnits}/{totalUnits}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm text-slate-500">Monthly Income</p>
                    <p className="text-xl font-semibold">${monthlyIncome.toLocaleString()}</p>
                  </div>
                </div>

                {/* Units List */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Units</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {property.units.map((unit) => {
                      const activeLease = unit.leases[0]
                      return (
                        <div key={unit.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Home className="h-4 w-4 text-slate-400" />
                            <div>
                              <p className="font-medium text-sm">Unit {unit.unitNumber}</p>
                              <p className="text-xs text-slate-500">{unit.bedrooms}BR / {unit.bathrooms}BA</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            activeLease ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {activeLease ? "Occupied" : "Vacant"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
