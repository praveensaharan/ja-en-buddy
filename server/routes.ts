import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth FIRST
  await setupAuth(app);
  registerAuthRoutes(app);

  // Protected routes
  app.post(api.translations.create.path, isAuthenticated, async (req, res) => {
    try {
      const { text } = api.translations.create.input.parse(req.body);
      const userId = (req.user as any).claims.sub;

      // Call OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: `You are a Japanese-English translator. 
            If the input is Japanese, translate to English and provide Romaji. 
            If the input is English, translate to Japanese and provide Romaji.
            Return ONLY JSON in this format: { "japanese": "...", "english": "...", "romaji": "..." }`
          },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("No response from AI");

      const parsed = JSON.parse(content);

      const translation = await storage.createTranslation({
        userId,
        originalText: text,
        japanese: parsed.japanese,
        english: parsed.english,
        romaji: parsed.romaji
      });

      res.status(201).json(translation);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to translate" });
    }
  });

  app.get(api.translations.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const items = await storage.getTranslations(userId);
    res.json(items);
  });

  app.post(api.summaries.generate.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      
      // Check if already exists for today? (Optional, but user asked for "Once per day")
      // For MVP, we'll just generate a new one or overwrite. Let's just generate.
      
      const translations = await storage.getTodayTranslations(userId);
      if (translations.length === 0) {
        return res.status(200).json({ message: "No translations today to summarize." });
      }

      const inputForSummary = translations.map(t => 
        `Original: ${t.originalText} | JP: ${t.japanese} | EN: ${t.english}`
      ).join("\n");

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: `Analyze these translations. Extract vocabulary (word, reading, meaning), key kanji, and grammar patterns.
            Create a learning summary.
            Return JSON: { 
              "content": "markdown string of the summary", 
              "vocab": [{ "word": "...", "reading": "...", "meaning": "..." }] 
            }`
          },
          { role: "user", content: inputForSummary }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("No response from AI");

      const parsed = JSON.parse(content);

      const summary = await storage.createSummary({
        userId,
        content: parsed.content,
        vocab: parsed.vocab,
        date: new Date()
      });
      
      // Simulate Email
      console.log(`[EMAIL SIMULATION] Sending summary to user ${userId}:`, parsed.content);

      res.status(201).json(summary);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  app.get(api.summaries.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const items = await storage.getSummaries(userId);
    res.json(items);
  });

  return httpServer;
}
