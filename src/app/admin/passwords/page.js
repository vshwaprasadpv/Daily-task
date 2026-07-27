'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Lock, Plus, Edit2, Trash2, Shield, Eye, Copy, 
  ExternalLink, Key, Search, FileText, CheckCircle, Clock 
} from 'lucide-react';

export default function AdminPasswordManager() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [platformName, setPlatformName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // Only used when creating or overriding
  const [category, setCategory] = useState('Design Tools');
  const [notes, setNotes] = useState('');
  
  // Access Control State
  const [selectedRoles, setSelectedRoles] = useState([]);
  
  const [submitting, setSubmitting] = useState(false);

  const availableRoles = [
    'SUPER_ADMIN',
    'ADMIN',
    'TEAM_LEAD',
    'GRAPHIC_DESIGNER',
    'UI_UX_DESIGNER',
    'VIDEO_EDITOR',
    'CONTENT_WRITER',
    'MARKETING_EXECUTIVE'
  ];

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
      console.error('Failed to fetch passwords:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pwd = null) => {
    if (pwd) {
      setEditingId(pwd.id);
      setPlatformName(pwd.platformName);
      setWebsiteUrl(pwd.websiteUrl || '');
      setUsername(pwd.username);
      setPassword(''); // Don't fetch plain text password for edit, only allow override
      setCategory(pwd.category);
      setNotes(pwd.notes || '');
      setSelectedRoles(pwd.roleAccess ? pwd.roleAccess.map(r => r.role) : []);
    } else {
      setEditingId(null);
      setPlatformName('');
      setWebsiteUrl('');
      setUsername('');
      setPassword('');
      setCategory('Design Tools');
      setNotes('');
      setSelectedRoles([]);
    }
    setShowModal(true);
  };

  const toggleRole = (role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      platformName,
      websiteUrl,
      username,
      category,
      notes,
      roles: selectedRoles,
      status: 'ACTIVE'
    };

    if (password) {
      payload.password = password; // Only send if updating/creating
    }

    try {
      const url = editingId ? `/api/passwords/${editingId}` : '/api/passwords';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        fetchPasswords();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save password');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete these credentials? This action is irreversible.')) return;
    try {
      const res = await fetch(`/api/passwords/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPasswords();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-[var(--primary)]" />
              Password Manager Admin
            </h1>
            <p className="text-[var(--text-muted)] mt-1">Manage and assign shared company credentials securely.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(108,92,231,0.4)]"
          >
            <Plus className="w-4 h-4" />
            Add Password
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel p-5 rounded-xl border border-[var(--glass-border)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[rgba(108,92,231,0.1)] text-[var(--primary-light)]">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total Passwords</h3>
            </div>
            <p className="text-2xl font-bold text-white">{passwords.length}</p>
          </div>
          
          <div className="glass-panel p-5 rounded-xl border border-[var(--glass-border)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[rgba(0,184,148,0.1)] text-[#00b894]">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Active Shares</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {passwords.reduce((acc, p) => acc + (p.roleAccess?.length || 0), 0)}
            </p>
          </div>
        </div>

        {/* Passwords Table */}
        <div className="glass-panel rounded-xl border border-[var(--glass-border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
            <h2 className="font-bold text-white">Managed Credentials</h2>
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search platforms..."
                className="pl-9 pr-4 py-1.5 bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-md text-sm text-white focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.02)]">
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Platform & URL</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Username</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Category</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Access Roles</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {passwords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-[var(--text-muted)]">
                    No passwords added yet. Click "Add Password" to begin.
                  </td>
                </tr>
              ) : passwords.map(pwd => (
                <tr key={pwd.id} className="hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-white">{pwd.platformName}</div>
                    {pwd.websiteUrl && (
                      <a href={pwd.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--primary-light)] hover:underline flex items-center gap-1 mt-1">
                        {pwd.websiteUrl} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                  <td className="p-4 text-sm text-[var(--text-muted)]">{pwd.username}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-[rgba(255,255,255,0.05)] rounded text-xs text-[var(--text-muted)]">
                      {pwd.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {pwd.roleAccess?.map((r, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-[rgba(108,92,231,0.15)] text-[var(--primary-light)] rounded text-[10px] font-medium border border-[var(--primary)]/30">
                          {r.role.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {(!pwd.roleAccess || pwd.roleAccess.length === 0) && (
                        <span className="text-xs text-[var(--text-muted)] italic">No roles assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(pwd)}
                        className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.1)] text-[var(--text-muted)] hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {user.role === 'SUPER_ADMIN' && (
                        <button 
                          onClick={() => handleDelete(pwd.id)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#11111a] border border-[var(--glass-border)] rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {editingId ? <Edit2 className="w-5 h-5 text-[var(--primary)]" /> : <Plus className="w-5 h-5 text-[var(--primary)]" />}
                {editingId ? 'Edit Credentials' : 'Add New Credentials'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-white">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Platform Name *</label>
                  <input 
                    type="text" required value={platformName} onChange={e => setPlatformName(e.target.value)}
                    placeholder="e.g. Canva Pro"
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-lg px-4 py-2.5 text-white focus:border-[var(--primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Website URL</label>
                  <input 
                    type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://canva.com"
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-lg px-4 py-2.5 text-white focus:border-[var(--primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Username / Email *</label>
                  <input 
                    type="text" required value={username} onChange={e => setUsername(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-lg px-4 py-2.5 text-white focus:border-[var(--primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Password {editingId && <span className="text-yellow-500 lowercase">(Leave blank to keep current)</span>} *
                  </label>
                  <input 
                    type="password" required={!editingId} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-lg px-4 py-2.5 text-white focus:border-[var(--primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Category</label>
                  <select 
                    value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-lg px-4 py-2.5 text-white focus:border-[var(--primary)] outline-none"
                  >
                    <option value="Design Tools">Design Tools</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Hosting">Hosting</option>
                    <option value="Development">Development</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* RBAC */}
              <div className="border-t border-[var(--glass-border)] pt-6">
                <h3 className="text-sm font-semibold text-white mb-4">Role-Based Access (RBAC)</h3>
                <p className="text-xs text-[var(--text-muted)] mb-3">Select which employee roles should have access to these credentials.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableRoles.map(role => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-[rgba(255,255,255,0.05)] border border-transparent hover:border-[var(--glass-border)] transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedRoles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="rounded border-[var(--glass-border)] bg-[rgba(255,255,255,0.1)] text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                      <span className="text-sm text-[var(--text-muted)]">{role.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-[var(--glass-border)] pt-6 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-lg font-medium text-sm text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg font-medium text-sm bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
                >
                  {submitting ? 'Saving...' : 'Save Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
