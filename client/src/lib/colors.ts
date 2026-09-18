// Palette Boards color helpers: the browsable color filters and matching a hex to the nearest one.
export const IMAGE_COLORS = [
  { id: 'red', label: 'Red', swatch: '#D7263D' },
  { id: 'orange', label: 'Orange', swatch: '#F28C28' },
  { id: 'yellow', label: 'Yellow', swatch: '#F2C94C' },
  { id: 'green', label: 'Green', swatch: '#3A9D5D' },
  { id: 'turquoise', label: 'Turquoise', swatch: '#1FB5AC' },
  { id: 'blue', label: 'Blue', swatch: '#2F6FD6' },
  { id: 'lilac', label: 'Lilac', swatch: '#9B7BD8' },
  { id: 'pink', label: 'Pink', swatch: '#EE6FA8' },
  { id: 'brown', label: 'Brown', swatch: '#8A5A3B' },
  { id: 'black', label: 'Black', swatch: '#1B1B1B' },
  { id: 'gray', label: 'Gray', swatch: '#9A9A9A' },
  { id: 'white', label: 'White', swatch: '#FFFFFF' },
  {
    id: 'grayscale',
    label: 'Black and white',
    swatch: 'linear-gradient(135deg, #111 50%, #F5F5F5 50%)',
  },
] as const;

export type ImageColor = (typeof IMAGE_COLORS)[number]['id'];

export function isImageColor(value: string | null): value is ImageColor {
  return IMAGE_COLORS.some((color) => color.id === value);
}

/** The Palettes brand ring: a flat conic sweep through the color filters. */
export const RAINBOW =
  'conic-gradient(from 200deg, #D6006C, #F28C28, #F2C94C, #3A9D5D, #007A9E, #6B4FD8, #D6006C)';

/** Placeholder shown for a board that has no photos (and so no colors) yet. */
export const EMPTY_PALETTE = ['#E4E1DF', '#D3CFCC', '#BDB8B4', '#A29C98', '#86807C'];

function toHsl(hex: string): { h: number; s: number; l: number } {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s, l };
}

/** The browsable color closest to a hex, used by "Find more like this palette". */
export function nearestImageColor(hex: string): ImageColor {
  const { h, s, l } = toHsl(hex);
  if (l > 0.9) return 'white';
  if (l < 0.13) return 'black';
  if (s < 0.14) return l > 0.75 ? 'white' : l < 0.25 ? 'black' : 'gray';
  // Dark oranges and olives read as brown rather than orange or yellow.
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

/** Black or white, whichever reads better on top of the given color. */
export function readableOn(hex: string): string {
  return toHsl(hex).l > 0.6 ? '#201E1D' : '#FFFFFF';
}
