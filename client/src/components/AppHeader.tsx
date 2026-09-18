// Top bar, pinned while you scroll: the logo (hidden while the sidebar shows its icon), the
// always-there search for signed-in people, and the account menu (or Log in).
import { Link } from 'react-router';
import { SignOut } from '@phosphor-icons/react';
import { PageContainer } from '@/components/PageContainer';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/features/auth/useAuth';
import { useSidebar } from '@/features/navigation/useSidebar';
import { HeaderSearch } from '@/features/search/HeaderSearch';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { user, status, logout } = useAuth();
  const sidebar = useSidebar();
  const signedIn = status === 'signedIn' && Boolean(user);

  return (
    <header className="sticky top-0 z-30 border-b border-divider bg-paper/95 backdrop-blur">
      <PageContainer className="flex h-16 max-w-[1800px] items-center justify-between gap-3 md:gap-6">
        <Link
          to={user ? '/' : '/login'}
          className={cn(
            'inline-flex min-h-11 items-center text-[18px] text-ink transition-opacity duration-300 motion-reduce:transition-none',
            // While the sidebar is out it carries the logo icon, so the full logo steps aside.
            signedIn && sidebar.open && 'md:pointer-events-none md:opacity-0',
          )}
          tabIndex={signedIn && sidebar.open ? -1 : undefined}
        >
          <Logo markClassName="size-[22px]" compactOnMobile={signedIn} />
        </Link>

        {signedIn && (
          <div className="min-w-0 max-w-[760px] flex-1">
            <HeaderSearch />
          </div>
        )}

        {status === 'signedIn' && user ? (
          <div className="flex shrink-0 items-center">
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
          </div>
        ) : status === 'signedOut' ? (
          <Link to="/login" className={buttonVariants({ variant: 'secondary' })}>
            Log in
          </Link>
        ) : null}
      </PageContainer>
    </header>
  );
}
