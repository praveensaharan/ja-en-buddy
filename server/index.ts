import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import session from "express-session";
import cron from 'node-cron';
import { storage } from './storage.js';
import { sendSummaryEmail } from './email.js';
import OpenAI from 'openai';

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // For Vercel serverless, export the app
  if (process.env.VERCEL) {
    return;
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    
    // Start daily summary cron job
    const openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
    
    cron.schedule('0 21 * * *', async () => {
      try {
        log('Running daily summary job...', 'cron');
        
        const userId = 'pra40109';
        const email = 'pra40109@gmail.com';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const summaries = await storage.getSummaries(userId);
        const todaySummary = summaries.find(s => {
          const summaryDate = new Date(s.date);
          summaryDate.setHours(0, 0, 0, 0);
          return summaryDate.getTime() === today.getTime();
        });
        
        let summaryToSend;
        
        if (!todaySummary) {
          const translations = await storage.getTranslations(userId);
          if (translations.length === 0) {
            log('No translations found. Skipping email.', 'cron');
            return;
          }
          
          const inputForSummary = translations.map(t => 
            `Original: ${t.originalText} | JP: ${t.japanese} | EN: ${t.english}`
          ).join('\n');
          
          const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: `Analyze these translations. Extract vocabulary (word, reading, meaning), key kanji, and grammar patterns.
                Create a learning summary.
                Return JSON: { 
                  "content": "markdown string of the summary", 
                  "vocab": [{ "word": "...", "reading": "...", "meaning": "..." }] 
                }`
              },
              { role: 'user', content: inputForSummary }
            ],
            response_format: { type: 'json_object' }
          });
          
          const content = response.choices[0].message.content;
          if (!content) throw new Error('No response from AI');
          
          const parsed = JSON.parse(content);
          
          summaryToSend = await storage.createSummary({
            userId,
            content: parsed.content,
            vocab: parsed.vocab,
            date: new Date()
          });
          
          log('Summary generated successfully', 'cron');
        } else {
          summaryToSend = todaySummary;
        }
        
        const success = await sendSummaryEmail(email, summaryToSend.content);
        log(success ? 'Daily summary email sent!' : 'Failed to send email', 'cron');
      } catch (error) {
        console.error('Error in daily summary job:', error);
      }
    }, {
      timezone: 'Asia/Tokyo'
    });
    
    log('Daily summary cron job started (8 PM Tokyo time)', 'cron');
  });
})();
