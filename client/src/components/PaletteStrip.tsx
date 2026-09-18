// A board's colors as a row of swatches: hover or focus shows the hex code, clicking copies it.
import { copyText } from '@/lib/clipboard';
import { EMPTY_PALETTE, readableOn } from '@/lib/colors';
import { cn } from '@/lib/utils';

type PaletteStripProps = { colors: string[]; className?: string };

export function PaletteStrip({ colors, className }: PaletteStripProps) {
  // An empty board shows a quiet grey placeholder that can't be copied.
  if (colors.length === 0) {
    return (
      <div
        className={cn('flex h-20 overflow-hidden rounded-xl', className)}
        role="img"
        aria-label="No colors yet"
      >
        {EMPTY_PALETTE.map((color) => (
          <span key={color} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>
    );
  }

  return (
    <ul className={cn('flex h-20 overflow-hidden rounded-xl', className)} aria-label="Palette">
      {colors.map((color) => (
        <li key={color} className="flex-1">
          <button
            type="button"
            onClick={() => copyText(color, `Copied ${color}`)}
            aria-label={`Copy ${color}`}
            title={`Copy ${color}`}
            className="group flex h-full w-full cursor-pointer items-end justify-center pb-2 outline-offset-[-3px] transition-[flex] focus-visible:outline-2"
            style={{ backgroundColor: color, color: readableOn(color) }}
          >
            <span className="font-mono text-[11px] font-semibold opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:opacity-100">
              {color}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
