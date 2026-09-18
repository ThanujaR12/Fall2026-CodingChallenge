// Top bar: the full logo (hidden while the sidebar shows its icon) and the account menu (or Log in).
import { Link } from 'react-router';
import { SignOut } from '@phosphor-icons/react';
import { PageContainer } from '@/components/PageContainer';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/features/auth/useAuth';
import { useSidebar } from '@/features/navigation/useSidebar';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { user, status, logout } = useAuth();
  const sidebar = useSidebar();
  const signedIn = status === 'signedIn' && Boolean(user);

  return (
    <header className="border-b border-divider md:border-b-0">
      <PageContainer className="flex min-h-[56px] max-w-[1800px] items-center justify-between gap-3">
        <Link
          to={user ? '/' : '/login'}
          className={cn(
            'inline-flex min-h-11 items-center text-[18px] text-ink transition-opacity duration-300 motion-reduce:transition-none',
            // While the sidebar is out it carries the logo icon, so the full logo steps aside.
            signedIn && sidebar.open && 'md:pointer-events-none md:opacity-0',
          )}
          tabIndex={signedIn && sidebar.open ? -1 : undefined}
        >
          <Logo markClassName="size-[22px]" />
        </Link>

        {status === 'signedIn' && user ? (
          <div className="flex items-center">
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
