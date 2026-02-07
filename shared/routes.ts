import { z } from 'zod';
import { insertTranslationSchema, translations, summaries } from './schema';

export const api = {
  translations: {
    create: {
      method: 'POST' as const,
      path: '/api/translations',
      input: z.object({
        text: z.string().min(1),
      }),
      responses: {
        201: z.custom<typeof translations.$inferSelect>(),
        400: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      }
    },
    list: {
      method: 'GET' as const,
      path: '/api/translations',
      responses: {
        200: z.array(z.custom<typeof translations.$inferSelect>()),
        401: z.object({ message: z.string() }),
      }
    },
    history: {
      method: 'GET' as const,
      path: '/api/translations/history',
      responses: {
        200: z.array(z.object({ date: z.string(), count: z.number() })),
        401: z.object({ message: z.string() }),
      }
    },
    byDate: {
      method: 'GET' as const,
      path: '/api/translations/date/:date',
      responses: {
        200: z.array(z.custom<typeof translations.$inferSelect>()),
        401: z.object({ message: z.string() }),
      }
    }
  },
  summaries: {
    generate: {
      method: 'POST' as const,
      path: '/api/summaries/generate',
      responses: {
        201: z.custom<typeof summaries.$inferSelect>(),
        200: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      }
    },
    list: {
      method: 'GET' as const,
      path: '/api/summaries',
      responses: {
        200: z.array(z.custom<typeof summaries.$inferSelect>()),
        401: z.object({ message: z.string() }),
      }
    },
    sendEmail: {
      method: 'POST' as const,
      path: '/api/summaries/send-email',
      input: z.object({
        email: z.string().email(),
        summaryId: z.number().optional()
      }),
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
        400: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
