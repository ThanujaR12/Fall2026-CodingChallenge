// A board's palette in its page header: copyable swatches and "Find more like this palette".
import { Link } from 'react-router';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { PaletteStrip } from '@/components/PaletteStrip';
import { buttonVariants } from '@/components/ui/button';
import { nearestImageColor } from '@/lib/colors';

export function BoardPaletteBar({ palette }: { palette: string[] }) {
  if (palette.length === 0) return null;
  const color = nearestImageColor(palette[0]);

  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
      <PaletteStrip colors={palette} className="h-12 w-full max-w-[340px] rounded-lg" />
      <Link
        to={`/palettes?color=${color}`}
        className={buttonVariants({ variant: 'secondary', className: 'self-start sm:self-auto' })}
      >
        <MagnifyingGlass size={16} aria-hidden="true" />
        Find more like this palette
      </Link>
    </div>
  );
}
