/**
 * Personalization Section Types
 *
 * Types and interfaces for the personalization section.
 */

// ═══════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════

export interface PersonalizationSectionProps {
  isInModal?: boolean
  initialTab?: 'profile' | 'company' | 'knowledge' | 'appearance'
}

export interface ProfileData {
  occupation: string
  about: string
  customInstructions: string
}

export interface ContextFileFormData {
  name: string
  description: string
  content: string
  contentType: string
  tags: string
  order: number
}

export interface ContextFile {
  id: string
  name: string
  description: string | null
  content: string
  contentType: string | null
  tags: string | null
  order: number | null
  isActive: boolean
  fileSize: number | null
  createdAt: Date
  updatedAt: Date
}

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

export const INITIAL_PROFILE_DATA: ProfileData = {
  occupation: '',
  about: '',
  customInstructions: '',
}

export const INITIAL_FORM_DATA: ContextFileFormData = {
  name: '',
  description: '',
  content: '',
  contentType: 'text/plain',
  tags: '',
  order: 0,
}

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
