import { translations, summaries, type Translation, type InsertTranslation, type Summary, type InsertSummary } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, asc, desc } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage";

export interface IStorage {
  // Translations
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  getTranslations(userId: string): Promise<Translation[]>;
  getTranslationsByDate(userId: string, date: Date): Promise<Translation[]>;
  getTranslationHistory(userId: string): Promise<{ date: string; count: number }[]>;

  // Summaries
  createSummary(summary: InsertSummary): Promise<Summary>;
  getSummaries(userId: string): Promise<Summary[]>;
  getSummaryByDate(userId: string, date: Date): Promise<Summary | undefined>;
  
  // User
  upsertUser(user: any): Promise<void>;
  getUserByCredentials(username: string, password: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const [translation] = await db.insert(translations).values(insertTranslation).returning();
    return translation;
  }

  async getTranslations(userId: string): Promise<Translation[]> {
  return db
    .select()
    .from(translations)
    .where(
      and(
        eq(translations.userId, userId),
        sql`DATE(${translations.createdAt}) = CURRENT_DATE`
      )
    )
    .orderBy(asc(translations.createdAt));
  }

  async getTranslationsByDate(userId: string, date: Date): Promise<Translation[]> {
  return db
    .select()
    .from(translations)
    .where(
      and(
        eq(translations.userId, userId),
        sql`DATE(${translations.createdAt}) = DATE(${date.toISOString()})`
      )
    )
    .orderBy(asc(translations.createdAt));
  }

  async getTranslationHistory(userId: string): Promise<{ date: string; count: number }[]> {
  const result = await db
    .select({
      date: sql<string>`DATE(${translations.createdAt})`,
      count: sql<number>`COUNT(*)::int`
    })
    .from(translations)
    .where(eq(translations.userId, userId))
    .groupBy(sql`DATE(${translations.createdAt})`)
    .orderBy(desc(sql`DATE(${translations.createdAt})`));
  return result;
 }

  async createSummary(insertSummary: InsertSummary): Promise<Summary> {
    const [summary] = await db.insert(summaries).values(insertSummary).returning();
    return summary;
  }

  async getSummaries(userId: string): Promise<Summary[]> {
    return db
      .select()
      .from(summaries)
      .where(eq(summaries.userId, userId))
      .orderBy(desc(summaries.date));
  }

  async getSummaryByDate(userId: string, date: Date): Promise<Summary | undefined> {
    // Simple check for same day
    const [summary] = await db
      .select()
      .from(summaries)
      .where(
        and(
          eq(summaries.userId, userId),
          sql`DATE(${summaries.date}) = DATE(${date.toISOString()})`
        )
      );
    return summary;
  }

  async upsertUser(user: any): Promise<void> {
    await authStorage.upsertUser(user);
  }

  async getUserByCredentials(username: string, password: string): Promise<any> {
    const [user] = await db
      .select()
      .from(authStorage.users)
      .where(
        and(
          eq(authStorage.users.id, username),
          eq(authStorage.users.password, password)
        )
      );
    return user;
  }
}

export const storage = new DatabaseStorage();
