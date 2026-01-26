/**
 * Admin Navigation Helper
 * 
 * Generates the admin navigation menu with correct active state
 */

import {
  Users,
  Shield,
  CreditCard,
  BarChart3,
  Settings,
  AlertTriangle,
  LayoutDashboard,
  FileText,
} from "lucide-react"
import type { LucideIcon } from 'lucide-react'

export interface AdminNavItem {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
}

/**
 * Get admin navigation items with active state based on current path
 */
export function getAdminNav(currentPath: string): AdminNavItem[] {
  const navItems: Omit<AdminNavItem, 'active'>[] = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Usuarios', icon: Users },
    { href: '/admin/roles', label: 'Roles y Permisos', icon: Shield },
    { href: '/admin/credits', label: 'Créditos', icon: CreditCard },
    { href: '/admin/costs', label: 'Costos y Analytics', icon: BarChart3 },
    { href: '/admin/logs', label: 'Logs del Sistema', icon: FileText },
    { href: '/admin/settings', label: 'Configuración', icon: Settings },
    { href: '/admin/audit', label: 'Auditoría', icon: AlertTriangle },
  ]

  return navItems.map((item) => ({
    ...item,
    active: currentPath === item.href || currentPath.startsWith(item.href + '/'),
  }))
}
