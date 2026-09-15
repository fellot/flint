'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import FlintMark from './FlintMark';

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
  const title = login ? 'Your cellar awaits.' : reset ? 'Set your password' : 'Reset your password';

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
    <main className="auth-layout">
      <div className="auth-photograph">
        <img src="/images/flint-still-life.png" alt="A quiet afternoon, a good bottle, and a glass of red wine" width={1536} height={1024} fetchPriority="high" />
        <a href="/" className="flint-brand auth-brand" aria-label="Flint Cellar"><FlintMark /><span>flint<span className="brand-period">.</span><small>THE PERSONAL CELLAR</small></span></a>
        <div className="auth-quote"><h2>Good bottles.<br /><em>Even better stories.</em></h2><p>COLLECT MOMENTS. SAVOR STORIES.</p></div>
      </div>
      <div className="auth-panel"><div className="auth-form">
        <p className="eyebrow"><span />A LITTLE SPACE FOR YOUR GOOD TASTE</p>
        <h1 className="auth-title">{title}</h1>
        <p className="auth-description">{login ? 'Welcome back. A world of discoveries is waiting in your collection.' : reset ? 'Choose a password with at least 8 characters.' : 'We’ll email you a link to choose a new password.'}</p>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
        <form onSubmit={submit} className="space-y-4">
          {!reset && <div><label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-field w-full" /></div>}
          {(login || reset) && <div><label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">{reset ? 'New password' : 'Password'}</label><input id="password" type="password" autoComplete={reset ? 'new-password' : 'current-password'} minLength={reset ? 8 : undefined} required value={password} onChange={e => setPassword(e.target.value)} className="input-field w-full" /></div>}
          {reset && <div><label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-gray-700">Confirm password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field w-full" /></div>}
          <button disabled={pending} className="flint-button" type="submit">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{pending ? 'Please wait…' : login ? 'Sign in' : reset ? 'Save password' : 'Send reset link'}</button>
        </form>
        <div className="auth-reset-link"><Link href={login ? '/forgot-password' : '/login'} className="hover:underline">{login ? 'Forgot your password?' : 'Back to sign in'}</Link></div>
        {login && <p className="auth-access-note">Need access? Ask your cellar owner to create an account for you.</p>}
      </div><p className="auth-signature">One glass at a time.</p></div>
    </main>
  );
}
