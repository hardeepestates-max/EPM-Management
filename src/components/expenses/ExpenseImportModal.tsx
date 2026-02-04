"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

interface Property {
  id: string
  name: string
  address: string
}

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

interface ExpenseImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  properties: Property[]
  onSuccess: () => void
}

export function ExpenseImportModal({
  open,
  onOpenChange,
  properties,
  onSuccess,
}: ExpenseImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [defaultPropertyId, setDefaultPropertyId] = useState(properties[0]?.id || "")
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState("")

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const rows: Record<string, string>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      rows.push(row)
    }

    return rows
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        setError("Please select a CSV file")
        return
      }
      setFile(selectedFile)
      setError("")
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const text = await file.text()
      const csvData = parseCSV(text)

      if (csvData.length === 0) {
        throw new Error("CSV file is empty or has invalid format")
      }

      const res = await fetch("/api/expenses/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvData,
          propertyId: defaultPropertyId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to import expenses")
      }

      setResult(data.results)

      if (data.results.imported > 0) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import expenses")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Expenses from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with your expenses. The file should have columns for:
            date, amount, category, description, vendor (optional), property (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* CSV Format Info */}
          <div className="bg-slate-50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">Expected CSV format:</p>
            <code className="text-xs bg-slate-200 p-2 rounded block overflow-x-auto">
              date,amount,category,description,vendor,property
              <br />
              2024-01-15,150.00,MAINTENANCE,Plumbing repair,ABC Plumbing,123 Main St
            </code>
            <p className="mt-2 text-slate-600">
              Valid categories: MAINTENANCE, REPAIRS, UTILITIES, INSURANCE, TAX, MORTGAGE, HOA, LEGAL, ADVERTISING, OTHER
            </p>
          </div>

          {/* Default Property Selection */}
          <div className="space-y-2">
            <Label>Default Property (for rows without property column)</Label>
            <Select
              value={defaultPropertyId}
              onValueChange={setDefaultPropertyId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <FileText className="h-6 w-6" />
                <span className="font-medium">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <p className="text-slate-600">Click to upload CSV file</p>
                <p className="text-sm text-slate-400 mt-1">or drag and drop</p>
              </>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-700">
                  Successfully imported {result.imported} expenses.
                  {result.skipped > 0 && ` ${result.skipped} rows skipped.`}
                </p>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="font-medium text-yellow-800 mb-2">Warnings:</p>
                  <ul className="text-sm text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.slice(0, 10).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>...and {result.errors.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              {result ? "Close" : "Cancel"}
            </Button>
            {!result && (
              <Button onClick={handleImport} disabled={!file || loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
