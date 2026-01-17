"use client"

import { useState } from "react"
import { FileText, Upload, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  uploadedBy: string
}

export default function AdminDocumentsPage() {
  const [documents] = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    // TODO: Implement file upload
    setTimeout(() => {
      setUploading(false)
      alert("Document upload coming soon!")
    }, 1000)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-600">Manage leases, contracts, and other documents</p>
        </div>
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleUpload}
            multiple
          />
          <label htmlFor="file-upload">
            <Button asChild disabled={uploading}>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Document"}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No documents yet</h3>
          <p className="text-slate-600 mb-4">Upload leases, contracts, and other important documents</p>
          <label htmlFor="file-upload">
            <Button asChild variant="outline">
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Document
              </span>
            </Button>
          </label>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-slate-600">Document</th>
                <th className="text-left p-4 font-medium text-slate-600">Type</th>
                <th className="text-left p-4 font-medium text-slate-600">Size</th>
                <th className="text-left p-4 font-medium text-slate-600">Uploaded</th>
                <th className="text-left p-4 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-slate-900">{doc.name}</p>
                        <p className="text-sm text-slate-500">By {doc.uploadedBy}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{doc.type}</td>
                  <td className="p-4 text-slate-600">{formatFileSize(doc.size)}</td>
                  <td className="p-4 text-slate-600">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
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
    </div>
  )
}
