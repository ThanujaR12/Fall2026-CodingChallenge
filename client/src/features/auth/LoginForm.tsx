// "Log in" form: username or email plus password, with one generic error for bad credentials.
import { useState, type FormEvent } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from './FormError';
import { useAuth } from './useAuth';

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!usernameOrEmail.trim() || !password) {
      setError('Enter your username or email and your password.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      await login(usernameOrEmail.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <div className="grid gap-1.5">
        <Label htmlFor="login-identifier">Username or email</Label>
        <Input
          id="login-identifier"
          autoComplete="username"
          autoFocus
          value={usernameOrEmail}
          onChange={(event) => setUsernameOrEmail(event.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error && <FormError message={error} />}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending && <CircleNotch size={16} className="animate-spin" aria-hidden="true" />}
        Log in
      </Button>
    </form>
  );
}
