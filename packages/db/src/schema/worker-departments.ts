/**
 * Worker-Departments Junction Table
 * 
 * Relación muchos a muchos entre profesionales y departamentos.
 * Un profesional puede pertenecer a varios departamentos.
 */

import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { workers } from './workers'
import { departments } from './departments'

export const workerDepartments = pgTable(
  'worker_departments',
  {
    workerId: uuid('worker_id')
      .notNull()
      .references(() => workers.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.workerId, table.departmentId] }),
    workerIdIdx: index('idx_worker_departments_worker').on(table.workerId),
    departmentIdIdx: index('idx_worker_departments_department').on(table.departmentId),
  })
)

// Relations
export const workerDepartmentsRelations = relations(workerDepartments, ({ one }) => ({
  worker: one(workers, {
    fields: [workerDepartments.workerId],
    references: [workers.id],
  }),
  department: one(departments, {
    fields: [workerDepartments.departmentId],
    references: [departments.id],
  }),
}))

// Types
export type WorkerDepartment = typeof workerDepartments.$inferSelect
export type NewWorkerDepartment = typeof workerDepartments.$inferInsert
