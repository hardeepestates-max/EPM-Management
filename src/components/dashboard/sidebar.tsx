"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Building,
  Users,
  UserCheck,
  Ticket,
  FileText,
  CreditCard,
  LogOut,
  Home,
  Wrench,
  Menu,
  Receipt,
  DollarSign,
  Wallet,
  ClipboardList,
  BarChart3,
  Mail,
  PiggyBank,
  Landmark,
} from "lucide-react"
import { useState } from "react"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { title: "Properties", href: "/dashboard/admin/properties", icon: Building },
  { title: "Rent Roll", href: "/dashboard/admin/rent-roll", icon: ClipboardList },
  { title: "Tenants", href: "/dashboard/admin/tenants", icon: UserCheck },
  { title: "Users", href: "/dashboard/admin/users", icon: Users },
  { title: "Tickets", href: "/dashboard/admin/tickets", icon: Ticket },
  { title: "Payments", href: "/dashboard/admin/payments", icon: CreditCard },
  { title: "Billing", href: "/dashboard/admin/billing", icon: DollarSign },
  { title: "Invoices", href: "/dashboard/admin/invoices", icon: Receipt },
  { title: "Communications", href: "/dashboard/admin/communications", icon: Mail },
  { title: "Reports", href: "/dashboard/admin/reports", icon: BarChart3 },
  { title: "Documents", href: "/dashboard/admin/documents", icon: FileText },
]

const ownerNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/owner", icon: LayoutDashboard },
  { title: "My Properties", href: "/dashboard/owner/properties", icon: Building },
  { title: "Rent Roll", href: "/dashboard/owner/rent-roll", icon: ClipboardList },
  { title: "Tenants", href: "/dashboard/owner/tenants", icon: Users },
  { title: "Tickets", href: "/dashboard/owner/tickets", icon: Ticket },
  { title: "Financials", href: "/dashboard/owner/financials", icon: CreditCard },
  { title: "Expenses", href: "/dashboard/owner/expenses", icon: PiggyBank },
  { title: "Payouts", href: "/dashboard/owner/payouts", icon: Landmark },
  { title: "Invoices", href: "/dashboard/owner/invoices", icon: Receipt },
  { title: "Reports", href: "/dashboard/owner/reports", icon: BarChart3 },
  { title: "Documents", href: "/dashboard/owner/documents", icon: FileText },
]

const tenantNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/tenant", icon: LayoutDashboard },
  { title: "My Unit", href: "/dashboard/tenant/unit", icon: Home },
  { title: "Maintenance", href: "/dashboard/tenant/tickets", icon: Wrench },
  { title: "Payments", href: "/dashboard/tenant/payments", icon: CreditCard },
  { title: "Payment Methods", href: "/dashboard/tenant/payment-methods", icon: Wallet },
  { title: "Documents", href: "/dashboard/tenant/documents", icon: FileText },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role || "TENANT"

  const navItems = role === "ADMIN" ? adminNavItems : role === "OWNER" ? ownerNavItems : tenantNavItems
  const roleLabel = role === "ADMIN" ? "Administrator" : role === "OWNER" ? "Property Owner" : "Tenant"

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center space-x-2 px-6 py-4 border-b border-slate-700">
        <Image src="/logo.png" alt="EPM Logo" width={40} height={40} className="brightness-0 invert flex-shrink-0" />
        <div>
          <span className="text-sm font-bold leading-tight">Elevate Property Management</span>
          <p className="text-xs text-slate-400">{roleLabel}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center space-x-3 px-3 py-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
            {session?.user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <div className="hidden lg:block w-64 flex-shrink-0">
      <SidebarContent />
    </div>
  )
}

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()
  const role = session?.user?.role || "TENANT"
  const roleLabel = role === "ADMIN" ? "Administrator" : role === "OWNER" ? "Property Owner" : "Tenant"

  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
      <div className="flex items-center space-x-2">
        <Image src="/logo.png" alt="EPM Logo" width={36} height={36} className="brightness-0 invert flex-shrink-0" />
        <div>
          <span className="text-sm font-bold leading-tight">Elevate Property Management</span>
          <p className="text-xs text-slate-400">{roleLabel}</p>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-0">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
