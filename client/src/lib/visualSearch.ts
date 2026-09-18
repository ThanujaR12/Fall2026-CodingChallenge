// Search with a photo: recognises what's in it with MobileNet and reads its colours, all inside the
// browser. The photo never leaves the device; only the words it finds are used to search.
// TensorFlow.js is loaded on first use, so it costs nothing until someone opens the camera.

export type DetectedLabel = { name: string; probability: number };
export type PhotoAnalysis = { labels: DetectedLabel[]; palette: string[] };

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

// ImageNet names list synonyms ("tabby, tabby cat"); the first is the clearest search word.
function cleanLabel(className: string): string {
  return className.split(',')[0].trim().replace(/_/g, ' ');
}

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

/** What's in the photo (best guesses first) and its colours. */
export async function analyzePhoto(img: HTMLImageElement): Promise<PhotoAnalysis> {
  const model = await loadModel();
  const predictions = await model.classify(img, 5);
  const seen = new Set<string>();
  const labels = predictions
    .map((p) => ({ name: cleanLabel(p.className), probability: p.probability }))
    .filter((l) => (seen.has(l.name) ? false : (seen.add(l.name), true)))
    // Keep confident guesses, but always at least the top one.
    .filter((l, index) => index === 0 || l.probability >= 0.05)
    .slice(0, 4);
  return { labels, palette: paletteFromImage(img) };
}

/** Loads a data URL into an image element, ready for analysis. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That file couldn't be opened as an image."));
    img.src = src;
  });
}
