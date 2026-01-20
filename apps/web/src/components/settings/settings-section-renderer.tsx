'use client'

/**
 * Settings Section Renderer
 * Dynamically renders the appropriate settings section content based on activePath
 * 
 * This component extracts the core content from each settings page
 * to be rendered within the SettingsContent modal or full page
 */

import { Loader2 } from 'lucide-react'
import { AccountSection } from './sections/account-section'
import { BillingSection } from './sections/billing-section'
import { ApiKeysSection } from './sections/api-keys-section'
import { SecuritySection } from './sections/security-section'
import { NotificationsSection } from './sections/notifications-section'
import { ExpertsSection } from './sections/experts-section'
import { ExpertsLibrarySection } from './sections/experts-library-section'
import { ContextSection } from './sections/context-section'
import { CompanySection } from './sections/company-section'
import { DepartmentsSection } from './sections/departments-section'

interface SettingsSectionRendererProps {
  activePath: string
  isInModal?: boolean
}

function SettingsSectionSkeleton() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  )
}

/**
 * Renders the appropriate settings section based on activePath
 */
export function SettingsSectionRenderer({ activePath, isInModal = false }: SettingsSectionRendererProps) {
  // Extract the section path and subpath
  // Examples:
  // '/settings' -> section: 'account', subpath: ''
  // '/settings/billing' -> section: 'billing', subpath: ''
  // '/settings/experts' -> section: 'experts', subpath: ''
  // '/settings/experts/library' -> section: 'experts', subpath: 'library'
  
  const pathParts = activePath === '/settings' 
    ? ['account'] 
    : activePath.replace('/settings/', '').split('/').filter(Boolean)
  
  const section = pathParts[0] || 'account'
  const subpath = pathParts[1] || ''

  // Handle subsecciones (e.g., experts/library)
  if (section === 'experts' && subpath === 'library') {
    return <ExpertsLibrarySection isInModal={isInModal} />
  }

  // Render the appropriate section component
  switch (section) {
    case 'account':
      return <AccountSection isInModal={isInModal} />
    case 'billing':
      return <BillingSection isInModal={isInModal} />
    case 'company':
      return <CompanySection isInModal={isInModal} />
    case 'departments':
      return <DepartmentsSection isInModal={isInModal} />
    case 'api-keys':
      return <ApiKeysSection isInModal={isInModal} />
    case 'security':
      return <SecuritySection isInModal={isInModal} />
    case 'notifications':
      return <NotificationsSection isInModal={isInModal} />
    case 'experts':
      return <ExpertsSection isInModal={isInModal} />
    case 'context':
      return <ContextSection isInModal={isInModal} />
    default:
      // Fallback to account section
      return <AccountSection isInModal={isInModal} />
  }
}