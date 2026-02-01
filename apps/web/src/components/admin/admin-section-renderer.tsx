/**
 * Admin Section Renderer
 * Dynamically renders the appropriate admin section content based on activePath
 */

'use client'

import { Loader2 } from 'lucide-react'
import { UsersSection } from './sections/users-section'
import { RolesSection } from './sections/roles-section'
import { ScenariosSection } from './sections/scenarios-section'
import { CreditsSection } from './sections/credits-section'
import { CostsSection } from './sections/costs-section'
import { LogsSection } from './sections/logs-section'
import { AdminSettingsSection } from './sections/admin-settings-section'
import { AuditSection } from './sections/audit-section'

interface AdminSectionRendererProps {
  activePath: string
  isInModal?: boolean
}

function AdminSectionSkeleton() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  )
}

export function AdminSectionRenderer({ activePath, isInModal = false }: AdminSectionRendererProps) {
  const pathParts = activePath === '/admin' 
    ? ['users'] 
    : activePath.replace('/admin/', '').split('/').filter(Boolean)
  
  const section = pathParts[0] || 'users'

  const renderSection = () => {
    switch (section) {
      case 'users':
        return <UsersSection isInModal={isInModal} />
      case 'roles':
        return <RolesSection isInModal={isInModal} />
      case 'scenarios':
        return <ScenariosSection isInModal={isInModal} />
      case 'credits':
        return <CreditsSection isInModal={isInModal} />
      case 'costs':
        return <CostsSection isInModal={isInModal} />
      case 'logs':
        return <LogsSection isInModal={isInModal} />
      case 'settings':
        return <AdminSettingsSection isInModal={isInModal} />
      case 'audit':
        return <AuditSection isInModal={isInModal} />
      default:
        return <UsersSection isInModal={isInModal} />
    }
  }

  return (
    <div className={isInModal ? 'pb-6' : 'pb-8'}>
      {renderSection()}
    </div>
  )
}
