'use client'

/**
 * Settings Section Renderer
 * Dynamically renders the appropriate settings section content based on activePath
 * 
 * This component extracts the core content from each settings page
 * to be rendered within the SettingsContent modal or full page
 */

import { Loader2 } from 'lucide-react'
import { BillingSection } from './sections/billing-section'
import { ApiKeysSection } from './sections/api-keys-section'
import { SecuritySection } from './sections/security-section'
import { NotificationsSection } from './sections/notifications-section'
import { ExpertsSection } from './sections/experts-section'
import { ExpertsLibrarySection } from './sections/experts-library-section'
import { WorkersSection } from './sections/workers-section'
import { ContextSection } from './sections/context-section'
import { DepartmentsUnifiedSection } from './sections/departments-unified-section'
import { DepartmentsLibrarySection } from './sections/departments-library-section'
import { TeamSection } from './sections/team-section'
import { UsageSection } from './sections/usage-section'
import { PersonalizationSection } from './sections/personalization-section'
import { PreferencesSection } from './sections/preferences-section'

interface SettingsSectionRendererProps {
  activePath: string
  isInModal?: boolean
  isAdmin?: boolean
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
export function SettingsSectionRenderer({ activePath, isInModal = false, isAdmin = false }: SettingsSectionRendererProps) {
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

  // Handle subsecciones (e.g., experts/library, departments/library, workers/library)
  if (section === 'experts' && subpath === 'library') {
    return (
      <div className={isInModal ? 'pb-6' : 'pb-8'}>
        <ExpertsLibrarySection isInModal={isInModal} />
      </div>
    )
  }

  if (section === 'workers' && subpath === 'library') {
    // For now, library is shown in the main workers section
    // Can be separated later if needed
    return (
      <div className={isInModal ? 'pb-6' : 'pb-8'}>
        <WorkersSection isInModal={isInModal} />
      </div>
    )
  }

  if (section === 'departments' && subpath === 'library') {
    return (
      <div className={isInModal ? 'pb-6' : 'pb-8'}>
        <DepartmentsLibrarySection isInModal={isInModal} />
      </div>
    )
  }

  // Render the appropriate section component
  const renderSection = () => {
    switch (section) {
      case 'account':
      case 'profile':
        // /settings and /settings/profile both map to PersonalizationSection (which is now "Perfil")
        return <PersonalizationSection isInModal={isInModal} />
      case 'company':
        // /settings/company maps to PersonalizationSection with company tab open
        return <PersonalizationSection isInModal={isInModal} initialTab="company" />
      case 'billing':
        return <BillingSection isInModal={isInModal} />
      case 'preferences':
        return <PreferencesSection isInModal={isInModal} />
      case 'departments':
        return <DepartmentsUnifiedSection isInModal={isInModal} />
      case 'api-keys':
        return isAdmin ? <ApiKeysSection isInModal={isInModal} /> : <PersonalizationSection isInModal={isInModal} />
      case 'security':
        return <SecuritySection isInModal={isInModal} />
      case 'notifications':
        return <NotificationsSection isInModal={isInModal} />
      case 'experts':
        return <ExpertsSection isInModal={isInModal} />
      case 'workers':
        return <WorkersSection isInModal={isInModal} />
      case 'personalization':
        // Legacy route, redirect to profile
        return <PersonalizationSection isInModal={isInModal} />
      case 'team':
        return isAdmin ? <TeamSection isInModal={isInModal} /> : <PersonalizationSection isInModal={isInModal} />
      case 'usage':
        return <UsageSection isInModal={isInModal} />
      default:
        // Fallback to profile section (PersonalizationSection)
        return <PersonalizationSection isInModal={isInModal} />
    }
  }

  return (
    <div className={isInModal ? 'pb-6' : 'pb-8'}>
      {renderSection()}
    </div>
  )
}