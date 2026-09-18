// Top bar, pinned while you scroll: the logo (hidden while the sidebar shows its icon), the
// always-there search for signed-in people, and the account menu (or Log in).
import { Link } from 'react-router';
import { CaretDown, SignOut } from '@phosphor-icons/react';
import { PageContainer } from '@/components/PageContainer';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/features/auth/useAuth';
import { useSidebar } from '@/features/navigation/useSidebar';
import { HeaderSearch } from '@/features/search/HeaderSearch';
import { Avatar } from './Avatar';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { user, status, logout } = useAuth();
  const sidebar = useSidebar();
  const signedIn = status === 'signedIn' && Boolean(user);

  return (
    <header className="glass sticky top-0 z-30 border-b border-divider/70">
      {/* A hairline in the logo's four colours. */}
      <div aria-hidden="true" className="brand-gradient h-[3px] w-full" />
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
          <div className="flex shrink-0 items-center gap-0.5">
            {/* Your avatar opens your profile; "My profile" shows on hover or keyboard focus. */}
            <Link
              to="/profile"
              aria-label="My profile"
              className="group relative inline-flex rounded-full p-0.5 outline-offset-2 hover:bg-surface"
            >
              <Avatar
                name={user.displayName || user.username}
                color={user.avatarColor}
                className="size-10 text-[13px] md:size-9"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-full right-0 z-50 mt-2 rounded-md bg-ink px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap text-paper opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                My profile
              </span>
            </Link>
            {/* A small menu beside it for quick jumps and signing out. */}
            <Popover>
              <PopoverTrigger
                aria-label="Account menu"
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-ink/70 hover:bg-surface hover:text-ink"
              >
                <CaretDown size={16} aria-hidden="true" />
              </PopoverTrigger>
              <PopoverContent align="end" className="grid w-[260px] gap-1 p-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface"
                >
                  <Avatar
                    name={user.displayName || user.username}
                    color={user.avatarColor}
                    className="size-10 text-[13px]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">
                      {user.displayName || user.username}
                    </span>
                    <span className="block truncate text-[12px] text-ink/65">{user.email}</span>
                  </span>
                </Link>
                <Link to="/profile" className="rounded-lg px-3 py-2 text-[14px] hover:bg-surface">
                  Saved photos
                </Link>
                <Link
                  to="/profile?tab=boards"
                  className="rounded-lg px-3 py-2 text-[14px] hover:bg-surface"
                >
                  Your boards
                </Link>
                <Link to="/palettes" className="rounded-lg px-3 py-2 text-[14px] hover:bg-surface">
                  Your palettes
                </Link>
                <Button variant="ghost" onClick={logout} className="justify-start">
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
