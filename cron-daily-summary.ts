import cron from 'node-cron';
import { storage } from './server/storage.js';
import { sendSummaryEmail } from './server/email.js';
import OpenAI from 'openai';

const USER_ID = 'pra40109';
const EMAIL = 'pra40109@gmail.com';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function sendDailySummary() {
  try {
    console.log(`[${new Date().toISOString()}] Running daily summary job...`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const summaries = await storage.getSummaries(USER_ID);
    const todaySummary = summaries.find(s => {
      const summaryDate = new Date(s.date);
      summaryDate.setHours(0, 0, 0, 0);
      return summaryDate.getTime() === today.getTime();
    });
    
    let summaryToSend;
    
    if (!todaySummary) {
      console.log('No summary for today. Generating new summary...');
      
      const translations = await storage.getTranslations(USER_ID);
      
      if (translations.length === 0) {
        console.log('No translations found. Skipping email.');
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
        userId: USER_ID,
        content: parsed.content,
        vocab: parsed.vocab,
        date: new Date()
      });
      
      console.log('✅ Summary generated successfully');
    } else {
      summaryToSend = todaySummary;
      console.log('Using existing summary from today');
    }
    
    const success = await sendSummaryEmail(EMAIL, summaryToSend.content);
    
    if (success) {
      console.log('✅ Daily summary email sent successfully!');
    } else {
      console.log('❌ Failed to send daily summary email');
    }
  } catch (error) {
    console.error('Error in daily summary job:', error);
  }
}

// Run every day at 8:00 PM Tokyo time
cron.schedule('0 21 * * *', sendDailySummary, {
  timezone: 'Asia/Tokyo'
});

console.log('📅 Daily summary cron job started - will run at 9:00 PM Tokyo time every day');

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n👋 Stopping cron job...');
  process.exit(0);
});
