// Round color swatches to browse photos by color; the chosen one gets a ring and a check.
import { Check } from '@phosphor-icons/react';
import { IMAGE_COLORS, type ImageColor } from '@/lib/colors';
import { cn } from '@/lib/utils';

type ColorPickerProps = {
  value: ImageColor | null;
  onChange: (color: ImageColor | null) => void;
  /** "compact": small swatches without visible labels (the names are still announced). */
  size?: 'default' | 'compact';
};

export function ColorPicker({ value, onChange, size = 'default' }: ColorPickerProps) {
  const compact = size === 'compact';
  return (
    <ul
      className={cn('flex flex-wrap', compact ? 'gap-1.5' : 'gap-x-3 gap-y-4')}
      aria-label="Colors"
    >
      {IMAGE_COLORS.map((color) => {
        const active = color.id === value;
        const light = color.id === 'white' || color.id === 'yellow';
        return (
          <li key={color.id}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : color.id)}
              title={color.label}
              className={cn(
                'group flex cursor-pointer flex-col items-center gap-1.5',
                compact ? 'size-11 justify-center' : 'w-16',
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center rounded-full border border-ink/15 transition-transform group-hover:scale-110 motion-reduce:transition-none',
                  compact ? 'size-8' : 'size-11',
                  active && 'ring-2 ring-ink ring-offset-2 ring-offset-paper',
                )}
                style={{ background: color.swatch }}
              >
                {active && (
                  <Check
                    size={compact ? 15 : 18}
                    weight="bold"
                    aria-hidden="true"
                    className={light ? 'text-ink' : 'text-white'}
                  />
                )}
              </span>
              <span
                className={cn(
                  'text-center text-[12px] leading-tight',
                  compact && 'sr-only',
                  active ? 'font-semibold text-ink' : 'text-ink/70',
                )}
              >
                {color.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
