// A navigation icon; the Palettes item sits inside a rainbow ring so it stands out.
import type { Icon } from '@phosphor-icons/react';
import { RAINBOW } from '@/lib/colors';
import { cn } from '@/lib/utils';

type NavIconProps = {
  icon: Icon;
  active: boolean;
  colorful?: boolean;
  size?: number;
  /** Unread count shown as a magenta badge (hidden at 0). */
  badge?: number;
};

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent2 px-1 text-[11px] font-semibold text-white ring-2 ring-paper"
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function NavIcon({ icon: Icon, active, colorful, size = 24, badge = 0 }: NavIconProps) {
  if (!colorful) {
    return (
      <>
        <Icon size={size} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
        <Badge count={badge} />
      </>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-9 items-center justify-center rounded-full transition-transform group-hover:rotate-45 motion-reduce:transition-none"
      style={{ background: RAINBOW }}
    >
      <span
        className={cn(
          'inline-flex size-[26px] items-center justify-center rounded-full',
          active ? 'bg-ink text-paper' : 'bg-paper text-ink',
        )}
      >
        <Icon size={size - 8} weight="fill" />
      </span>
    </span>
  );
}
