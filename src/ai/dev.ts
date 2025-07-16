import { config } from 'dotenv';
config();

import '@/ai/flows/generate-action-log.ts';
import '@/ai/flows/generate-testing-report.ts';
import '@/ai/flows/generate-playwright-steps.ts';
