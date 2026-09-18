// Search with a photo: works out what a photo shows and which words will find photos like it.
//  1. Claude on the server (when set up) names brands, printed words, and the subject.
//  2. Tesseract OCR, in the browser, always reads printed words (brand names, titles, labels).
//  3. MobileNet, in the browser, recognises everyday objects when Claude isn't available.
// The on-device engines load only on first use, so they cost nothing until the camera is opened.
import { understandPhoto, visionEnabled } from '@/api/vision';

export type Guess = { name: string; probability?: number };

export type PhotoAnalysis = {
  /** "claude" when the server understood it; "device" when only on-device engines ran. */
  source: 'claude' | 'device';
  description: string | null;
  /** Brand names first, then other printed words. */
  words: string[];
  /** Search ideas, best first. */
  guesses: Guess[];
  palette: string[];
};

// ---------- MobileNet (objects, on device) ----------

type Classifier = {
  classify: (
    img: HTMLImageElement | HTMLCanvasElement,
    topk?: number,
  ) => Promise<{ className: string; probability: number }[]>;
};

let modelPromise: Promise<Classifier> | null = null;

/** Loads TensorFlow.js and the MobileNet model once (about 14 MB, cached by the browser). */
export function loadModel(): Promise<Classifier> {
  modelPromise ??= (async () => {
    const [tf, mobilenet] = await Promise.all([
      import('@tensorflow/tfjs-core'),
      import('@tensorflow-models/mobilenet'),
      import('@tensorflow/tfjs-converter'),
      import('@tensorflow/tfjs-backend-cpu'),
      import('@tensorflow/tfjs-backend-webgl'),
    ]);
    // Prefer the GPU; fall back to the CPU where WebGL isn't available.
    if (!(await tf.setBackend('webgl').catch(() => false))) await tf.setBackend('cpu');
    await tf.ready();
    return mobilenet.load({ version: 2, alpha: 1.0 }) as Promise<Classifier>;
  })().catch((err) => {
    modelPromise = null; // let a later attempt retry
    throw err;
  });
  return modelPromise;
}

async function objectGuesses(img: HTMLImageElement): Promise<Guess[]> {
  const model = await loadModel();
  const predictions = await model.classify(img, 5);
  const seen = new Set<string>();
  return (
    predictions
      // ImageNet names list synonyms ("tabby, tabby cat"); the first is the clearest search word.
      .map((p) => ({ name: p.className.split(',')[0].trim(), probability: p.probability }))
      .filter((g) => (seen.has(g.name) ? false : (seen.add(g.name), true)))
      .filter((g, index) => index === 0 || g.probability >= 0.05)
      .slice(0, 4)
  );
}

// ---------- Tesseract (printed words, on device) ----------

type OcrWord = { text: string; confidence: number };

type OcrWorker = {
  setParameters: (params: Record<string, string>) => Promise<unknown>;
  recognize: (
    img: HTMLImageElement | HTMLCanvasElement,
    options?: object,
    output?: object,
  ) => Promise<{
    data: { blocks: { paragraphs: { lines: { words: OcrWord[] }[] }[] }[] | null };
  }>;
};

let ocrPromise: Promise<OcrWorker> | null = null;

/** Starts the English OCR engine once (about 5 MB, cached by the browser). */
export function loadOcr(): Promise<OcrWorker> {
  ocrPromise ??= import('tesseract.js')
    .then(async ({ createWorker, PSM }) => {
      const worker = (await createWorker('eng')) as unknown as OcrWorker;
      // "Sparse text" finds scattered words anywhere in a photo (labels, signs, packaging),
      // where the default document layout mode finds nothing.
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
      return worker;
    })
    .catch((err) => {
      ocrPromise = null;
      throw err;
    });
  return ocrPromise;
}

// Enlarged copies help with small print; grayscale helps with coloured backgrounds.
function enlarged(img: HTMLImageElement, grayscale: boolean): HTMLCanvasElement {
  const scale = Math.min(2, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  if (grayscale) {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = pixels.data;
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = g;
    }
    ctx.putImageData(pixels, 0, 0);
  }
  return canvas;
}

// Words worth searching: confident, mostly letters, and not filler.
const FILLER = new Set(['the', 'and', 'for', 'with', 'you', 'your', 'are', 'www', 'com', 'net']);

async function printedWords(img: HTMLImageElement): Promise<string[]> {
  const worker = await loadOcr();
  // Two passes catch different words (on a chalk box, colour reads "Chalk", grayscale "Crayola").
  const words: OcrWord[] = [];
  for (const pass of [enlarged(img, false), enlarged(img, true)]) {
    const { data } = await worker.recognize(pass, {}, { blocks: true });
    for (const block of data.blocks ?? []) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) words.push(...line.words);
      }
    }
  }
  const seen = new Set<string>();
  return words
    .filter((w) => w.confidence >= 70)
    .sort((a, b) => b.confidence - a.confidence)
    .map((w) => w.text.replace(/[^\p{L}\p{N}&'-]/gu, ''))
    .filter((t) => t.length >= 3 && /\p{L}/u.test(t) && !FILLER.has(t.toLowerCase()))
    .filter((t) => (seen.has(t.toLowerCase()) ? false : (seen.add(t.toLowerCase()), true)))
    .slice(0, 6);
}

// ---------- Colours (on device) ----------

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** Up to five dominant colours: group similar pixels, then keep the biggest groups. */
export function paletteFromImage(img: HTMLImageElement | HTMLCanvasElement, size = 5): string[] {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, 64, 64);
  const { data } = ctx.getImageData(0, 0, 64, 64);
  const groups = new Map<string, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const key = `${r >> 5},${g >> 5},${b >> 5}`;
    const group = groups.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    group.count += 1;
    group.r += r;
    group.g += g;
    group.b += b;
    groups.set(key, group);
  }
  return [...groups.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, size)
    .map((g) => toHex(g.r / g.count, g.g / g.count, g.b / g.count));
}

// ---------- Putting it together ----------

/** Warms up whichever engines this visit will use, while the person picks a photo. */
export async function warmUp() {
  void loadOcr().catch(() => {});
  if (!(await visionEnabled())) void loadModel().catch(() => {});
}

function mergeWords(...lists: string[][]): string[] {
  const seen = new Set<string>();
  return lists
    .flat()
    .filter((w) => (seen.has(w.toLowerCase()) ? false : (seen.add(w.toLowerCase()), true)))
    .slice(0, 8);
}

export async function analyzePhoto(img: HTMLImageElement, dataUrl: string): Promise<PhotoAnalysis> {
  const palette = paletteFromImage(img);
  const ocr = printedWords(img).catch(() => [] as string[]);

  if (await visionEnabled()) {
    const [understanding, words] = await Promise.all([
      understandPhoto(dataUrl).catch(() => null),
      ocr,
    ]);
    if (understanding) {
      return {
        source: 'claude',
        description: understanding.description,
        words: mergeWords(understanding.brands, understanding.text, words),
        guesses: understanding.keywords.map((name) => ({ name })),
        palette,
      };
    }
  }

  // No server understanding: printed words (if any) lead, then recognised objects.
  const [words, objects] = await Promise.all([ocr, objectGuesses(img)]);
  const guesses: Guess[] =
    words.length > 0 ? [{ name: words.slice(0, 2).join(' ').toLowerCase() }] : [];
  return {
    source: 'device',
    description: null,
    words,
    // With real words to go on, weak object guesses are more noise than help.
    guesses: [
      ...guesses,
      ...objects.filter((o) => words.length === 0 || (o.probability ?? 0) >= 0.15),
    ],
    palette,
  };
}

/** Loads an image from a URL (data or blob), ready for analysis. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That file couldn't be opened as an image."));
    img.src = src;
  });
}
