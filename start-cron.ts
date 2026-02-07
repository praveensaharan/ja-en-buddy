import { config } from 'dotenv';
config();

import('./cron-daily-summary.js').catch(console.error);
