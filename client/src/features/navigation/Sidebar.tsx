// Desktop icon rail on the left that slides in and out; phones use MobileNav instead.
import { useEffect, type FocusEvent } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { LogoMark } from '@/components/Logo';
import { cn } from '@/lib/utils';
import { NavIcon } from './NavIcon';
import { NAV_ITEMS } from './navItems';
import { useSidebar } from './useSidebar';

const PEEK_MS = 3000;

export function Sidebar() {
  const { open, setHovered, setFocused, finishPeek } = useSidebar();
  const { pathname, key } = useLocation();

  // Arriving on Home shows the sidebar for a few seconds (timed from when it first appears).
  useEffect(() => {
    if (pathname !== '/') return;
    const timer = window.setTimeout(() => finishPeek(key), PEEK_MS);
    return () => window.clearTimeout(timer);
  }, [pathname, key, finishPeek]);

  // Stay open while focus moves between sidebar links; close once it leaves the sidebar.
  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  }

  return (
    <>
      {/* Invisible strip along the left edge: pointing at it brings the sidebar back. */}
      <div
        aria-hidden="true"
        onMouseEnter={() => setHovered(true)}
        className="fixed inset-y-0 left-0 z-30 hidden w-3 md:block"
      />
      <nav
        aria-label="Main"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col items-center border-r border-divider bg-paper py-4 transition-[translate,box-shadow] duration-300 ease-out motion-reduce:transition-none md:flex',
          open ? 'translate-x-0 shadow-[6px_0_28px_rgba(32,30,29,0.10)]' : '-translate-x-full',
        )}
      >
        <Link
          to="/"
          aria-label="PixBoard home"
          className="mb-6 inline-flex size-12 items-center justify-center rounded-xl hover:bg-surface"
        >
          <LogoMark className="size-7" />
        </Link>

        <ul className="flex flex-col items-center gap-2">
          {NAV_ITEMS.map(({ to, label, icon, end, colorful }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                aria-label={label}
                className={({ isActive }) =>
                  cn(
                    'group relative inline-flex size-12 items-center justify-center rounded-xl transition-colors',
                    isActive && !colorful && 'bg-ink text-paper',
                    isActive && colorful && 'bg-surface',
                    !isActive && 'text-ink/75 hover:bg-surface hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <NavIcon icon={icon} active={isActive} colorful={colorful} />
                    {/* Label bubble on hover or keyboard focus; the link's aria-label names it. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-full ml-3 rounded-md bg-ink px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap text-paper opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
