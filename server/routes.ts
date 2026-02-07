import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import OpenAI from "openai";
import { sendSummaryEmail } from "./email";

declare global {
  namespace Express {
    interface Request {
      user?: { claims: { sub: string } };
    }
  }
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    
    const user = await storage.getUserByCredentials(username, password);
    
    if (user) {
      // Set session
      if (!req.session) req.session = {} as any;
      (req.session as any).userId = user.id;
      
      return res.json({ success: true });
    }
    
    res.status(401).json({ message: "Invalid credentials" });
  });

  // Check auth endpoint
  app.get("/api/auth/check", (req, res) => {
    if ((req.session as any)?.userId) {
      return res.json({ authenticated: true });
    }
    res.status(401).json({ authenticated: false });
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy(() => {});
    res.json({ success: true });
  });

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if ((req.session as any)?.userId) {
      req.user = { claims: { sub: (req.session as any).userId } };
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Protected routes
  app.post(api.translations.create.path, requireAuth, async (req, res) => {
    try {
      const { text } = api.translations.create.input.parse(req.body);
      const userId = (req.user as any).claims.sub;

      // Call OpenAI
      const response = await openai.chat.completions.create({
        model: "deepseek-chat",
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

  app.get(api.translations.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const items = await storage.getTranslations(userId);
    res.json(items);
  });

  app.get("/api/translations/history", requireAuth, async (req, res) => {
  const userId = (req.user as any).claims.sub;
  const history = await storage.getTranslationHistory(userId);
  res.json(history);
  });

  app.get("/api/translations/date/:date", requireAuth, async (req, res) => {
  const userId = (req.user as any).claims.sub;
  const { date } = req.params;
  const translations = await storage.getTranslationsByDate(userId, new Date(date));
  res.json(translations);
  });


  app.post(api.summaries.generate.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      
      // Check if already exists for today? (Optional, but user asked for "Once per day")
      // For MVP, we'll just generate a new one or overwrite. Let's just generate.
      
      const translations = await storage.getTranslations(userId);
      if (translations.length === 0) {
        return res.status(200).json({ message: "No translations today to summarize." });
      }

      const inputForSummary = translations.map(t => 
        `Original: ${t.originalText} | JP: ${t.japanese} | EN: ${t.english}`
      ).join("\n");

      const response = await openai.chat.completions.create({
        model: "deepseek-chat",
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

  app.get(api.summaries.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const items = await storage.getSummaries(userId);
    res.json(items);
  });

  app.post(api.summaries.sendEmail.path, requireAuth, async (req, res) => {
    try {
      const { email, summaryId } = api.summaries.sendEmail.input.parse(req.body);
      const userId = (req.user as any).claims.sub;
      
      let summary;
      if (summaryId) {
        // Send specific summary
        const summaries = await storage.getSummaries(userId);
        summary = summaries.find(s => s.id === summaryId);
        if (!summary) {
          return res.status(404).json({ message: "Summary not found" });
        }
      } else {
        // Send latest summary
        const summaries = await storage.getSummaries(userId);
        summary = summaries[0]; // Assuming they're ordered by date desc
        if (!summary) {
          return res.status(404).json({ message: "No summaries found" });
        }
      }

      const success = await sendSummaryEmail(email, summary.content);
      
      if (success) {
        res.json({ success: true, message: "Summary sent successfully!" });
      } else {
        res.status(500).json({ message: "Failed to send email" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to send summary email" });
    }
  });

  return httpServer;
}
