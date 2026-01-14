import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Users, Home, Mail, Phone } from "lucide-react"

export default async function OwnerTenantsPage() {
  const session = await getServerSession(authOptions)

  const properties = await prisma.property.findMany({
    where: { ownerId: session?.user?.id },
    include: {
      units: {
        include: {
          leases: {
            where: { status: "ACTIVE" },
            include: {
              tenant: true,
            },
          },
        },
      },
    },
  })

  // Flatten tenants from all properties
  const tenants = properties.flatMap(property =>
    property.units.flatMap(unit =>
      unit.leases.map(lease => ({
        ...lease.tenant,
        propertyName: property.name,
        unitNumber: unit.unitNumber,
        rentAmount: lease.rentAmount,
        leaseEnd: lease.endDate,
      }))
    )
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
        <p className="text-slate-600">View tenants across your properties</p>
      </div>

      {tenants.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No tenants</h3>
          <p className="text-slate-600">Tenants will appear here when units are leased</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border">
          <div className="divide-y">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="p-4 hover:bg-slate-50">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      {tenant.name?.charAt(0).toUpperCase() || "T"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{tenant.name}</h3>
                      <div className="flex items-center text-sm text-slate-600 mt-1">
                        <Home className="h-4 w-4 mr-1" />
                        <span>{tenant.propertyName} - Unit {tenant.unitNumber}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                        {tenant.email && (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            <span>{tenant.email}</span>
                          </div>
                        )}
                        {tenant.phone && (
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            <span>{tenant.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">${tenant.rentAmount.toLocaleString()}/mo</p>
                    <p className="text-sm text-slate-500">
                      Lease ends: {new Date(tenant.leaseEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
