// Palette export: copy a board's hex codes or download them as a small text file.
import { copyText } from './clipboard';

export function copyPalette(palette: string[]) {
  return copyText(palette.join('\n'), 'Palette copied');
}

export function downloadPalette(name: string, palette: string[]) {
  const text = [`${name} — PixBoard palette`, '', ...palette].join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name.replace(/[^\w-]+/g, '-').toLowerCase() || 'board'}-palette.txt`;
  link.click();
  URL.revokeObjectURL(url);
}
