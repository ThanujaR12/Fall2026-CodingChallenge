// A person's avatar: initials on their chosen colour, optionally wrapped in a ring of their palette.
import { readableOn } from '@/lib/colors';
import { cn } from '@/lib/utils';

type AvatarProps = {
  name: string;
  color?: string | null;
  /** Colours for the ring (e.g. your colour signature); no ring when empty. */
  ring?: string[];
  className?: string;
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ name, color, ring = [], className }: AvatarProps) {
  const fill = color || '#006786';
  const face = (
    <span
      aria-hidden="true"
      className="inline-flex h-full w-full items-center justify-center rounded-full font-semibold"
      style={{ backgroundColor: fill, color: readableOn(fill) }}
    >
      {initialsOf(name)}
    </span>
  );
  if (ring.length === 0) {
    return <span className={cn('inline-flex rounded-full', className)}>{face}</span>;
  }
  // The ring sweeps through the palette and back to its first colour.
  const sweep = `conic-gradient(${[...ring, ring[0]].join(', ')})`;
  return (
    <span className={cn('inline-flex rounded-full p-1', className)} style={{ background: sweep }}>
      <span className="inline-flex h-full w-full rounded-full bg-paper p-[3px]">{face}</span>
    </span>
  );
}
