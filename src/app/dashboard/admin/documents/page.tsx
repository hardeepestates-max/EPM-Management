"use client"

import { useState, useEffect } from "react"
import { FileText, Upload, Download, Trash2, Loader2, Building, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Document {
  id: string
  title: string
  description: string | null
  fileUrl: string
  fileType: string | null
  requiresSignature: boolean
  signedAt: string | null
  createdAt: string
  user: { name: string; email: string }
  property: { name: string; address: string } | null
}

interface Property {
  id: string
  name: string
  address: string
}

interface UserOption {
  id: string
  name: string
  email: string
  role: string
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [propertyId, setPropertyId] = useState("")
  const [userId, setUserId] = useState("")
  const [requiresSignature, setRequiresSignature] = useState(false)

  useEffect(() => {
    fetchDocuments()
    fetchProperties()
    fetchUsers()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents")
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/properties")
      const data = await res.json()
      setProperties(data.properties || [])
    } catch (error) {
      console.error("Error fetching properties:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users")
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !title) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("title", title)
      formData.append("description", description)
      if (propertyId) formData.append("propertyId", propertyId)
      if (userId) formData.append("userId", userId)
      formData.append("requiresSignature", String(requiresSignature))

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setDocuments([data.document, ...documents])
        resetForm()
        setShowUploadModal(false)
      } else {
        const error = await res.json()
        alert(error.error || "Failed to upload document")
      }
    } catch (error) {
      console.error("Error uploading document:", error)
      alert("Failed to upload document")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    setDeleting(docId)
    try {
      const res = await fetch(`/api/documents?id=${docId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setDocuments(documents.filter((d) => d.id !== docId))
      } else {
        alert("Failed to delete document")
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      alert("Failed to delete document")
    } finally {
      setDeleting(null)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setTitle("")
    setDescription("")
    setPropertyId("")
    setUserId("")
    setRequiresSignature(false)
  }

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return "text-slate-500"
    if (fileType.includes("pdf")) return "text-red-500"
    if (fileType.includes("image")) return "text-green-500"
    if (fileType.includes("word") || fileType.includes("document")) return "text-blue-500"
    return "text-slate-500"
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-600">Manage leases, contracts, and other documents</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No documents yet</h3>
          <p className="text-slate-600 mb-4">Upload leases, contracts, and other important documents</p>
          <Button variant="outline" onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Your First Document
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-slate-600">Document</th>
                <th className="text-left p-4 font-medium text-slate-600">Property</th>
                <th className="text-left p-4 font-medium text-slate-600">Assigned To</th>
                <th className="text-left p-4 font-medium text-slate-600">Uploaded</th>
                <th className="text-left p-4 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <FileText className={`h-8 w-8 ${getFileIcon(doc.fileType)}`} />
                      <div>
                        <p className="font-medium text-slate-900">{doc.title}</p>
                        {doc.description && (
                          <p className="text-sm text-slate-500 truncate max-w-xs">{doc.description}</p>
                        )}
                        {doc.requiresSignature && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            doc.signedAt ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {doc.signedAt ? "Signed" : "Signature Required"}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {doc.property ? (
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600">{doc.property.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-600">{doc.user.name}</p>
                        <p className="text-xs text-slate-400">{doc.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(doc.id)}
                        disabled={deleting === doc.id}
                      >
                        {deleting === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Lease Agreement"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Lease agreement for Unit 1A"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property">Property (optional)</Label>
              <select
                id="property"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">No property assigned</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.address}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">Assign to User</Label>
              <select
                id="user"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Myself (Admin)</option>
                {users.filter(u => u.role !== "ADMIN").map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role}) - {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresSignature"
                checked={requiresSignature}
                onChange={(e) => setRequiresSignature(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="requiresSignature" className="text-sm font-normal">
                Requires signature from assigned user
              </Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm()
                  setShowUploadModal(false)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploading || !selectedFile || !title}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
