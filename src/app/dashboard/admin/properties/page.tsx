import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Building, MapPin } from "lucide-react"

async function getProperties() {
  return prisma.property.findMany({
    include: {
      owner: true,
      units: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export default async function PropertiesPage() {
  const session = await getServerSession(authOptions)

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard/tenant")
  }

  const properties = await getProperties()

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
                  <span className="text-slate-500">Owner: {property.owner.name}</span>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Link href={`/dashboard/admin/properties/${property.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
