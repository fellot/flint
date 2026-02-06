'use client';

import { useEffect, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';

export default function PinPage() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string>('/');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('redirect');
      if (r) setRedirectTo(r);
    } catch {}
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Invalid PIN');
      }
      const target = redirectTo || '/';
      const separator = target.includes('?') ? '&' : '?';
      window.location.href = `${target}${separator}welcome=1`;
    } catch (err: any) {
      setError(err?.message || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
            <Lock className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-center text-gray-900 mb-2">Enter PIN</h1>
        <p className="text-sm text-gray-600 text-center mb-4">This site is protected. Please provide the access PIN.</p>
        {error && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 text-center">{error}</div>
        )}
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN code"
            className="w-full input-field"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center justify-center"
          >
            {loading ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />Verifying…</>) : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}

