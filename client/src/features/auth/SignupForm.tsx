// "Sign up" form: username, email, and password, with the same rules the server enforces.
import { useState, type FormEvent } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from './FormError';
import { useAuth } from './useAuth';

type Fields = { username: string; email: string; password: string };
type FieldErrors = Partial<Record<keyof Fields, string>>;

// Mirrors the server rules so most mistakes show up before a request is sent.
function validate(values: Fields): FieldErrors {
  const errors: FieldErrors = {};
  const username = values.username.trim();
  if (username.length < 3) errors.username = 'Usernames need at least 3 characters.';
  else if (username.length > 30) errors.username = 'Usernames can be at most 30 characters.';
  else if (!/^[A-Za-z0-9_]+$/.test(username)) {
    errors.username = 'Use only letters, numbers, and underscores.';
  }
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (values.password.length < 8) errors.password = 'Passwords need at least 8 characters.';
  return errors;
}

export function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const { register } = useAuth();
  const [values, setValues] = useState<Fields>({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update(field: keyof Fields, value: string) {
    setValues({ ...values, [field]: value });
    setErrors({ ...errors, [field]: undefined });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    const found = validate(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setPending(true);
    try {
      await register(values.username.trim(), values.email.trim(), values.password);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields as FieldErrors);
      else setFormError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setPending(false);
    }
  }

  const field = (
    name: keyof Fields,
    label: string,
    type: string,
    autoComplete: string,
    hint?: string,
  ) => (
    <div className="grid gap-1.5">
      <Label htmlFor={`signup-${name}`}>{label}</Label>
      <Input
        id={`signup-${name}`}
        type={type}
        autoComplete={autoComplete}
        value={values[name]}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={`signup-${name}-help`}
        onChange={(event) => update(name, event.target.value)}
      />
      <p
        id={`signup-${name}-help`}
        className={errors[name] ? 'text-[13px] text-accent2-deep' : 'text-[12px] text-ink/65'}
      >
        {errors[name] ?? hint}
      </p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {field('username', 'Username', 'text', 'username', 'Letters, numbers, and underscores.')}
      {field('email', 'Email', 'email', 'email')}
      {field('password', 'Password', 'password', 'new-password', 'At least 8 characters.')}
      {formError && <FormError message={formError} />}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending && <CircleNotch size={16} className="animate-spin" aria-hidden="true" />}
        Create account
      </Button>
    </form>
  );
}
