// "Search with a photo", server side: asks Claude what a photo shows (brands, printed words, the
// main subject) and which words would find similar photos. The photo is analysed and discarded;
// it is never stored or logged.
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

// The current Opus; low effort is plenty for describing a single photo and keeps it quick.
const MODEL = 'claude-opus-5';

export const PhotoUnderstanding = z.object({
  description: z
    .string()
    .describe(
      'One short sentence describing the photo, e.g. "A box of 12 Crayola chalk sticks held up in a classroom".',
    ),
  subject: z.string().describe('The main thing in the photo in 1-3 words, e.g. "chalk box".'),
  brands: z
    .array(z.string())
    .describe(
      'Brand or product names that are clearly visible or recognisable, e.g. ["Crayola"]. Empty if none.',
    ),
  text: z
    .array(z.string())
    .describe(
      'Distinct words or short phrases printed in the photo, as written, most prominent first. Empty if none.',
    ),
  keywords: z
    .array(z.string())
    .describe(
      '3-5 short stock-photo search queries (1-3 words each), best first, that would find similar photos: combine brand and product when there is one (e.g. "crayola chalk"), then the product type, then related ideas.',
    ),
});

export type PhotoUnderstanding = z.infer<typeof PhotoUnderstanding>;

const PROMPT = `You help people find stock photos similar to a photo they took.
Look at the photo carefully. Read any printed text exactly as written, and identify brands or products you can clearly see or recognise.
Then suggest search queries for a stock-photo site (Pixabay): short, concrete, and lowercase. If there is a recognisable brand or product, the first query should name it together with the product type.
Only report text and brands you can actually see; do not guess.`;

let client: Anthropic | null = null;

export function visionEnabled(): boolean {
  return env.ANTHROPIC_API_KEY.length > 0;
}

function anthropic(): Anthropic {
  client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 30_000, maxRetries: 1 });
  return client;
}

export async function understandPhoto(
  base64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<PhotoUnderstanding> {
  if (!visionEnabled()) {
    throw new AppError(503, 'VISION_DISABLED', 'Photo understanding is not set up on this server.');
  }

  let response;
  try {
    response = await anthropic().beta.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      // If a safety filter declines, the API retries on a suitable fallback model automatically.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: zodOutputFormat(PhotoUnderstanding) },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      throw new AppError(
        429,
        'VISION_BUSY',
        'Photo search is busy right now. Try again in a moment.',
      );
    }
    if (err instanceof Anthropic.APIError) {
      console.error(`Vision request failed (${err.status ?? 'network'}): ${err.message}`);
      throw new AppError(502, 'VISION_UNAVAILABLE', "We couldn't analyse that photo right now.");
    }
    throw err;
  }

  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    throw new AppError(422, 'VISION_NO_RESULT', "We couldn't work out what's in that photo.");
  }
  const result = response.parsed_output;
  // Tidy the model's lists: trimmed, de-duplicated, and bounded.
  const tidy = (list: string[], max: number) =>
    [...new Set(list.map((s) => s.trim()).filter(Boolean))].slice(0, max);
  return {
    description: result.description.trim(),
    subject: result.subject.trim(),
    brands: tidy(result.brands, 5),
    text: tidy(result.text, 8),
    keywords: tidy(
      result.keywords.map((k) => k.toLowerCase()),
      5,
    ),
  };
}
