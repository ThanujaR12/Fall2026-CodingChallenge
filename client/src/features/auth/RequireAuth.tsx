// Shows its pages only to signed-in users; everyone else goes to sign in and comes back after.
import { Navigate, Outlet, useLocation } from 'react-router';
import { CircleNotch } from '@phosphor-icons/react';
import { useAuth } from './useAuth';

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div role="status" className="flex min-h-[50dvh] items-center justify-center text-ink/65">
        <CircleNotch size={24} className="animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading your account</span>
      </div>
    );
  }

  if (status === 'signedOut') {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <Outlet />;
}
