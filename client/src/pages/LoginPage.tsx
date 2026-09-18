// Log in / Sign up screen (design 01): forms on the left, what the app does on the right.
import { useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { GoogleButton } from '@/features/auth/GoogleButton';
import { LoginForm } from '@/features/auth/LoginForm';
import { SignupForm } from '@/features/auth/SignupForm';
import { useAuth } from '@/features/auth/useAuth';
import { APP_NAME, LOGO_SWATCHES } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Only allow in-app paths as a "next" destination, never another site.
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/collections';
}

export function LoginPage() {
  const { status } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = params.get('mode') === 'signup' ? 'signup' : 'login';
  const next = safeNext(params.get('next'));

  useEffect(() => {
    document.title = `${mode === 'signup' ? 'Sign up' : 'Log in'} · ${APP_NAME}`;
  }, [mode]);

  if (status === 'signedIn') return <Navigate to={next} replace />;

  function switchMode(nextMode: 'login' | 'signup') {
    const updated = new URLSearchParams(params);
    if (nextMode === 'signup') updated.set('mode', 'signup');
    else updated.delete('mode');
    setParams(updated, { replace: true });
  }

  const tab = (value: 'login' | 'signup', label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === value}
      onClick={() => switchMode(value)}
      className={cn(
        'min-h-11 cursor-pointer border border-divider px-4 text-[14px] md:min-h-9',
        mode === value
          ? 'border-accent-strong bg-accent-strong font-semibold text-white'
          : 'bg-surface text-ink',
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="grid min-h-dvh bg-paper md:grid-cols-2">
      <main className="flex items-center px-4 py-10 md:px-14">
        <div className="w-full max-w-[380px]">
          <div className="mb-10 flex items-center gap-2.5">
            <span className="flex h-4 overflow-hidden" aria-hidden="true">
              {LOGO_SWATCHES.map((color) => (
                <span key={color} className="w-3" style={{ backgroundColor: color }} />
              ))}
            </span>
            <span className="text-[18px] font-semibold">{APP_NAME}</span>
          </div>

          <h1 className="text-[34px] md:text-[42px]">
            {mode === 'signup' ? 'Create your account.' : 'Welcome back.'}
          </h1>
          <p className="mt-2 mb-6 text-[15px] text-ink/75">
            Your boards, their colors, and everyone you build them with.
          </p>

          <div role="tablist" aria-label="Log in or sign up" className="mb-6 inline-flex">
            {tab('login', 'Log in')}
            {tab('signup', 'Sign up')}
          </div>

          {mode === 'signup' ? (
            <SignupForm onSuccess={() => navigate(next, { replace: true })} />
          ) : (
            <LoginForm onSuccess={() => navigate(next, { replace: true })} />
          )}

          <div className="mt-5">
            {/* Keyed by mode so Google's button re-renders with "Sign in" / "Sign up" text. */}
            <GoogleButton
              key={mode}
              mode={mode}
              onSuccess={() => navigate(next, { replace: true })}
              onNeedsAccount={() => switchMode('signup')}
            />
          </div>

          <p className="mt-6 text-[14px] text-ink/75">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="cursor-pointer text-accent-deep underline"
                  onClick={() => switchMode('login')}
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                No account yet?{' '}
                <button
                  type="button"
                  className="cursor-pointer text-accent-deep underline"
                  onClick={() => switchMode('signup')}
                >
                  Create one
                </button>{' '}
                — it takes less than a minute.
              </>
            )}
          </p>
        </div>
      </main>

      <aside className="hidden items-center bg-surface px-14 md:flex" aria-label="About the app">
        <div className="max-w-[420px]">
          <p className="label-caps mb-6">Why people use {APP_NAME}</p>
          <ul className="grid gap-6">
            {[
              [
                'Find it once, keep it forever',
                'Search millions of free photos and save them into named boards with your own notes.',
              ],
              [
                'Build boards together',
                'Invite friends as editors or viewers, and see who added what.',
              ],
              [
                'Share with one link',
                'Turn on a read-only link for anyone — and turn it off whenever you like.',
              ],
            ].map(([title, body]) => (
              <li key={title} className="border-b border-divider pb-6 last:border-b-0">
                <h2 className="text-[20px]">{title}</h2>
                <p className="mt-1 text-[14px] text-ink/75">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
