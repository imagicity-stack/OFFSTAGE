'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { adminEmails, firebaseConfigured, isAdminEmail } from '@/lib/config';

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [email, setEmail] = useState(adminEmails.length === 1 ? adminEmails[0] : '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const configError = !firebaseConfigured
    ? 'Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* variables in Vercel.'
    : adminEmails.length === 0
      ? 'No admin login is set. Add NEXT_PUBLIC_ADMIN_EMAILS in Vercel.'
      : '';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!isAdminEmail(email)) return setError('This email is not authorised for Backstage.');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth(), email.trim(), password);
      router.replace(next && next.startsWith('/admin') ? next : '/admin');
    } catch (err) {
      const code = (err as { code?: string }).code || '';
      setError(
        code === 'auth/too-many-requests'
          ? 'Too many attempts. Wait a few minutes and try again.'
          : code === 'auth/network-request-failed'
            ? 'Network error. Check your connection.'
            : 'Wrong email or password.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setError('');
    setInfo('');
    if (!isAdminEmail(email)) return setError('Enter your authorised admin email first.');
    try {
      await sendPasswordResetEmail(auth(), email.trim());
      setInfo(`Password reset link sent to ${email.trim()}.`);
    } catch {
      setError('Could not send the reset email. Try again shortly.');
    }
  }

  return (
    <div className="login">
      <div className="spotlight" aria-hidden="true" />
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo"><img src="/assets/logo.png" alt="Off Stage Productions" /></div>
        <div className="eyebrow">Backstage · Admin</div>
        <h1>Crew only.</h1>
        {configError ? (
          <div className="msg err">{configError}</div>
        ) : (
          <>
            <label className="field">Email
              <input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <label className="field">Password
              <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
            </label>
            {error && <div className="brief-error">{error}</div>}
            {info && <div className="note">{info}</div>}
            <button type="submit" className="brief-submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            <button type="button" className="linkish" onClick={reset}>Forgot password?</button>
          </>
        )}
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
