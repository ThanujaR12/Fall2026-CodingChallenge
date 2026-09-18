// Round color swatches to browse photos by color; the chosen one gets a ring and a check.
import { Check } from '@phosphor-icons/react';
import { IMAGE_COLORS, type ImageColor } from '@/lib/colors';
import { cn } from '@/lib/utils';

type ColorPickerProps = { value: ImageColor | null; onChange: (color: ImageColor | null) => void };

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-4" aria-label="Colors">
      {IMAGE_COLORS.map((color) => {
        const active = color.id === value;
        const light = color.id === 'white' || color.id === 'yellow';
        return (
          <li key={color.id}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : color.id)}
              className="group flex w-16 cursor-pointer flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  'flex size-11 items-center justify-center rounded-full border border-ink/15 transition-transform group-hover:scale-110 motion-reduce:transition-none',
                  active && 'ring-2 ring-ink ring-offset-2 ring-offset-paper',
                )}
                style={{ background: color.swatch }}
              >
                {active && (
                  <Check
                    size={18}
                    weight="bold"
                    aria-hidden="true"
                    className={light ? 'text-ink' : 'text-white'}
                  />
                )}
              </span>
              <span
                className={cn(
                  'text-center text-[12px] leading-tight',
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
