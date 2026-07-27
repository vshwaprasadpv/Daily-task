'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Target, 
  Plus, 
  Trash2, 
  Edit, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Calendar,
  Users,
  Award,
  RotateCcw
} from 'lucide-react';

export default function AdminOkrs() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [okrs, setOkrs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [okrId, setOkrId] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [objective, setObjective] = useState('');
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [targetPeriod, setTargetPeriod] = useState('Q1');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));
  
  // Key Results State inside form
  const [keyResults, setKeyResults] = useState([{ title: '', target: 10, unit: 'assets' }]);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchData = async () => {
    try {
      const oRes = await fetch('/api/okrs');
      const oData = await oRes.json();
      if (oRes.status === 401 || oData.error === 'Unauthorized') {
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      setOkrs(Array.isArray(oData) ? oData : []);

      const uRes = await fetch('/api/users');
      const uData = await uRes.json();
      setUsers(Array.isArray(uData) ? uData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setOkrId('');
    setSelectedUser('');
    setObjective('');
    setTargetYear(new Date().getFullYear());
    setTargetPeriod('Q1');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));
    setKeyResults([{ title: '', target: 10, unit: 'assets' }]);
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleOpenEdit = (okr) => {
    setOkrId(okr.id);
    setSelectedUser(okr.userId);
    setObjective(okr.objective);
    setTargetYear(okr.targetYear);
    setTargetPeriod(okr.targetPeriod);
    setStartDate(okr.startDate ? okr.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setEndDate(okr.endDate ? okr.endDate.slice(0, 10) : new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));
    setKeyResults(okr.keyResults.map(kr => ({ title: kr.title, target: kr.target, unit: kr.unit, current: kr.current })));
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleAddKRField = () => {
    setKeyResults([...keyResults, { title: '', target: 10, unit: 'assets' }]);
  };

  const handleRemoveKRField = (index) => {
    setKeyResults(keyResults.filter((_, i) => i !== index));
  };

  const handleKRChange = (index, field, value) => {
    const updated = [...keyResults];
    updated[index][field] = value;
    setKeyResults(updated);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider text-gray-400 bg-gray-500/10 border-gray-500/20">Pending</span>;
      case 'IN_PROGRESS':
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider text-amber-400 bg-amber-500/10 border-amber-500/20">In Progress</span>;
      case 'COMPLETED':
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider text-green-400 bg-green-500/10 border-green-500/20">Completed</span>;
      default:
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider text-blue-400 bg-blue-500/10 border-blue-500/20">{status}</span>;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedUser || !objective.trim()) {
      setFormError('Please select employee and provide objective');
      return;
    }

    const emptyKR = keyResults.some(kr => !kr.title.trim() || !kr.target);
    if (emptyKR) {
      setFormError('Please fill out all key results fields');
      return;
    }

    const url = okrId ? `/api/okrs/${okrId}` : '/api/okrs';
    const method = okrId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          objective,
          targetYear,
          targetPeriod,
          startDate,
          endDate,
          keyResults
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save OKR');
      }

      setFormSuccess(okrId ? 'OKR saved successfully!' : 'OKR created and assigned successfully!');
      setTimeout(() => {
        setShowModal(false);
        fetchData();
      }, 1000);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this OKR? It will delete all linked key results.')) return;

    try {
      const res = await fetch(`/api/okrs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRestart = async (okrId) => {
    if (!confirm('Are you sure you want to restart this OKR? This will set its status back to PENDING.')) return;
    try {
      const res = await fetch(`/api/okrs/${okrId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PENDING' })
      });
      if (res.ok) {
        setOkrs(okrs.map(o => o.id === okrId ? { ...o, status: 'PENDING' } : o));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to restart OKR');
      }
    } catch (err) {
      alert('Error restarting OKR');
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
            <h2 className="text-sm font-extrabold text-white">Objective & Key Results (OKR) Management</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Configure targets, assign to designers/editors, and track actual values</p>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-bold py-2.5 px-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create OKR</span>
          </button>
        </header>

        {/* Content */}
        <div className="p-8 space-y-8 flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {/* Performance Comparison Overview */}
              <div className="p-6 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)]">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="w-5 h-5 text-[var(--accent)]" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Target OKR Performance Ledger</h3>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[var(--glass-border)]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[rgba(0,0,0,0.3)]">
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Employee</th>
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Objective</th>
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Period</th>
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Due Date</th>
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Performance Progress</th>
                        <th className="p-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                      {okrs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-[var(--text-muted)]">No OKRs created yet. Click "Create OKR" above to assign your first strategic target.</td>
                        </tr>
                      ) : (
                        okrs.map(okr => (
                          <tr key={okr.id} className="hover:bg-[rgba(255,255,255,0.015)] transition-all">
                            <td className="p-4 font-bold text-white">{okr.user.name}</td>
                            <td className="p-4 max-w-[280px]">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusBadge(okr.status)}
                              </div>
                              <p className="font-semibold text-white truncate">{okr.objective}</p>
                              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{okr.keyResults.length} key results tracked</p>
                            </td>
                            <td className="p-4 uppercase font-bold text-[var(--text-secondary)]">{okr.targetPeriod} ({okr.targetYear})</td>
                            <td className="p-4 font-medium">{okr.endDate ? new Date(okr.endDate).toLocaleDateString('en-IN') : '—'}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-[rgba(255,255,255,0.04)] h-2 rounded-full overflow-hidden min-w-[80px]">
                                  <div 
                                    className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] h-full transition-all duration-300"
                                    style={{ width: `${okr.progress}%` }}
                                  ></div>
                                </div>
                                <span className="font-bold text-white">{okr.progress}%</span>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {okr.status !== 'PENDING' && (
                                  <button 
                                    onClick={() => handleRestart(okr.id)}
                                    className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                                    title="Restart OKR (Revert to Pending)"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleOpenEdit(okr)}
                                  className="bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[var(--glass-border)] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDelete(okr.id)}
                                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 p-1.5 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-[600px] p-6 rounded-2xl glass-panel bg-[#12122a] border-[var(--glass-border)] animate-slide-up relative my-8">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6">
              {okrId ? 'Edit Assigned OKR' : 'Create & Assign OKR'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-[10px] font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-200 text-[10px] font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Assign to Employee *</label>
                  <select 
                    required
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                    disabled={okrId !== ''}
                    className="w-full bg-[#111127] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  >
                    <option value="">Select Employee</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Target Period *</label>
                  <select 
                    required
                    value={targetPeriod}
                    onChange={e => setTargetPeriod(e.target.value)}
                    className="w-full bg-[#111127] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                  >
                    <option value="Q1">Q1 (Jan-Mar)</option>
                    <option value="Q2">Q2 (Apr-Jun)</option>
                    <option value="Q3">Q3 (Jul-Sep)</option>
                    <option value="Q4">Q4 (Oct-Dec)</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Target Year</label>
                  <input 
                    type="number"
                    required
                    value={targetYear}
                    onChange={e => setTargetYear(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Start Date</label>
                  <input 
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">End Date</label>
                  <input 
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Objective Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Optimize turnaround speed and boost design output"
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                />
              </div>

              {/* Key Results creation list */}
              <div className="space-y-3 pt-3 border-t border-[var(--glass-border)]">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Key Results metrics</h4>
                  <button 
                    type="button"
                    onClick={handleAddKRField}
                    className="bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[var(--glass-border)] text-white text-[10px] font-semibold py-1 px-2.5 rounded-lg transition-all cursor-pointer"
                  >
                    + Add Metric
                  </button>
                </div>

                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                  {keyResults.map((kr, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Complete 40 carousel posts"
                        value={kr.title}
                        onChange={e => handleKRChange(idx, 'title', e.target.value)}
                        className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                      />
                      <input 
                        type="number"
                        required
                        min="1"
                        placeholder="Target"
                        value={kr.target}
                        onChange={e => handleKRChange(idx, 'target', e.target.value)}
                        className="w-20 bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none text-center"
                      />
                      <input 
                        type="text"
                        required
                        placeholder="Unit"
                        value={kr.unit}
                        onChange={e => handleKRChange(idx, 'unit', e.target.value)}
                        className="w-20 bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none text-center"
                      />
                      {keyResults.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveKRField(idx)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-300 p-2 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
              >
                Save OKR Configuration
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
