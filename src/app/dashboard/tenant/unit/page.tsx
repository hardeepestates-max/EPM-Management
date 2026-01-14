import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Home, MapPin, Bed, Bath, Square, DollarSign } from "lucide-react"

export default async function TenantUnitPage() {
  const session = await getServerSession(authOptions)

  const lease = await prisma.lease.findFirst({
    where: {
      tenantId: session?.user?.id,
      status: "ACTIVE"
    },
    include: {
      unit: {
        include: {
          property: true,
        },
      },
    },
  })

  if (!lease) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Unit</h1>
        <div className="bg-white rounded-xl border p-12 text-center">
          <Home className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No active lease</h3>
          <p className="text-slate-600">Contact property management for assistance</p>
        </div>
      </div>
    )
  }

  const unit = lease.unit
  const property = unit.property

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Unit</h1>

      <div className="grid gap-6">
        {/* Property Info */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Property Information</h2>
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Home className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{property.name}</h3>
              <div className="flex items-center text-slate-600 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{property.address}, {property.city}, {property.state} {property.zipCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Unit Details */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Unit Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Home className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Unit Number</p>
                  <p className="font-semibold">{unit.unitNumber}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Bed className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Bedrooms</p>
                  <p className="font-semibold">{unit.bedrooms}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Bath className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Bathrooms</p>
                  <p className="font-semibold">{unit.bathrooms}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Square className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Square Footage</p>
                  <p className="font-semibold">{unit.sqft} sq ft</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Monthly Rent</p>
                  <p className="font-semibold">${lease.rentAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lease Info */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Lease Information</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-500">Lease Start</p>
              <p className="font-semibold">{new Date(lease.startDate).toLocaleDateString()}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-500">Lease End</p>
              <p className="font-semibold">{new Date(lease.endDate).toLocaleDateString()}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-500">Security Deposit</p>
              <p className="font-semibold">${lease.deposit.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
