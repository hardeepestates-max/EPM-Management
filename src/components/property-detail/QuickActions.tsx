"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  UserPlus,
  CreditCard,
  FileText,
  Send,
  Settings,
  Download,
  MoreHorizontal
} from "lucide-react"

interface QuickActionsProps {
  propertyId: string
  onAddUnit?: () => void
  onInviteTenant?: () => void
  onRecordPayment?: () => void
  onGenerateReport?: () => void
  onSendNotice?: () => void
  onExport?: () => void
}

export function QuickActions({
  onAddUnit,
  onInviteTenant,
  onRecordPayment,
  onGenerateReport,
  onSendNotice,
  onExport
}: QuickActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Primary Actions - Always visible */}
      <Button onClick={onAddUnit} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Add Unit
      </Button>

      <Button onClick={onInviteTenant} variant="outline" size="sm">
        <UserPlus className="mr-2 h-4 w-4" />
        Invite Tenant
      </Button>

      <Button onClick={onRecordPayment} variant="outline" size="sm">
        <CreditCard className="mr-2 h-4 w-4" />
        Record Payment
      </Button>

      {/* Secondary Actions - In dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onGenerateReport}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSendNotice}>
            <Send className="mr-2 h-4 w-4" />
            Send Notice to All
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Rent Roll
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Property Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
