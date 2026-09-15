'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Lock, Wine } from 'lucide-react';

type Mode = 'login' | 'forgot-password' | 'reset-password';
export default function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const login = mode === 'login';
  const reset = mode === 'reset-password';
  const title = login ? 'Welcome to Flint' : reset ? 'Set your password' : 'Reset your password';

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'invalid_link') {
      setError('This link is invalid or has expired. Request a new password reset link.');
    }
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (reset && password !== confirmPassword) { setError('Your passwords do not match.'); return; }
    setPending(true);
    try {
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, redirect }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to complete your request.');
      if (login) {
        const target = new URL(result.redirect || '/', window.location.origin);
        target.searchParams.set('welcome', '1');
        window.location.assign(target.pathname + target.search + target.hash);
      } else if (reset) {
        window.location.assign('/');
      } else setMessage(result.message);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to connect. Please try again.');
    } finally { setPending(false); }
  }

  return (
    <main className="min-h-screen bg-red-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50"><Wine className="h-7 w-7 text-red-700" /></div>
        <h1 className="text-center text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-2 mb-6 text-center text-sm text-gray-600">{login ? 'Sign in to your wine cellar.' : reset ? 'Choose a password with at least 8 characters.' : 'We’ll email you a link to choose a new password.'}</p>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
        <form onSubmit={submit} className="space-y-4">
          {!reset && <div><label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-field w-full" /></div>}
          {(login || reset) && <div><label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">{reset ? 'New password' : 'Password'}</label><input id="password" type="password" autoComplete={reset ? 'new-password' : 'current-password'} minLength={reset ? 8 : undefined} required value={password} onChange={e => setPassword(e.target.value)} className="input-field w-full" /></div>}
          {reset && <div><label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-gray-700">Confirm password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field w-full" /></div>}
          <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 font-medium text-white hover:bg-red-800 disabled:opacity-60" type="submit">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}{pending ? 'Please wait…' : login ? 'Sign in' : reset ? 'Save password' : 'Send reset link'}</button>
        </form>
        <div className="mt-5 text-center text-sm"><Link href={login ? '/forgot-password' : '/login'} className="text-red-700 hover:underline">{login ? 'Forgot your password?' : 'Back to sign in'}</Link></div>
        {login && <p className="mt-6 text-center text-xs text-gray-500">Need access? Ask your cellar owner to create an account for you.</p>}
      </div>
    </main>
  );
}
