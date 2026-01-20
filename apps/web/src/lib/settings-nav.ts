/**
 * Shared Settings Navigation Helper
 * 
 * Generates the settings navigation menu with correct active state
 * based on current pathname
 */

import {
  Bell,
  CreditCard,
  Key,
  Shield,
  Sparkles,
  User,
  FileText,
  Building2,
  Network,
} from "lucide-react";
import type { LucideIcon } from 'lucide-react'

export interface SettingsNavItem {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  subItems?: SettingsNavSubItem[]
}

export interface SettingsNavSubItem {
  href: string
  label: string
  active: boolean
}

/**
 * Get settings navigation items with active state based on current path
 */
export function getSettingsNav(currentPath: string): SettingsNavItem[] {
  const navItems: Omit<SettingsNavItem, 'active'>[] = [
    { href: '/settings', label: 'Cuenta', icon: User },
    { href: '/settings/company', label: 'Empresa', icon: Building2 },
    {
      href: '/settings/departments',
      label: 'Departamentos',
      icon: Network,
      subItems: [
        { href: '/settings/departments', label: 'Nuevo' },
        { href: '/settings/departments/library', label: 'Plantillas' },
      ],
    },
    { href: '/settings/billing', label: 'Facturación', icon: CreditCard },
    { href: '/settings/api-keys', label: 'API Keys', icon: Key },
    {
      href: '/settings/experts',
      label: 'Expertos',
      icon: Sparkles,
      subItems: [
        { href: '/settings/experts', label: 'Nuevo' },
        { href: '/settings/experts/library', label: 'Biblioteca' },
      ],
    },
    { href: '/settings/context', label: 'Contexto', icon: FileText },
    { href: '/settings/notifications', label: 'Notificaciones', icon: Bell },
    { href: '/settings/security', label: 'Seguridad', icon: Shield },
  ]

  return navItems.map((item) => ({
    ...item,
    // Mark as active if pathname exactly matches the href or starts with it (for subItems)
    active: currentPath === item.href || (item.subItems && item.subItems.some(sub => currentPath === sub.href)),
    // Mark subItems as active
    subItems: item.subItems?.map((subItem) => ({
      ...subItem,
      active: currentPath === subItem.href,
    })),
  }))
}
