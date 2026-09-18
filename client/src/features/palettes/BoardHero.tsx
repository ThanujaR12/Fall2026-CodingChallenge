// Themed header band for a board: a thin stripe of its colors on top and a soft wash behind the title.
import type { CSSProperties, ReactNode } from 'react';
import { boardTheme } from '@/lib/boardTheme';

export function BoardHero({ palette, children }: { palette: string[]; children: ReactNode }) {
  const theme = boardTheme(palette);

  return (
    <div
      className="relative -mx-4 mb-8 px-4 pt-7 pb-6 md:-mx-10 md:mb-10 md:px-10 md:pt-10"
      style={
        theme
          ? ({ background: theme.wash, '--board-accent': theme.accent } as CSSProperties)
          : undefined
      }
    >
      {theme && (
        <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-1.5">
          {palette.map((color) => (
            <span key={color} className="flex-1" style={{ backgroundColor: color }} />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
