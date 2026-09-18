// The signed-in user and the sign-in/out actions, shared through React context.
import { createContext, useContext } from 'react';
import type { AuthUser } from '@/types/api';

export type AuthState = {
  user: AuthUser | null;
  status: 'loading' | 'signedIn' | 'signedOut';
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>.');
  return value;
}
