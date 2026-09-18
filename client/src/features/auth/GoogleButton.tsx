// "Continue with Google": Google's official button; its credential is exchanged for a PixBoard session.
import { useEffect, useRef, useState } from 'react';
import type { GoogleMode } from '@/api/auth';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { FormError } from './FormError';
import { useAuth } from './useAuth';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

// The small part of Google Identity Services this component uses.
type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
        use_fedcm_for_prompt?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
      prompt: () => void;
      cancel: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

// Loads Google's script once, no matter how many times the button mounts.
let scriptPromise: Promise<void> | null = null;
function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Could not load Google sign-in.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

type Props = {
  /** "login" never creates an account; "signup" does. */
  mode: GoogleMode;
  onSuccess: () => void;
  /** Called from the "no account yet" message to take the person to sign-up. */
  onNeedsAccount: () => void;
};

export function GoogleButton({ mode, onSuccess, onNeedsAccount }: Props) {
  const { loginWithGoogle } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAccount, setNeedsAccount] = useState(false);
  // Keep the latest handlers without re-rendering Google's button on every render.
  const handlers = useRef({ loginWithGoogle, onSuccess, mode });
  useEffect(() => {
    handlers.current = { loginWithGoogle, onSuccess, mode };
  });

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        const container = containerRef.current;
        if (cancelled || !container || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          // One Tap: browsers already signed in to Google show an account picker right away.
          use_fedcm_for_prompt: true,
          cancel_on_tap_outside: true,
          callback: async ({ credential }) => {
            if (!credential) return;
            setError(null);
            setNeedsAccount(false);
            try {
              await handlers.current.loginWithGoogle(credential, handlers.current.mode);
              handlers.current.onSuccess();
            } catch (err) {
              if (err instanceof ApiError && err.code === 'ACCOUNT_NOT_FOUND') {
                setNeedsAccount(true);
                return;
              }
              setError(
                err instanceof ApiError
                  ? err.message
                  : "Google sign-in didn't work. Please try again.",
              );
            }
          },
        });
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text: mode === 'signup' ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          width: Math.min(container.clientWidth || 380, 400),
        });
        // Offer the signed-in Google accounts without waiting for a click.
        window.google.accounts.id.prompt();
      })
      .catch(() => {
        if (!cancelled)
          setError("Google sign-in isn't available right now. Use your username and password.");
      });

    return () => {
      cancelled = true;
      window.google?.accounts.id.cancel();
    };
  }, [mode]);

  // No client id configured: hide Google sign-in entirely (FR-025).
  if (!CLIENT_ID) return null;

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3 text-[13px] text-ink/65" aria-hidden="true">
        <span className="h-px flex-1 bg-divider" />
        or
        <span className="h-px flex-1 bg-divider" />
      </div>
      <div ref={containerRef} className="flex min-h-11 justify-center" />
      {needsAccount && (
        <div
          role="alert"
          className="grid gap-3 border border-divider bg-surface p-4 text-[14px] text-ink"
        >
          <p>
            <strong className="font-semibold">You don't have a PaletteBoard account yet.</strong>{' '}
            Create one with this Google account to get started.
          </p>
          <Button type="button" onClick={onNeedsAccount} className="justify-self-start">
            Create account
          </Button>
        </div>
      )}
      {error && <FormError message={error} />}
    </div>
  );
}
