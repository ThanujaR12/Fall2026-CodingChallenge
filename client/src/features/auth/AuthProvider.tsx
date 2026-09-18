// Keeps track of who is signed in, restores the session on reload, and handles expired sessions.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as authApi from '@/api/auth';
import { clearToken, getToken, setToken, setUnauthenticatedHandler } from '@/api/client';
import type { AuthUser } from '@/types/api';
import { AuthContext, type AuthState } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthState['status']>(() =>
    getToken() ? 'loading' : 'signedOut',
  );
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // On first load, turn a stored token back into a signed-in user (or discard it if it expired).
  useEffect(() => {
    if (!getToken()) return;
    authApi
      .me()
      .then((me) => {
        setUser(me);
        setStatus('signedIn');
      })
      .catch(() => {
        clearToken();
        setStatus('signedOut');
      });
  }, []);

  // When any request finds the session expired, send the user to sign in and bring them back.
  useEffect(() => {
    setUnauthenticatedHandler(() => {
      setUser(null);
      setStatus('signedOut');
      queryClient.clear();
      toast('Your session ended. Please sign in again.');
      const next = `${location.pathname}${location.search}`;
      navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
    });
    return () => setUnauthenticatedHandler(null);
  }, [navigate, location, queryClient]);

  const finishSignIn = useCallback(
    (token: string, signedIn: AuthUser) => {
      setToken(token);
      queryClient.clear();
      setUser(signedIn);
      setStatus('signedIn');
    },
    [queryClient],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      status,
      login: async (usernameOrEmail, password) => {
        const res = await authApi.login({ usernameOrEmail, password });
        finishSignIn(res.token, res.user);
      },
      register: async (username, email, password) => {
        const res = await authApi.register({ username, email, password });
        finishSignIn(res.token, res.user);
      },
      loginWithGoogle: async (credential, mode) => {
        const res = await authApi.loginWithGoogle(credential, mode);
        finishSignIn(res.token, res.user);
      },
      updateUser: (next) => setUser(next),
      logout: () => {
        clearToken();
        queryClient.clear();
        setUser(null);
        setStatus('signedOut');
        navigate('/login', { replace: true });
      },
    }),
    [user, status, finishSignIn, queryClient, navigate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
