// Loads and validates environment variables once, so a missing value fails fast with a clear message.
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  PIXABAY_API_KEY: z.string().min(1),
  CLIENT_ORIGIN: z.url().default('http://localhost:5173'),
  NODE_ENV: z.string().default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  for (const issue of parsed.error.issues) {
    console.error(`Missing or invalid environment variable: ${issue.path.join('.')}`);
  }
  console.error('Copy server/.env.example to server/.env and fill in the values.');
  process.exit(1);
}

export const env = parsed.data;
