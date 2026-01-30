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
  Link2,
  Shield,
  Sparkles,
  User,
  Users,
  BarChart3,
  Building2,
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
    { href: '/settings', label: 'Perfil', icon: User },
    { href: '/settings/usage', label: 'Uso', icon: BarChart3 },
    { href: '/settings/billing', label: 'Facturación', icon: CreditCard },
    { href: '/settings/team', label: 'Equipo', icon: Users },
    { href: '/settings/api-keys', label: 'API Keys', icon: Key },
    { href: '/settings/departments', label: 'Departamentos', icon: Building2 },
    { href: '/settings/experts/library', label: 'Expertos', icon: Sparkles },
    {
      href: '/settings/workers',
      label: 'Profesionales',
      icon: Users,
      subItems: [
        { href: '/settings/workers', label: 'Nuevo', active: false },
        { href: '/settings/workers/library', label: 'Biblioteca', active: false },
      ],
    },
    { href: '/settings/integrations', label: 'Integraciones', icon: Link2 },
    { href: '/settings/notifications', label: 'Notificaciones', icon: Bell },
    { href: '/settings/security', label: 'Seguridad', icon: Shield },
  ]

  return navItems.map((item) => ({
    ...item,
    // Mark as active if pathname exactly matches the href or starts with it (for subItems)
    active: currentPath === item.href || (item.subItems ? item.subItems.some(sub => currentPath === sub.href) : false),
    // Mark subItems as active
    subItems: item.subItems?.map((subItem) => ({
      ...subItem,
      active: currentPath === subItem.href,
    })),
  }))
}
