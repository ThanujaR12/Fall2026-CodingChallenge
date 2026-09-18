// Pixabay's color filters, offered for browsing and searching by color (Palette Boards).
export const IMAGE_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'turquoise',
  'blue',
  'lilac',
  'pink',
  'brown',
  'black',
  'gray',
  'white',
  'grayscale',
] as const;

export type ImageColor = (typeof IMAGE_COLORS)[number];

function toHsl(hex: string): { h: number; s: number; l: number } {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

/** The named color closest to a hex (kept in step with the client's copy in lib/colors.ts). */
export function nearestImageColor(hex: string): ImageColor {
  const { h, s, l } = toHsl(hex);
  if (l > 0.9) return 'white';
  if (l < 0.13) return 'black';
  if (s < 0.14) return l > 0.75 ? 'white' : l < 0.25 ? 'black' : 'gray';
  if (h >= 15 && h < 70 && l < 0.34) return 'brown';
  if (h < 15 || h >= 340) return 'red';
  if (h < 42) return 'orange';
  if (h < 68) return 'yellow';
  if (h < 160) return 'green';
  if (h < 195) return 'turquoise';
  if (h < 255) return 'blue';
  if (h < 295) return 'lilac';
  return 'pink';
}
