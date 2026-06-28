'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { SessionErrorBanner } from '@/components/auth/SessionErrorBanner';
import { useAuth } from '@/lib/auth/use-auth';

export default function SignupPage() {
  const { signUpWithEmail, signInWithGoogle, loading, sessionError } = useAuth();
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
      await signUpWithEmail(email, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign up failed');
    }
  }

  if (loading) {
    return <p className="text-center text-neutral-600">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Create account</h1>
        <p className="mt-1 text-sm text-neutral-600">Start your CalSnap journey</p>
      </div>

      <SessionErrorBanner message={sessionError} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Password</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <div className="relative text-center text-sm text-neutral-500">
        <span className="bg-white px-2">or</span>
        <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-neutral-200" />
      </div>

      <button
        type="button"
        onClick={() => void handleGoogle()}
        className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-900"
      >
        Continue with Google
      </button>

      <p className="text-center text-sm text-neutral-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-neutral-900 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
