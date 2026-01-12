/**
 * Custom Debate Templates
 *
 * User-created templates for common debate scenarios
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DebateTemplate {
  id: string
  userId: string
  name: string
  description: string
  category: string
  questionTemplate: string // Can include {{variables}}
  variables: TemplateVariable[]
  defaultExperts?: string[] // Expert keys
  defaultMode: 'static' | 'dynamic'
  defaultRounds: number
  tags: string[]
  isPublic: boolean
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export interface TemplateVariable {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'multiselect'
  required: boolean
  defaultValue?: string | number
  options?: string[] // For select/multiselect
  placeholder?: string
  helpText?: string
}

export interface TemplateInstance {
  templateId: string
  variables: Record<string, unknown>
  question: string // Rendered question
}

// ============================================================================
// TEMPLATE STORAGE
// ============================================================================

const templates = new Map<string, DebateTemplate>()

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

export function createTemplate(
  userId: string,
  data: Omit<DebateTemplate, 'id' | 'userId' | 'usageCount' | 'createdAt' | 'updatedAt'>
): DebateTemplate {
  const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const template: DebateTemplate = {
    ...data,
    id,
    userId,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  templates.set(id, template)
  return template
}

export function updateTemplate(
  id: string,
  updates: Partial<Omit<DebateTemplate, 'id' | 'userId' | 'usageCount' | 'createdAt'>>
): DebateTemplate | undefined {
  const template = templates.get(id)
  if (!template) return undefined

  Object.assign(template, updates, { updatedAt: new Date() })
  templates.set(id, template)

  return template
}

export function deleteTemplate(id: string): boolean {
  return templates.delete(id)
}

export function getTemplate(id: string): DebateTemplate | undefined {
  return templates.get(id)
}

export function listTemplates(options: {
  userId?: string
  category?: string
  tags?: string[]
  isPublic?: boolean
  search?: string
}): DebateTemplate[] {
  let results = Array.from(templates.values())

  if (options.userId) {
    results = results.filter((t) => t.userId === options.userId || t.isPublic)
  }

  if (options.category) {
    results = results.filter((t) => t.category === options.category)
  }

  if (options.tags && options.tags.length > 0) {
    results = results.filter((t) => options.tags!.some((tag) => t.tags.includes(tag)))
  }

  if (options.isPublic !== undefined) {
    results = results.filter((t) => t.isPublic === options.isPublic)
  }

  if (options.search) {
    const searchLower = options.search.toLowerCase()
    results = results.filter(
      (t) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    )
  }

  return results.sort((a, b) => b.usageCount - a.usageCount)
}

// ============================================================================
// TEMPLATE RENDERING
// ============================================================================

export function renderTemplate(
  templateId: string,
  variables: Record<string, unknown>
): TemplateInstance | null {
  const template = templates.get(templateId)
  if (!template) return null

  // Validate required variables
  for (const variable of template.variables) {
    if (variable.required && !variables[variable.name]) {
      throw new Error(`Missing required variable: ${variable.name}`)
    }
  }

  // Render question
  let question = template.questionTemplate
  for (const [key, value] of Object.entries(variables)) {
    // Security: Escape regex special characters in key
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // eslint-disable-next-line security/detect-non-literal-regexp -- Key is escaped above
    question = question.replace(new RegExp(`{{${escapedKey}}}`, 'g'), String(value))
  }

  // Increment usage count
  template.usageCount++
  templates.set(templateId, template)

  return {
    templateId,
    variables,
    question,
  }
}

// ============================================================================
// PREDEFINED TEMPLATES
// ============================================================================

export const PREDEFINED_TEMPLATES: Omit<
  DebateTemplate,
  'id' | 'userId' | 'usageCount' | 'createdAt' | 'updatedAt'
>[] = [
  {
    name: 'Pivot Decision',
    description: 'Decide whether to pivot your business model or target market',
    category: 'Strategy',
    questionTemplate: 'Should we pivot from {{currentModel}} to {{newModel}}?',
    variables: [
      {
        name: 'currentModel',
        label: 'Current Business Model',
        type: 'text',
        required: true,
        placeholder: 'e.g., B2C SaaS',
        helpText: 'Your current business model or target market',
      },
      {
        name: 'newModel',
        label: 'New Business Model',
        type: 'text',
        required: true,
        placeholder: 'e.g., B2B Enterprise',
        helpText: "The business model or target market you're considering",
      },
    ],
    defaultMode: 'dynamic',
    defaultRounds: 10,
    tags: ['pivot', 'strategy', 'business-model'],
    isPublic: true,
  },
  {
    name: 'Pricing Strategy',
    description: 'Choose the best pricing model for your product',
    category: 'Pricing',
    questionTemplate: 'What pricing model should we use for {{product}}: {{options}}?',
    variables: [
      {
        name: 'product',
        label: 'Product Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., Project Management Tool',
      },
      {
        name: 'options',
        label: 'Pricing Options',
        type: 'text',
        required: true,
        placeholder: 'e.g., freemium, per-seat, usage-based',
        helpText: 'Comma-separated list of pricing models to consider',
      },
    ],
    defaultMode: 'dynamic',
    defaultRounds: 8,
    tags: ['pricing', 'monetization', 'revenue'],
    isPublic: true,
  },
  {
    name: 'Feature Prioritization',
    description: 'Prioritize which feature to build next',
    category: 'Product',
    questionTemplate:
      'Which feature should we prioritize: {{feature1}}, {{feature2}}, or {{feature3}}?',
    variables: [
      {
        name: 'feature1',
        label: 'Feature Option 1',
        type: 'text',
        required: true,
      },
      {
        name: 'feature2',
        label: 'Feature Option 2',
        type: 'text',
        required: true,
      },
      {
        name: 'feature3',
        label: 'Feature Option 3',
        type: 'text',
        required: true,
      },
    ],
    defaultMode: 'dynamic',
    defaultRounds: 7,
    tags: ['product', 'roadmap', 'prioritization'],
    isPublic: true,
  },
  {
    name: 'Market Entry Strategy',
    description: 'Decide how to enter a new market',
    category: 'Growth',
    questionTemplate: 'How should we enter the {{market}} market: {{strategies}}?',
    variables: [
      {
        name: 'market',
        label: 'Target Market',
        type: 'text',
        required: true,
        placeholder: 'e.g., European, Enterprise',
      },
      {
        name: 'strategies',
        label: 'Entry Strategies',
        type: 'text',
        required: true,
        placeholder: 'e.g., direct sales, partnerships, acquisition',
        helpText: 'Comma-separated list of entry strategies',
      },
    ],
    defaultMode: 'dynamic',
    defaultRounds: 10,
    tags: ['growth', 'expansion', 'market-entry'],
    isPublic: true,
  },
  {
    name: 'Retention Improvement',
    description: 'Identify best strategies to improve user retention',
    category: 'Growth',
    questionTemplate:
      'How can we improve retention from {{currentRetention}}% to {{targetRetention}}%?',
    variables: [
      {
        name: 'currentRetention',
        label: 'Current Retention Rate',
        type: 'number',
        required: true,
        placeholder: '60',
        helpText: 'Current retention rate as a percentage',
      },
      {
        name: 'targetRetention',
        label: 'Target Retention Rate',
        type: 'number',
        required: true,
        placeholder: '80',
        helpText: 'Target retention rate as a percentage',
      },
    ],
    defaultMode: 'dynamic',
    defaultRounds: 8,
    tags: ['retention', 'growth', 'churn'],
    isPublic: true,
  },
  {
    name: 'Fundraising Strategy',
    description: 'Decide on fundraising approach and timing',
    category: 'Fundraising',
    questionTemplate: 'Should we raise {{amount}} now or wait {{months}} months?',
    variables: [
      {
        name: 'amount',
        label: 'Fundraising Amount',
        type: 'text',
        required: true,
        placeholder: 'e.g., $2M seed round',
      },
      {
        name: 'months',
        label: 'Months to Wait',
        type: 'number',
        required: true,
        defaultValue: 6,
      },
    ],
    defaultMode: 'dynamic',
    defaultRounds: 10,
    tags: ['fundraising', 'financing', 'timing'],
    isPublic: true,
  },
]

// ============================================================================
// TEMPLATE INITIALIZATION
// ============================================================================

export function initializePredefinedTemplates(systemUserId: string = 'system') {
  for (const template of PREDEFINED_TEMPLATES) {
    createTemplate(systemUserId, template)
  }

  // Predefined templates initialized
}

// ============================================================================
// TEMPLATE ANALYTICS
// ============================================================================

export function getTemplateStats(templateId: string): {
  usageCount: number
  avgRating?: number
  lastUsed?: Date
} | null {
  const template = templates.get(templateId)
  if (!template) return null

  return {
    usageCount: template.usageCount,
    // avgRating and lastUsed would come from debate results in production
  }
}

export function getPopularTemplates(limit: number = 10): DebateTemplate[] {
  return Array.from(templates.values())
    .filter((t) => t.isPublic)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit)
}

export function getTemplatesByCategory(): Record<string, DebateTemplate[]> {
  const byCategory: Record<string, DebateTemplate[]> = {}

  for (const template of templates.values()) {
    if (!template.isPublic) continue

    if (!byCategory[template.category]) {
      byCategory[template.category] = []
    }
    byCategory[template.category]!.push(template)
  }

  return byCategory
}
