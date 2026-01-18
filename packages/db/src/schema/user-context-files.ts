/**
 * User Context Files Schema
 * 
 * Almacena archivos de texto de contexto por usuario que se incluyen
 * automáticamente en los debates para proporcionar contexto adicional
 * sobre el proyecto, empresa, o situación del usuario.
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const userContextFiles = pgTable(
  "user_context_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    
    // File info
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    
    // Content (texto plano o markdown)
    content: text("content").notNull(),
    
    // Metadata
    fileSize: integer("file_size"), // bytes
    contentType: varchar("content_type", { length: 100 }).default("text/plain"),
    
    // Status
    isActive: boolean("is_active").notNull().default(true),
    
    // Order/priority (para controlar el orden en que se incluyen)
    order: integer("order").default(0),
    
    // Metadata adicional (tags, categorías, etc.)
    tags: text("tags"), // Comma-separated tags
    
    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_user_context_files_user").on(table.userId),
    activeIdx: index("idx_user_context_files_active").on(table.userId, table.isActive),
    createdAtIdx: index("idx_user_context_files_created").on(table.createdAt),
  })
);

export type UserContextFile = typeof userContextFiles.$inferSelect;
export type NewUserContextFile = typeof userContextFiles.$inferInsert;
