/**
 * Credit Transactions Schema
 * 
 * Registra todas las transacciones de créditos (deducciones, adiciones, reembolsos)
 * para tener un historial completo y auditable.
 */

import { pgTable, uuid, integer, text, timestamp, pgEnum, index, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { quoorumDebates } from './quoorum-debates'

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════
export const creditTransactionTypeEnum = pgEnum('credit_transaction_type', [
  'deduction', // Deducción (debate creado, ejecutado, etc.)
  'addition', // Adición (compra, asignación mensual, etc.)
  'refund', // Reembolso (debate fallido, cancelado, etc.)
])

export const creditTransactionSourceEnum = pgEnum('credit_transaction_source', [
  'debate_creation', // Debate creado (draft)
  'debate_execution', // Debate ejecutado
  'debate_failed', // Debate fallido (reembolso)
  'debate_cancelled', // Debate cancelado (reembolso)
  'monthly_allocation', // Asignación mensual de créditos
  'purchase', // Compra de créditos
  'admin_adjustment', // Ajuste manual por admin
  'refund', // Reembolso general
  'daily_reset', // Reset diario de créditos
])

// ═══════════════════════════════════════════════════════════
// TABLE
// ═══════════════════════════════════════════════════════════
export const creditTransactions = pgTable(
  'credit_transactions',
  {
    // Primary key
    id: uuid('id').defaultRandom().primaryKey(),

    // Foreign keys
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    
    debateId: uuid('debate_id').references(() => quoorumDebates.id, {
      onDelete: 'set null',
    }),

    // Transaction details
    type: creditTransactionTypeEnum('type').notNull(),
    source: creditTransactionSourceEnum('source').notNull(),
    amount: integer('amount').notNull(), // Positive number (always absolute value)
    
    // Balance tracking
    balanceBefore: integer('balance_before').notNull(), // Balance antes de la transacción
    balanceAfter: integer('balance_after').notNull(), // Balance después de la transacción

    // Metadata
    reason: text('reason'), // Razón de la transacción (opcional)
    metadata: jsonb('metadata').$type<Record<string, unknown>>(), // Datos adicionales (JSON)

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Índices para búsquedas rápidas
    userIdIdx: index('credit_transactions_user_id_idx').on(table.userId),
    debateIdIdx: index('credit_transactions_debate_id_idx').on(table.debateId),
    typeIdx: index('credit_transactions_type_idx').on(table.type),
    sourceIdx: index('credit_transactions_source_idx').on(table.source),
    createdAtIdx: index('credit_transactions_created_at_idx').on(table.createdAt),
    // Índice compuesto para queries comunes (historial de usuario ordenado por fecha)
    userCreatedIdx: index('credit_transactions_user_created_idx').on(
      table.userId,
      table.createdAt
    ),
  })
)

// ═══════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════
export const creditTransactionsRelations = relations(
  creditTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [creditTransactions.userId],
      references: [users.id],
    }),
    debate: one(quoorumDebates, {
      fields: [creditTransactions.debateId],
      references: [quoorumDebates.id],
    }),
  })
)

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
export type CreditTransaction = typeof creditTransactions.$inferSelect
export type NewCreditTransaction = typeof creditTransactions.$inferInsert
