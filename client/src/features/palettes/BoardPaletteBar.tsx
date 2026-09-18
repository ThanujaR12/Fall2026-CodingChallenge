// A board's palette in its page header: copyable swatches, Copy all, Download, and
// "Find more like this palette". Empty boards show the grey placeholder instead.
import { Link } from 'react-router';
import { Copy, DownloadSimple, MagnifyingGlass } from '@phosphor-icons/react';
import { PaletteStrip } from '@/components/PaletteStrip';
import { Button, buttonVariants } from '@/components/ui/button';
import { nearestImageColor } from '@/lib/colors';
import { copyPalette, downloadPalette } from '@/lib/palette';

export function BoardPaletteBar({ name, palette }: { name: string; palette: string[] }) {
  if (palette.length === 0) {
    return (
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <PaletteStrip colors={[]} className="h-12 w-full max-w-[340px] rounded-lg" />
        <p className="text-[13px] text-ink/75">Save photos to see this board's colors.</p>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
      <PaletteStrip colors={palette} className="h-12 w-full max-w-[340px] rounded-lg" />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => copyPalette(palette)}>
          <Copy size={16} aria-hidden="true" />
          Copy all
        </Button>
        <Button variant="secondary" onClick={() => downloadPalette(name, palette)}>
          <DownloadSimple size={16} aria-hidden="true" />
          Download
        </Button>
        <Link
          to={`/palettes?color=${nearestImageColor(palette[0])}`}
          className={buttonVariants({ variant: 'secondary' })}
        >
          <MagnifyingGlass size={16} aria-hidden="true" />
          Find more like this palette
        </Link>
      </div>
    </div>
  );
}
