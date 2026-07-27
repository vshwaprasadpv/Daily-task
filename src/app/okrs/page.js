'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Target, CheckCircle2, AlertCircle, Calendar, Play, Check, Plus, Paperclip, MessageSquare, List, RotateCcw } from 'lucide-react';

export default function OkrsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [okrs, setOkrs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Update Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedOkr, setSelectedOkr] = useState(null);
  const [comment, setComment] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchOkrs = async (userId) => {
      try {
        const res = await fetch(`/api/okrs?userId=${userId}`);
        const data = await res.json();
        setOkrs(data);
      } catch (err) {
        console.error('Failed to load OKRs:', err);
      } finally {
        setLoading(false);
      }
    };

    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const sessionUser = JSON.parse(storedUser);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(sessionUser);
    fetchOkrs(sessionUser.id);
  }, [router]);

  const handleStatusChange = async (okrId, newStatus) => {
    try {
      const res = await fetch(`/api/okrs/${okrId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOkrs(okrs.map(o => o.id === okrId ? { ...o, status: newStatus } : o));
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOkr) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/okrs/${selectedOkr.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment, description, fileUrl })
      });
      
      if (res.ok) {
        setShowModal(false);
        setComment('');
        setDescription('');
        setFileUrl('');
        alert('Progress updated successfully!');
      } else {
        alert('Failed to add update');
      }
    } catch (err) {
      alert('Error adding update');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider text-gray-400 bg-gray-500/10 border-gray-500/20">Pending</span>;
      case 'IN_PROGRESS':
        return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider text-amber-400 bg-amber-500/10 border-amber-500/20">In Progress</span>;
      case 'COMPLETED':
        return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider text-green-400 bg-green-500/10 border-green-500/20">Completed</span>;
      default:
        return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider text-blue-400 bg-blue-500/10 border-blue-500/20">{status}</span>;
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
            <h2 className="text-sm font-extrabold text-white">Target OKRs</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Track assigned Objectives & Key Results</p>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 space-y-6 flex-1">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-[var(--primary-light)]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">My OKR Dashboard</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="spinner"></div>
            </div>
          ) : okrs.length === 0 ? (
            <div className="p-12 text-center glass-panel rounded-2xl bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-muted)]">
              No objectives assigned for the current target period.
            </div>
          ) : (
            <div className="space-y-6">
              {okrs.map(okr => (
                <div key={okr.id} className="p-6 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] space-y-6">
                  {/* Objective Header */}
                  <div className="flex items-start justify-between gap-6 flex-wrap">
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(okr.status)}
                        <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Strategic Objective</span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{okr.objective}</h3>
                      
                      <div className="flex items-center gap-4 text-[10px] text-[var(--text-secondary)] font-medium pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          Period: {okr.targetPeriod} ({okr.targetYear})
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          Target: {new Date(okr.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {okr.status === 'PENDING' && (
                        <button 
                          onClick={() => handleStatusChange(okr.id, 'IN_PROGRESS')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                        >
                          <Play className="w-4 h-4" /> Start OKR
                        </button>
                      )}
                      
                      {okr.status === 'IN_PROGRESS' && (
                        <>
                          <button 
                            onClick={() => {
                              setSelectedOkr(okr);
                              setShowModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.05)] text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Update Progress
                          </button>
                          <button 
                            onClick={() => handleStatusChange(okr.id, 'COMPLETED')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-green-900/20"
                          >
                            <Check className="w-4 h-4" /> Mark as Finished
                          </button>
                        </>
                      )}

                      {okr.status === 'COMPLETED' && (
                        <button 
                          onClick={() => handleStatusChange(okr.id, 'IN_PROGRESS')}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-amber-900/20"
                        >
                          <RotateCcw className="w-4 h-4" /> Restart OKR
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Overall Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-[var(--text-secondary)]">Overall Completion</span>
                      <span className="text-[#6366f1]">{okr.progress}%</span>
                    </div>
                    <div className="w-full bg-[rgba(255,255,255,0.05)] rounded-full h-2 overflow-hidden flex">
                      <div 
                        className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] h-full transition-all duration-1000 ease-out" 
                        style={{ width: `${Math.min(okr.progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Key Results */}
                  <div className="pt-4 border-t border-[var(--glass-border)] space-y-4">
                    <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-3.5 h-3.5" />
                      Key Results
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {okr.keyResults.map(kr => {
                        const progress = kr.target > 0 ? Math.round((kr.current / kr.target) * 100) : 0;
                        const isDone = progress >= 100;
                        
                        return (
                          <div key={kr.id} className="p-4 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.02)] space-y-3 relative overflow-hidden group">
                            {isDone && <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 blur-xl rounded-full"></div>}
                            
                            <div className="flex items-start justify-between gap-4">
                              <p className={`text-[11px] font-bold leading-relaxed ${isDone ? 'text-green-400' : 'text-gray-300'}`}>
                                {kr.title}
                              </p>
                              {isDone && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                            </div>
                            
                            <div className="flex items-end justify-between">
                              <div className="space-y-1">
                                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Current / Target</span>
                                <p className="text-xs font-mono font-bold text-white">
                                  {kr.current} <span className="text-[var(--text-muted)]">/ {kr.target} {kr.unit}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Update Progress Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e1e2d] border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-black/20">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#6366f1]" />
                Update OKR Progress
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <AlertCircle className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <List className="w-3.5 h-3.5" /> Description / Summary
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Mid-quarter review, final deliverables"
                  className="w-full bg-black/20 border border-gray-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#6366f1] transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Detailed Comment
                </label>
                <textarea
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your notes, blockers, or achievements..."
                  rows={4}
                  className="w-full bg-black/20 border border-gray-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#6366f1] transition-colors resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Document URL (Optional)
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://docs.google.com/..."
                  className="w-full bg-black/20 border border-gray-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#6366f1] transition-colors"
                />
              </div>
              
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-800 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Saving...' : 'Submit Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
