import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function OwnerDocumentsPage() {
  const session = await getServerSession(authOptions)

  // Get documents for the owner and their properties
  const properties = await prisma.property.findMany({
    where: { ownerId: session?.user?.id },
    select: { id: true },
  })

  const propertyIds = properties.map(p => p.id)

  const documents = await prisma.document.findMany({
    where: {
      OR: [
        { userId: session?.user?.id },
        { propertyId: { in: propertyIds } },
      ],
    },
    include: {
      property: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="text-slate-600">Access property documents and reports</p>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No documents yet</h3>
          <p className="text-slate-600">Documents will appear here when available</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border">
          <div className="divide-y">
            {documents.map((doc) => (
              <div key={doc.id} className="flex justify-between items-center p-4 hover:bg-slate-50">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{doc.title}</p>
                    <p className="text-sm text-slate-500">
                      {doc.property?.name && `${doc.property.name} | `}
                      Added {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
