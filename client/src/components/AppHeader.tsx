// Top navigation: wordmark, Search and My collections, and the account menu (or Log in).
import { Link, NavLink } from 'react-router';
import { SignOut } from '@phosphor-icons/react';
import { PageContainer } from '@/components/PageContainer';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/features/auth/useAuth';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex min-h-11 items-center text-[15px] hover:text-accent-deep md:min-h-9',
    isActive ? 'text-accent-deep' : 'text-ink',
  );

export function AppHeader() {
  const { user, status, logout } = useAuth();

  return (
    <header className="border-b border-divider md:border-b-0">
      <PageContainer className="flex min-h-[56px] items-center justify-between gap-3">
        <Link
          to={user ? '/search' : '/login'}
          className="inline-flex min-h-11 items-center text-[18px] font-semibold tracking-[-0.015em] text-ink"
        >
          {APP_NAME}
        </Link>

        {status === 'signedIn' && user ? (
          <nav aria-label="Main" className="flex items-center gap-4 md:gap-5">
            <NavLink to="/search" className={navLinkClass}>
              Search
            </NavLink>
            <NavLink to="/collections" className={navLinkClass}>
              <span className="md:hidden">Boards</span>
              <span className="hidden md:inline">My collections</span>
            </NavLink>
            <Popover>
              <PopoverTrigger
                aria-label={`Account: ${user.username}`}
                className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-accent-deep text-[13px] font-semibold text-white uppercase md:size-9"
              >
                {user.username.slice(0, 2)}
              </PopoverTrigger>
              <PopoverContent align="end" className="grid w-[240px] gap-3">
                <div>
                  <p className="text-[15px] font-semibold">@{user.username}</p>
                  <p className="truncate text-[13px] text-ink/65">{user.email}</p>
                </div>
                <Button variant="secondary" onClick={logout}>
                  <SignOut size={16} />
                  Log out
                </Button>
              </PopoverContent>
            </Popover>
          </nav>
        ) : status === 'signedOut' ? (
          <Link to="/login" className={buttonVariants({ variant: 'secondary' })}>
            Log in
          </Link>
        ) : null}
      </PageContainer>
    </header>
  );
}
