import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  varchar,
  numeric,
  index,
  jsonb,
} from 'drizzle-orm/pg-core'

/**
 * Forum Sessions - Sesiones de debate multi-agente
 *
 * Almacena cada sesion de deliberacion con pregunta, contexto y resultado.
 */
export const forumSessions = pgTable(
  'quoorum_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(), // Referencias auth.users(id)

    // Pregunta y contexto
    question: text('question').notNull(),
    manualContext: text('manual_context'),

    // Configuracion de fuentes de contexto
    useInternet: boolean('use_internet').default(false),
    useRepo: boolean('use_repo').default(false),
    repoPath: text('repo_path'),

    // Estado: running, completed, failed
    status: varchar('status', { length: 20 }).notNull().default('running'),

    // Progreso del debate
    totalRounds: integer('total_rounds').default(0),
    consensusScore: numeric('consensus_score', { precision: 4, scale: 2 }),

    // Resultado final: Array de RankedOption
    finalRanking: jsonb('final_ranking'),

    // Costos
    totalCostUsd: numeric('total_cost_usd', { precision: 10, scale: 6 }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    userIdx: index('idx_quoorum_sessions_user').on(table.userId),
    statusIdx: index('idx_quoorum_sessions_status').on(table.status),
    createdAtIdx: index('idx_quoorum_sessions_created').on(table.createdAt),
  })
)

export type ForumSession = typeof forumSessions.$inferSelect
export type NewForumSession = typeof forumSessions.$inferInsert

/**
 * Forum Messages - Mensajes del debate (ultra-optimizados)
 *
 * Cada mensaje de un agente en una ronda del debate.
 */
export const forumMessages = pgTable(
  'quoorum_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => forumSessions.id, { onDelete: 'cascade' }),

    // Posicion en el debate
    round: integer('round').notNull(),
    agentKey: varchar('agent_key', { length: 50 }).notNull(),
    agentName: varchar('agent_name', { length: 100 }),

    // Contenido ultra-optimizado
    content: text('content').notNull(),
    isCompressed: boolean('is_compressed').default(true),

    // Metricas de costo
    tokensUsed: integer('tokens_used'),
    costUsd: numeric('cost_usd', { precision: 10, scale: 6 }),

    // Timestamp
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sessionIdx: index('idx_quoorum_messages_session').on(table.sessionId),
    roundIdx: index('idx_quoorum_messages_round').on(table.sessionId, table.round),
  })
)

export type ForumMessage = typeof forumMessages.$inferSelect
export type NewForumMessage = typeof forumMessages.$inferInsert

/**
 * Forum Context Sources - Fuentes de contexto
 *
 * Almacena las diferentes fuentes de contexto usadas en una sesion.
 */
export const forumContextSources = pgTable(
  'quoorum_context_sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => forumSessions.id, { onDelete: 'cascade' }),

    // Tipo: 'manual', 'internet', 'repo'
    sourceType: varchar('source_type', { length: 20 }).notNull(),
    sourceData: jsonb('source_data'), // Metadata adicional (URLs, archivos, etc.)
    content: text('content').notNull(),

    // Timestamp
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sessionIdx: index('idx_quoorum_context_session').on(table.sessionId),
  })
)

export type ForumContextSource = typeof forumContextSources.$inferSelect
export type NewForumContextSource = typeof forumContextSources.$inferInsert

/**
 * Forum Translations - Cache de traducciones
 *
 * Almacena traducciones de mensajes ultra-optimizados a lenguaje humano.
 */
export const forumTranslations = pgTable(
  'quoorum_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => forumMessages.id, { onDelete: 'cascade' }),

    // Traduccion al espanol
    translation: text('translation').notNull(),

    // Metricas de costo
    tokensUsed: integer('tokens_used'),
    costUsd: numeric('cost_usd', { precision: 10, scale: 6 }),

    // Timestamp
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    messageIdx: index('idx_quoorum_translations_message').on(table.messageId),
  })
)

export type ForumTranslation = typeof forumTranslations.$inferSelect
export type NewForumTranslation = typeof forumTranslations.$inferInsert

/**
 * Tipos adicionales para Forum
 */
export interface RankedOption {
  option: string
  successRate: number // 0-100
  pros: string[]
  cons: string[]
  supporters: string[]
  confidence: number // 0-1
}

export interface ForumAgentConfig {
  key: string
  name: string
  role: 'optimizer' | 'critic' | 'analyst' | 'synthesizer'
  prompt: string
  provider: 'openai' | 'anthropic' | 'deepseek' | 'google'
  model: string
  temperature: number
}

/**
 * Configuracion de agentes para Forum
 */
export const QUOORUM_AGENTS: Record<string, ForumAgentConfig> = {
  optimizer: {
    key: 'optimizer',
    name: 'Optimista',
    role: 'optimizer',
    prompt:
      'Eres un optimista estrategico. Maximiza upside, identifica oportunidades, defiende la accion.',
    provider: 'deepseek',
    model: 'deepseek-chat',
    temperature: 0.7,
  },
  critic: {
    key: 'critic',
    name: 'Critico',
    role: 'critic',
    prompt:
      "Eres un critico implacable. Pre-mortem: Por que fallara? Cuestiona supuestos. Devil's advocate brutal.",
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.5,
  },
  analyst: {
    key: 'analyst',
    name: 'Analista',
    role: 'analyst',
    prompt:
      'Eres un analista pragmatico. Evalua factibilidad, estima esfuerzo, identifica blockers.',
    provider: 'deepseek',
    model: 'deepseek-chat',
    temperature: 0.3,
  },
  synthesizer: {
    key: 'synthesizer',
    name: 'Sintetizador',
    role: 'synthesizer',
    prompt:
      'Eres un sintetizador experto. Identifica patrones, extrae opciones, calcula % de exito, genera ranking.',
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.3,
  },
} as const
