"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

const CATEGORY_COLORS: Record<string, string> = {
  MAINTENANCE: "bg-orange-100 text-orange-800",
  REPAIRS: "bg-red-100 text-red-800",
  UTILITIES: "bg-blue-100 text-blue-800",
  INSURANCE: "bg-purple-100 text-purple-800",
  TAX: "bg-amber-100 text-amber-800",
  MORTGAGE: "bg-indigo-100 text-indigo-800",
  HOA: "bg-teal-100 text-teal-800",
  LEGAL: "bg-slate-100 text-slate-800",
  ADVERTISING: "bg-pink-100 text-pink-800",
  OTHER: "bg-gray-100 text-gray-800",
}

const CATEGORY_LABELS: Record<string, string> = {
  MAINTENANCE: "Maintenance",
  REPAIRS: "Repairs",
  UTILITIES: "Utilities",
  INSURANCE: "Insurance",
  TAX: "Property Tax",
  MORTGAGE: "Mortgage",
  HOA: "HOA Fees",
  LEGAL: "Legal",
  ADVERTISING: "Advertising",
  OTHER: "Other",
}

interface Property {
  id: string
  name: string
  address: string
}

interface Expense {
  id: string
  amount: number
  date: string
  category: string
  description: string | null
  vendorName?: string | null
  notes?: string | null
  propertyId: string | null
  property: Property | null
}

interface ExpenseTableProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

export function ExpenseTable({ expenses, onEdit, onDelete }: ExpenseTableProps) {
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleDelete = () => {
    if (deleteExpense) {
      onDelete(deleteExpense)
      setDeleteExpense(null)
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-12 text-center">
        <p className="text-slate-500">No expenses found. Add your first expense to get started.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {formatDate(expense.date)}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{expense.description || "-"}</p>
                    {expense.notes && (
                      <p className="text-sm text-slate-500 truncate max-w-[200px]">
                        {expense.notes}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.OTHER}
                  >
                    {CATEGORY_LABELS[expense.category] || expense.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{expense.property?.name || "-"}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">
                    {expense.vendorName || "-"}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(expense.amount)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(expense)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteExpense(expense)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteExpense} onOpenChange={() => setDeleteExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
              <br />
              <br />
              <strong>{deleteExpense?.description}</strong> -{" "}
              {deleteExpense && formatCurrency(deleteExpense.amount)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
