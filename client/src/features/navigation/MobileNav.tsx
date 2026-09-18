// Phone navigation: the same destinations as the sidebar, as a bar along the bottom.
import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './navItems';

export function MobileNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-divider bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="flex h-16 items-center justify-around">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                cn(
                  'inline-flex size-12 items-center justify-center rounded-xl',
                  isActive ? 'text-ink' : 'text-ink/65',
                )
              }
            >
              {({ isActive }) => (
                <Icon size={26} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
