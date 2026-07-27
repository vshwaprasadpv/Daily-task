'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Lock, Eye, Copy, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

export default function PasswordVault() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedPasswordId, setSelectedPasswordId] = useState(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  // Track revealed passwords locally: { [id]: 'decrypted_string' }
  const [revealedPasswords, setRevealedPasswords] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchPasswords();
  }, [router]);

  const fetchPasswords = async () => {
    try {
      const res = await fetch('/api/passwords');
      if (res.ok) {
        const data = await res.json();
        setPasswords(data);
      }
    } catch (err) {
      console.error('Failed to load passwords:', err);
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (id, action) => {
    try {
      await fetch(`/api/passwords/${id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
    } catch (err) {
      console.error('Failed to log action:', err);
    }
  };

  const handleCopyUsername = (pwd) => {
    navigator.clipboard.writeText(pwd.username);
    logAction(pwd.id, 'COPY_USERNAME');
    // Optional: show toast
  };

  const handleOpenWebsite = (pwd) => {
    if (pwd.websiteUrl) {
      window.open(pwd.websiteUrl, '_blank');
      logAction(pwd.id, 'OPEN_WEBSITE');
    }
  };

  const handleRevealClick = (pwd) => {
    if (revealedPasswords[pwd.id]) {
      // Already revealed, just hide it
      setRevealedPasswords(prev => {
        const next = { ...prev };
        delete next[pwd.id];
        return next;
      });
    } else {
      // Need verification
      setSelectedPasswordId(pwd.id);
      setVerifyError('');
      setLoginPassword('');
      setVerifyModalOpen(true);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError('');
    try {
      const res = await fetch(`/api/passwords/${selectedPasswordId}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginPassword })
      });
      const data = await res.json();
      
      if (res.ok && data.password) {
        setRevealedPasswords(prev => ({
          ...prev,
          [selectedPasswordId]: data.password
        }));
        setVerifyModalOpen(false);
      } else {
        setVerifyError(data.error || 'Verification failed');
      }
    } catch (err) {
      setVerifyError('An error occurred. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyPassword = (pwd) => {
    const revealed = revealedPasswords[pwd.id];
    if (revealed) {
      navigator.clipboard.writeText(revealed);
      logAction(pwd.id, 'COPY_PASSWORD');
    } else {
      // Prompt verification first
      handleRevealClick(pwd);
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-[var(--primary)]" />
            Password Vault
          </h1>
          <p className="text-[var(--text-muted)] mt-1">Securely access shared company credentials.</p>
        </header>

        {loading ? (
          <div className="text-[var(--text-muted)]">Loading vault...</div>
        ) : passwords.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-xl border border-[var(--glass-border)]">
            <ShieldCheck className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-white mb-2">No Passwords Assigned</h3>
            <p className="text-[var(--text-muted)]">You currently do not have access to any shared credentials.</p>
          </div>
        ) : (
          <div className="glass-panel rounded-xl border border-[var(--glass-border)] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--glass-border)] bg-[rgba(255,255,255,0.02)]">
                  <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Platform</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Category</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Username</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Password</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {passwords.map(pwd => (
                  <tr key={pwd.id} className="hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">{pwd.platformName}</div>
                      {pwd.client && <div className="text-xs text-[var(--primary-light)] mt-1">{pwd.client.name}</div>}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-[rgba(255,255,255,0.05)] rounded text-xs text-[var(--text-muted)]">
                        {pwd.category}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-muted)]">
                      <div className="flex items-center gap-2">
                        {pwd.username}
                        <button onClick={() => handleCopyUsername(pwd)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[var(--text-muted)] tracking-widest">
                          {revealedPasswords[pwd.id] || '••••••••••••'}
                        </span>
                        <button onClick={() => handleRevealClick(pwd)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" title={revealedPasswords[pwd.id] ? "Hide" : "Show"}>
                          <Eye className="w-4 h-4" />
                        </button>
                        {revealedPasswords[pwd.id] && (
                          <button onClick={() => handleCopyPassword(pwd)} className="text-[var(--text-muted)] hover:text-white transition-colors" title="Copy Password">
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {pwd.websiteUrl && (
                        <button 
                          onClick={() => handleOpenWebsite(pwd)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-xs text-white transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Launch
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Verification Modal */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#11111a] border border-[var(--glass-border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[var(--glass-border)]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--primary)]" />
                Security Verification
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">Please re-enter your login password to reveal these credentials.</p>
            </div>
            <form onSubmit={handleVerify} className="p-6">
              {verifyError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {verifyError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Your Login Password</label>
                  <input 
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
                    placeholder="Enter password..."
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setVerifyModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium text-sm text-[var(--text-muted)] hover:text-white transition-colors"
                  disabled={verifying}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={verifying || !loginPassword}
                  className="px-5 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {verifying ? 'Verifying...' : 'Reveal Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
