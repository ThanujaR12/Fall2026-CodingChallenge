// Turns a board's palette into a gentle page theme: a soft header wash and a readable accent color.

function channels(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function saturation(hex: string): number {
  const [r, g, b] = channels(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = channels(hex).map((v) => Math.round(v * (1 - amount)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = channels(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const PAPER = '#F3F2F2';

// Dark colors wash more lightly so ink and muted text on top stay readable (WCAG AA).
function washAlpha(hex: string, base: number): number {
  return base * (0.4 + 0.6 * Math.sqrt(luminance(hex)));
}

function mix(hex: string, alpha: number): string {
  const paper = channels(PAPER);
  const rgb = channels(hex).map((v, i) => Math.round(paper[i] * (1 - alpha) + v * alpha));
  return `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export type BoardTheme = {
  /** Soft wash for the header band; text on it stays readable. */
  wash: string;
  /** The board's most colorful shade, darkened until it passes AA on the washed background. */
  accent: string;
};

export function boardTheme(palette: string[]): BoardTheme | null {
  if (palette.length === 0) return null;
  const [a, b = a, c = b] = palette;
  const [alphaA, alphaB, alphaC] = [washAlpha(a, 0.22), washAlpha(b, 0.16), washAlpha(c, 0.1)];
  const wash = `linear-gradient(115deg, ${withAlpha(a, alphaA)} 0%, ${withAlpha(b, alphaB)} 45%, ${withAlpha(c, alphaC)} 75%, rgba(243, 242, 242, 0) 100%)`;

  // The label sits over the strongest part of the wash, so check contrast there.
  const behindLabel = mix(a, alphaA);
  let accent = [...palette].sort((x, y) => saturation(y) - saturation(x))[0];
  for (let i = 0; i < 14 && contrast(accent, behindLabel) < 4.5; i += 1) {
    accent = darken(accent, 0.12);
  }
  return { wash, accent };
}
