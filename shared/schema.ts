export * from "./models/auth";
import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  originalText: text("original_text").notNull(),
  japanese: text("japanese"),
  english: text("english"),
  romaji: text("romaji"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const summaries = pgTable("summaries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow().notNull(),
  content: text("content").notNull(), // Markdown summary
  vocab: jsonb("vocab"), // Extracted vocab list
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTranslationSchema = createInsertSchema(translations).omit({ id: true, createdAt: true });
export const insertSummarySchema = createInsertSchema(summaries).omit({ id: true, createdAt: true });

export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Summary = typeof summaries.$inferSelect;
export type InsertSummary = z.infer<typeof insertSummarySchema>;
