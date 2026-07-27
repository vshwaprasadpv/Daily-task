'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Palette, Key, Mail, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (['SUPER_ADMIN', 'ADMIN'].includes(data.user.role)) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--bg-primary)] overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Login Card Container */}
      <div className="w-full max-w-[420px] p-8 rounded-3xl glass-panel relative z-10 animate-slide-up bg-[rgba(13,13,28,0.75)]">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 mb-4 border border-indigo-500/20">
            <Palette className="w-8 h-8 text-[var(--primary-light)]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Creative Productivity Hub</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 font-medium">Log completed work & track performance metrics</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-200 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Username, Email, or Mobile</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-[var(--text-muted)]" />
              <input 
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Username, email, or phone number"
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-light)] focus:ring-1 focus:ring-[var(--primary-light)] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-[var(--text-muted)]" />
              <input 
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-light)] focus:ring-1 focus:ring-[var(--primary-light)] transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-bold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <div className="spinner"></div> : 'Sign In to Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
