// Top navigation: wordmark on the left, Search and My collections links on the right.
import { Link, NavLink } from 'react-router';
import { PageContainer } from '@/components/PageContainer';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex min-h-11 items-center text-[15px] hover:text-accent md:min-h-9',
    isActive ? 'text-accent' : 'text-ink',
  );

export function AppHeader() {
  return (
    <header className="border-b border-divider md:border-b-0">
      <PageContainer className="flex min-h-[56px] items-center justify-between gap-4">
        <Link to="/search" className="text-[18px] font-semibold tracking-[-0.015em] text-ink">
          {APP_NAME}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-5">
          <NavLink to="/search" className={navLinkClass}>
            Search
          </NavLink>
          <NavLink to="/collections" className={navLinkClass}>
            My collections
          </NavLink>
        </nav>
      </PageContainer>
    </header>
  );
}
