import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const savedReadings = pgTable("saved_readings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  query: text("query").notNull(),
  summary: text("summary").notNull(),
  keyConcepts: jsonb("key_concepts").notNull().default([]),
  importantFacts: jsonb("important_facts").notNull().default([]),
  mindMapData: jsonb("mind_map_data").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertSavedReadingSchema = createInsertSchema(savedReadings).omit({
  id: true,
  createdAt: true,
});

export type Profile = typeof profiles.$inferSelect;
export type SavedReading = typeof savedReadings.$inferSelect;
export type InsertSavedReading = z.infer<typeof insertSavedReadingSchema>;
