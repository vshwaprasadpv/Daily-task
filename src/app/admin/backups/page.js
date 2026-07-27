'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Database, Plus, Download, RotateCcw, Trash2, 
  AlertTriangle, ShieldAlert, CheckCircle, Info, HardDrive, Clock
} from 'lucide-react';

export default function AdminBackups() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals / Alerts
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password verification states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyAction, setVerifyAction] = useState(''); // 'DOWNLOAD' | 'DELETE'
  const [verifyPasswordText, setVerifyPasswordText] = useState('');
  const [restorePasswordText, setRestorePasswordText] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const sessionUser = JSON.parse(storedUser);
    if (!['SUPER_ADMIN', 'ADMIN'].includes(sessionUser.role)) {
      router.push('/');
      return;
    }
    setUser(sessionUser);
    fetchBackups();
  }, [router]);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backups');
      const data = await res.json();
      if (res.ok) {
        setBackups(Array.isArray(data) ? data : []);
      } else {
        if (data.error === 'Unauthorized') {
          localStorage.removeItem('user');
          router.push('/login');
        }
      }
    } catch (err) {
      console.error('Failed to fetch backups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/backups', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Database backup created successfully! 🎉');
        fetchBackups();
      } else {
        setErrorMessage(data.error || 'Failed to create backup');
      }
    } catch (err) {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenVerifyModal = (backup, action) => {
    setSelectedBackup(backup);
    setVerifyAction(action);
    setVerifyPasswordText('');
    setErrorMessage('');
    setSuccessMessage('');
    setShowVerifyModal(true);
  };

  const handleVerifyAction = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setShowVerifyModal(false);

    try {
      if (verifyAction === 'DOWNLOAD') {
        const res = await fetch(`/api/backups/${selectedBackup.filename}`, {
          headers: { 'x-verify-password': verifyPasswordText }
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Download verification failed');
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedBackup.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setSuccessMessage('Download started successfully! 🎉');
      } else if (verifyAction === 'DELETE') {
        if (!confirm(`Are you sure you want to permanently delete this backup: ${selectedBackup.filename}?`)) {
          setActionLoading(false);
          return;
        }
        const res = await fetch(`/api/backups/${selectedBackup.filename}`, {
          method: 'DELETE',
          headers: { 'x-verify-password': verifyPasswordText }
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessMessage('Backup deleted successfully.');
          fetchBackups();
        } else {
          setErrorMessage(data.error || 'Failed to delete backup');
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred during verification.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRestore = (backup) => {
    setSelectedBackup(backup);
    setConfirmText('');
    setRestorePasswordText('');
    setErrorMessage('');
    setSuccessMessage('');
    setShowRestoreModal(true);
  };

  const handleRestore = async (e) => {
    e.preventDefault();
    if (confirmText !== 'RESTORE') {
      setErrorMessage('Please type "RESTORE" to confirm.');
      return;
    }
    if (!restorePasswordText) {
      setErrorMessage('Password is required.');
      return;
    }

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setShowRestoreModal(false);

    try {
      const res = await fetch(`/api/backups/${selectedBackup.filename}/restore`, {
        method: 'POST',
        headers: { 'x-verify-password': restorePasswordText }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Database restored successfully! Re-routing to Dashboard...');
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        setErrorMessage(data.error || 'Restore failed');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred during database restoration.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper formats
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Metrics
  const totalBackups = backups.length;
  const totalSize = backups.reduce((acc, b) => acc + b.size, 0);
  const lastBackupDate = backups.length > 0 ? new Date(backups[0].createdAt).toLocaleDateString('en-IN') : 'Never';

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-[var(--primary)]" />
              Database Backups & Restore
            </h1>
            <p className="text-[var(--text-muted)] mt-1">Take backups, restore platform state, or download data archives.</p>
          </div>
          <button 
            onClick={handleCreateBackup}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_0_15px_rgba(108,92,231,0.4)]"
          >
            <Plus className="w-4 h-4" />
            Create New Backup
          </button>
        </header>

        {/* Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-300 text-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-300 text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-panel p-5 rounded-xl border border-[var(--glass-border)] flex items-center gap-4">
            <div className="p-3.5 rounded-lg bg-[rgba(108,92,231,0.1)] text-[var(--primary-light)]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total Backups</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalBackups}</h3>
            </div>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-[var(--glass-border)] flex items-center gap-4">
            <div className="p-3.5 rounded-lg bg-[rgba(6,182,212,0.1)] text-[var(--accent)]">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Storage Space Used</p>
              <h3 className="text-2xl font-bold text-white mt-1">{formatBytes(totalSize)}</h3>
            </div>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-[var(--glass-border)] flex items-center gap-4">
            <div className="p-3.5 rounded-lg bg-[rgba(245,158,11,0.1)] text-[var(--warning)]">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Last Backup Created</p>
              <h3 className="text-2xl font-bold text-white mt-1">{lastBackupDate}</h3>
            </div>
          </div>
        </div>

        {/* Warning Information Banner */}
        <div className="flex items-center gap-3 bg-[rgba(245,158,11,0.05)] border border-[var(--warning)]/20 p-4 rounded-xl text-xs text-[var(--text-secondary)] mb-8">
          <Info className="w-5 h-5 text-[var(--warning)] flex-shrink-0" />
          <p>Database backups store structural tables and operational records (Users, OKRs, work logs, clients, etc.). Keep routine backups before updating users or running batch imports. Database restoration overwrites active operational databases immediately.</p>
        </div>

        {/* Backups Table */}
        <div className="glass-panel rounded-xl border border-[var(--glass-border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--glass-border)]">
            <h2 className="font-bold text-white">Backup Archives</h2>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.02)]">
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">File Name</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date Created</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Size</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-[var(--text-muted)]">
                    Loading backup directories...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-[var(--text-muted)]">
                    No database backups found. Click "Create New Backup" above to make your first archive.
                  </td>
                </tr>
              ) : backups.map(b => (
                <tr key={b.id} className="hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                  <td className="p-4 font-mono text-sm text-[var(--primary-light)]">{b.filename}</td>
                  <td className="p-4 text-sm text-[var(--text-muted)]">
                    {new Date(b.createdAt).toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-sm text-[var(--text-muted)]">{formatBytes(b.size)}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleOpenVerifyModal(b, 'DOWNLOAD')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-xs text-white transition-colors cursor-pointer"
                        title="Download Backup"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                      <button 
                        onClick={() => handleOpenRestore(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-xs text-yellow-400 transition-colors cursor-pointer"
                        title="Restore Database"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </button>
                      <button 
                        onClick={() => handleOpenVerifyModal(b, 'DELETE')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs text-red-400 transition-colors cursor-pointer"
                        title="Delete Backup"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Restore Database Warnings Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#11111a] border border-[var(--glass-border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[var(--glass-border)] bg-yellow-500/5">
              <h2 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                DANGER: Database Overwrite
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1.5">You are about to overwrite the active database with an archived snapshot.</p>
            </div>
            
            <form onSubmit={handleRestore} className="p-6">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-200/90 leading-relaxed mb-5">
                <strong className="block text-sm font-semibold mb-1">Confirm Restoration</strong>
                Restoring database from <strong>{selectedBackup?.filename}</strong> will overwrite current users, creative work logs, and permissions. Any logs input after this backup date will be permanently deleted.
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Your Login Password:
                  </label>
                  <input 
                    type="password"
                    required
                    value={restorePasswordText}
                    onChange={e => setRestorePasswordText(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    placeholder="Enter password..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Type "RESTORE" to confirm:
                  </label>
                  <input 
                    type="text"
                    required
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition-colors uppercase"
                    placeholder="RESTORE"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowRestoreModal(false)}
                  className="px-4 py-2 rounded-lg font-medium text-sm text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={confirmText !== 'RESTORE' || !restorePasswordText || actionLoading}
                  className="px-5 py-2 rounded-lg font-medium text-sm bg-yellow-500 text-black hover:bg-yellow-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Execute Restore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Modal for Download/Delete */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#11111a] border border-[var(--glass-border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[var(--glass-border)]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--primary)]" />
                Security Verification
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1.5">Please confirm your identity before proceeding with {verifyAction.toLowerCase()}.</p>
            </div>
            
            <form onSubmit={handleVerifyAction} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Your Login Password:
                  </label>
                  <input 
                    type="password"
                    required
                    value={verifyPasswordText}
                    onChange={e => setVerifyPasswordText(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
                    placeholder="Enter password..."
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 rounded-lg font-medium text-sm text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!verifyPasswordText || actionLoading}
                  className="px-5 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white hover:opacity-90 transition-opacity disabled:opacity-30"
                >
                  Confirm Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
