// Log in / Sign up screen (design 01): forms on the left, what the app does on the right.
import { useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { MagnifyingGlass, Palette, UsersThree } from '@phosphor-icons/react';
import { GoogleButton } from '@/features/auth/GoogleButton';
import { LoginForm } from '@/features/auth/LoginForm';
import { SignupForm } from '@/features/auth/SignupForm';
import { useAuth } from '@/features/auth/useAuth';
import { Logo } from '@/components/Logo';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Only allow in-app paths as a "next" destination, never another site.
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
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
        'min-h-10 cursor-pointer rounded-full px-5 text-[14px] font-semibold transition-colors md:min-h-9',
        mode === value ? 'bg-white text-ink shadow-soft' : 'text-ink/70 hover:text-ink',
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <main className="flex items-center px-4 py-10 md:px-14">
        <div className="w-full max-w-[380px]">
          <Logo className="mb-10 gap-2.5 text-[20px] text-ink" markClassName="size-7" />

          <h1 className="text-[34px] md:text-[42px]">
            {mode === 'signup' ? (
              <>
                Create your <span className="text-brand">account.</span>
              </>
            ) : (
              <>
                Welcome <span className="text-brand">back.</span>
              </>
            )}
          </h1>
          <p className="mt-2 mb-6 text-[15px] text-ink/75">
            Your boards, their colors, and everyone you build them with.
          </p>

          <div
            role="tablist"
            aria-label="Log in or sign up"
            className="mb-6 inline-flex rounded-full bg-surface p-1"
          >
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

      <aside
        className="relative hidden overflow-hidden bg-ink px-14 text-paper md:flex md:items-center"
        aria-label="About the app"
      >
        {/* Soft glows in the logo's colours. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -left-32 size-[520px] rounded-full bg-[#007a9e] opacity-40 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -bottom-40 size-[520px] rounded-full bg-[#d6006c] opacity-35 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-10 size-[300px] rounded-full bg-[#c1663c] opacity-25 blur-[110px]"
        />
        <div className="relative max-w-[460px]">
          <div aria-hidden="true" className="mb-8 flex gap-2">
            {['#007a9e', '#3a9d5d', '#c1663c', '#d6006c', '#faf8f6'].map((hex) => (
              <span key={hex} className="h-2 w-10 rounded-full" style={{ backgroundColor: hex }} />
            ))}
          </div>
          <p className="text-[40px] leading-[1.05] font-extrabold tracking-[-0.035em]">
            Collect what inspires you.{' '}
            <span className="font-serif font-semibold italic">In colour.</span>
          </p>
          <ul className="mt-10 grid gap-3">
            {(
              [
                [
                  MagnifyingGlass,
                  'Find it once, keep it forever',
                  'Search millions of free photos — by word, colour, voice, or a photo.',
                ],
                [
                  Palette,
                  'Boards with their own colours',
                  'Every board learns its palette from the photos you save.',
                ],
                [
                  UsersThree,
                  'Build boards together',
                  'Invite editors or viewers, and share a read-only link.',
                ],
              ] as const
            ).map(([Icon, title, body]) => (
              <li
                key={title}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Icon size={20} weight="duotone" aria-hidden="true" />
                </span>
                <span>
                  <h2 className="text-[16px] text-paper">{title}</h2>
                  <p className="mt-0.5 text-[14px] text-paper/75">{body}</p>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
