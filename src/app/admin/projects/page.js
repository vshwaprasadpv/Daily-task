'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { FolderPlus, FolderOpen, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';

export default function AdminProjects() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [clientName, setClientName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [editingClientId, setEditingClientId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [selectedClient, setSelectedClient] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

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
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!clientName.trim()) return;

    const url = editingClientId ? `/api/clients/${editingClientId}` : '/api/clients';
    const method = editingClientId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clientName, logoUrl })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save client');
      }

      setFormSuccess(editingClientId ? `Client settings updated successfully!` : `Client "${clientName}" added successfully!`);
      setClientName('');
      setLogoUrl('');
      setEditingClientId('');
      fetchClients();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleStartEdit = (client) => {
    setEditingClientId(client.id);
    setClientName(client.name);
    setLogoUrl(client.logoUrl || '');
    setFormError('');
    setFormSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingClientId('');
    setClientName('');
    setLogoUrl('');
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setFormError('');
    setFormSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Upload failed');
      }
      const data = await res.json();
      setLogoUrl(data.url);
      setFormSuccess('Logo uploaded successfully!');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!projectName.trim() || !selectedClient) {
      setFormError('Please select client and provide project name');
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, clientId: selectedClient })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add project');
      }

      setFormSuccess(`Project "${projectName}" created successfully!`);
      setProjectName('');
      fetchClients();
    } catch (err) {
      setFormError(err.message);
    }
  };
  const handleDeleteClient = async (id, name) => {
    if (!confirm(`Are you sure you want to remove client "${name}"? This will delete all associated projects and work logs.`)) return;

    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete client');
      }

      setFormSuccess(`Client "${name}" deleted successfully!`);
      fetchClients();
    } catch (err) {
      setFormError(err.message);
    }
  };
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[var(--glass-border)] bg-[rgba(7,7,15,0.8)] backdrop-blur-md px-8 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white">Clients & Projects Setup</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Configure active clients and associate projects for work logging</p>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 space-y-8 flex-1">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}
          {formSuccess && (
            <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create / Edit Client Panel */}
            <div className="p-6 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] space-y-6">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[var(--primary-light)]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  {editingClientId ? 'Edit Client Settings' : 'Register New Client'}
                </h3>
              </div>

              <form onSubmit={handleSaveClient} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Client / Organization Name *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Starbucks Global"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Client Logo Image *</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="text-xs text-[var(--text-muted)] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--primary)] file:text-white hover:file:opacity-90 cursor-pointer"
                    />
                    {uploading && <div className="spinner w-4 h-4"></div>}
                  </div>
                  {logoUrl && (
                    <div className="mt-2 flex items-center gap-2 bg-[rgba(255,255,255,0.02)] p-2 rounded-xl border border-[var(--glass-border)] w-fit">
                      <img src={logoUrl} alt="Logo Preview" className="w-10 h-10 object-contain bg-white/10 p-0.5 rounded-lg border border-white/10" />
                      <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[150px]">{logoUrl}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button 
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    {editingClientId ? 'Save Client Settings' : 'Register Client'}
                  </button>
                  {editingClientId && (
                    <button 
                      type="button"
                      onClick={handleCancelEdit}
                      className="bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[var(--glass-border)] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Create Project Panel */}
            <div className="p-6 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] space-y-6">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Create Client Project</h3>
              </div>

              <form onSubmit={handleAddProject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Client Association *</label>
                  <select 
                    required
                    value={selectedClient}
                    onChange={e => setSelectedClient(e.target.value)}
                    className="w-full bg-[#111127] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  >
                    <option value="">Select Target Client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Project / Campaign Title *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Christmas Promotion Reels"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                >
                  Create Project
                </button>
              </form>
            </div>
          </div>

          {/* Client Project Directory List */}
          <div className="p-6 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] space-y-6">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[var(--success)]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Directory Directory List</h3>
            </div>

            {loading ? (
              <div className="spinner"></div>
            ) : clients.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">No clients registered yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {clients.map(client => (
                  <div key={client.id} className="p-4 rounded-xl bg-[rgba(255,255,255,0.015)] border border-[var(--glass-border)] space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {client.logoUrl ? (
                          <img 
                            src={client.logoUrl} 
                            alt={client.name} 
                            className="w-7 h-7 rounded-lg object-contain bg-white/10 p-0.5 border border-white/10"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-[var(--primary)] flex items-center justify-center text-[10px] font-black text-white">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <h4 className="font-extrabold text-xs text-white">{client.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleStartEdit(client)}
                          className="bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[var(--glass-border)] text-white text-[10px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteClient(client.id, client.name)}
                          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 p-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5 pl-3 border-l border-[var(--glass-border)]">
                      {client.projects.length === 0 ? (
                        <p className="text-[10px] text-[var(--text-muted)]">No projects created under this client.</p>
                      ) : (
                        client.projects.map(p => (
                          <div key={p.id} className="text-xs text-[var(--text-secondary)] font-medium">• {p.name}</div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
