import { type AnyPgColumn, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { authUsers } from "./auth.js";
import { channels } from "./channels.js";
import { companies } from "./companies.js";

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  authorId: varchar("author_id", { length: 32 })
    .notNull()
    .references(() => authUsers.id, { onDelete: "set null" }),
  threadParentId: uuid("thread_parent_id").references((): AnyPgColumn => messages.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
});
