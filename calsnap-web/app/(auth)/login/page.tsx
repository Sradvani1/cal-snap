'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { SessionErrorBanner } from '@/components/auth/SessionErrorBanner';
import { PrimaryButton, SecondaryButton } from '@/components/design/PrimaryButton';
import { useAuth } from '@/lib/auth/use-auth';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

const inputClassName =
  'rounded-lg border border-cs-border bg-cs-surface px-3 py-2 text-sm text-cs-foreground';

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle, loading, sessionError } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : copy('auth.login.error'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : copy('auth.login.googleError'));
    }
  }

  if (loading) {
    return <p className={`${typography.csCaption} text-center`}>{copy('common.loading')}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className={`${typography.csCardTitle} text-2xl`}>{copy('auth.login.title')}</h1>
        <p className={`${typography.csCaption} mt-1`}>{copy('auth.login.subtitle')}</p>
      </div>

      <SessionErrorBanner message={sessionError} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
          {copy('common.label.email')}
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
          />
        </label>
        <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
          {copy('common.label.password')}
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
          />
        </label>
        {error && <p className="text-sm text-cs-danger">{error}</p>}
        <PrimaryButton type="submit" disabled={submitting} fullWidth className="min-h-11">
          {submitting ? copy('auth.login.submitting') : copy('auth.login.submit')}
        </PrimaryButton>
      </form>

      <div className={`relative text-center ${typography.csCaption}`}>
        <span className="bg-cs-background px-2">{copy('common.divider.or')}</span>
        <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-cs-border" />
      </div>

      <SecondaryButton type="button" onClick={() => void handleGoogle()} fullWidth className="min-h-11">
        {copy('auth.login.google')}
      </SecondaryButton>

      <p className={`${typography.csCaption} text-center`}>
        {copy('auth.login.noAccount')}{' '}
        <Link href="/signup" className="font-medium text-cs-foreground underline">
          {copy('auth.login.signUpLink')}
        </Link>
      </p>
    </div>
  );
}
