'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  PlusCircle, 
  Clock, 
  FileCheck, 
  AlertCircle,
  Paperclip,
  CheckCircle,
  TrendingUp,
  Target
} from 'lucide-react';

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [okrs, setOkrs] = useState([]);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [taskType, setTaskType] = useState('Reel');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [editingLogId, setEditingLogId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchData = async (userId) => {
    try {
      // Clients
      const cRes = await fetch('/api/clients');
      const cData = await cRes.json();
      if (cRes.status === 401 || cData.error === 'Unauthorized') {
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      setClients(Array.isArray(cData) ? cData : []);

      // Projects
      const pRes = await fetch('/api/projects');
      const pData = await pRes.json();
      setProjects(Array.isArray(pData) ? pData : []);

      // Logs
      const lRes = await fetch(`/api/work-logs?userId=${userId}`);
      const lData = await lRes.json();
      setWorkLogs(Array.isArray(lData) ? lData : []);

      // OKRs
      const oRes = await fetch(`/api/okrs?userId=${userId}`);
      const oData = await oRes.json();
      setOkrs(Array.isArray(oData) ? oData : []);
    } catch (err) {
      console.error('Data fetching failed:', err);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const sessionUser = JSON.parse(storedUser);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(sessionUser);

    // Fetch initial setup lists
    fetchData(sessionUser.id);
  }, [router]);

  const handleClientChange = (clientId) => {
    setSelectedClient(clientId);
    setSelectedProject('');
    setFilteredProjects(projects.filter(p => p.clientId === clientId));
  };

  const handleEdit = (log) => {
    setEditingLogId(log.id);
    setDate(log.date ? log.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setSelectedClient(log.clientId);
    setFilteredProjects(projects.filter(p => p.clientId === log.clientId));
    setSelectedProject(log.projectId || '');
    setTaskType(log.taskType);
    setTopic(log.topic);
    setDescription(log.description || '');
    const hrs = Math.floor(log.timeSpent / 60);
    const mins = log.timeSpent % 60;
    setHours(hrs > 0 ? hrs : '');
    setMinutes(mins > 0 ? mins : '');
    setPriority(log.priority);
    setAttachmentUrl(log.attachmentUrl || '');
    setNotes(log.notes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);

    if (!date || !taskType || !selectedClient || !topic) {
      setFormError('Please fill out all required fields');
      setLoading(false);
      return;
    }

    const totalMinutes = (parseInt(hours || 0, 10) * 60) + parseInt(minutes || 0, 10);

    try {
      const url = editingLogId ? `/api/work-logs/${editingLogId}` : '/api/work-logs';
      const method = editingLogId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          clientId: selectedClient,
          projectId: selectedProject,
          taskType,
          topic,
          description,
          timeSpent: totalMinutes,
          priority,
          attachmentUrl,
          notes
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit log');
      }

      setFormSuccess(editingLogId ? 'Work entry updated successfully! 🎉' : 'Completed work successfully logged! 🎉');
      setEditingLogId(null);
      setTopic('');
      setDescription('');
      setHours('');
      setMinutes('');
      setNotes('');
      setAttachmentUrl('');

      // Refresh listings
      fetchData(user.id);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const totalCompletedHours = workLogs.reduce((acc, log) => acc + (log.timeSpent / 60), 0);

  const taskTypes = [
    'Reel', 'Carousel', 'Static Post', 'Long Video', 'Short Video',
    'Motion Graphic', 'UI Design', 'Website Design', 'Landing Page',
    'Banner', 'Logo', 'Branding', 'Presentation', 'Thumbnail', 'Ad Creative', 'Other Work'
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[var(--glass-border)] bg-[rgba(7,7,15,0.8)] backdrop-blur-md px-8 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white">Daily Log Sheet</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Maintain and check your own completed creative tasks</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--success)] animate-pulse"></span>
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Live Session</span>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 space-y-8 flex-1">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl glass-panel relative overflow-hidden bg-[var(--glass-bg)] border-[var(--glass-border)]">
              <Clock className="w-8 h-8 text-[var(--warning)] mb-3" />
              <p className="text-2xl font-black text-white">{Math.round(totalCompletedHours * 10) / 10}h</p>
              <p className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-1">Total Effort Logged</p>
            </div>
            <div className="p-6 rounded-2xl glass-panel relative overflow-hidden bg-[var(--glass-bg)] border-[var(--glass-border)]">
              <FileCheck className="w-8 h-8 text-[var(--success)] mb-3" />
              <p className="text-2xl font-black text-white">{workLogs.length}</p>
              <p className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-1">Completed Submissions</p>
            </div>
            <div className="p-6 rounded-2xl glass-panel relative overflow-hidden bg-[var(--glass-bg)] border-[var(--glass-border)]">
              <Target className="w-8 h-8 text-[var(--primary-light)] mb-3" />
              <p className="text-2xl font-black text-white">{okrs.length > 0 ? `${okrs[0].progress}%` : '0%'}</p>
              <p className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-1">Active OKR Progress</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Log form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl glass-panel bg-[rgba(17,17,39,0.5)]">
                <div className="flex items-center gap-2 mb-6">
                  <PlusCircle className="w-5 h-5 text-[var(--primary-light)]" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Log Finished Work</h3>
                </div>

                {formError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-[11px] font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-200 text-[11px] font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleLogSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Completion Date *</label>
                      <input 
                        type="date"
                        required
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Task Type *</label>
                      <select 
                        value={taskType}
                        onChange={e => setTaskType(e.target.value)}
                        className="w-full bg-[#111127] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                      >
                        {taskTypes.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Client *</label>
                      <select 
                        required
                        value={selectedClient}
                        onChange={e => handleClientChange(e.target.value)}
                        className="w-full bg-[#111127] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                      >
                        <option value="">Select Client</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Topic / Asset Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Diwali Reels Teaser Video"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Detailed Description</label>
                    <textarea 
                      rows={3}
                      placeholder="Describe what you completed, revisions handled, creative changes..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Time Spent</label>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="number"
                          min="0"
                          placeholder="Hrs"
                          value={hours}
                          onChange={e => setHours(e.target.value)}
                          className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)] text-center"
                        />
                        <span className="text-xs text-[var(--text-muted)]">:</span>
                        <input 
                          type="number"
                          min="0"
                          max="59"
                          placeholder="Mins"
                          value={minutes}
                          onChange={e => setMinutes(e.target.value)}
                          className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)] text-center"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Priority</label>
                      <select 
                        value={priority}
                        onChange={e => setPriority(e.target.value)}
                        className="w-full bg-[#111127] border border-[var(--glass-border)] rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Creative Attachment Link</label>
                    <div className="relative">
                      <Paperclip className="absolute left-3.5 top-3 w-4 h-4 text-[var(--text-muted)]" />
                      <input 
                        type="url"
                        placeholder="Figma, Drive or Frame.io URL"
                        value={attachmentUrl}
                        onChange={e => setAttachmentUrl(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-bold py-3 rounded-xl hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? <div className="spinner"></div> : (editingLogId ? 'Update Work Entry' : 'Publish Work Entry')}
                    </button>
                    {editingLogId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingLogId(null);
                          setTopic('');
                          setDescription('');
                          setHours('');
                          setMinutes('');
                          setNotes('');
                          setAttachmentUrl('');
                        }}
                        className="bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[var(--glass-border)] text-white text-xs font-bold px-6 rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Submitted log sheet list */}
            <div className="lg:col-span-3 space-y-6">
              <div className="p-6 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Work Log History</h3>
                  </div>
                  <span className="text-[10px] bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)] px-2 py-1 rounded-md text-[var(--text-secondary)]">Showing recent logs</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[var(--glass-border)]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[rgba(0,0,0,0.3)]">
                        <th className="p-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
                        <th className="p-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Client & Project</th>
                        <th className="p-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Task Type</th>
                        <th className="p-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Topic</th>
                        <th className="p-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Time Spent</th>
                        <th className="p-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                      {workLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-[var(--text-muted)]">No completed logs found. Log your first output to see it here!</td>
                        </tr>
                      ) : (
                        workLogs.map(log => (
                          <tr key={log.id} className="hover:bg-[rgba(255,255,255,0.015)] transition-all">
                            <td className="p-3.5 font-medium">{new Date(log.date).toLocaleDateString('en-IN')}</td>
                             <td className="p-3.5">
                               <div className="flex items-center gap-2">
                                 {log.client.logoUrl ? (
                                   <img 
                                     src={log.client.logoUrl} 
                                     alt={log.client.name} 
                                     className="w-5 h-5 rounded-md object-contain bg-white/10 p-0.5"
                                     onError={(e) => { e.target.style.display = 'none'; }}
                                   />
                                 ) : (
                                   <div className="w-5 h-5 rounded-md bg-[var(--primary)] flex items-center justify-center text-[8px] font-black text-white">
                                     {log.client.name.charAt(0).toUpperCase()}
                                   </div>
                                 )}
                                 <div>
                                   <p className="font-bold text-white leading-tight">{log.client.name}</p>
                                   {log.project && <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{log.project.name}</p>}
                                 </div>
                               </div>
                             </td>
                            <td className="p-3.5">
                              <span className="bg-[rgba(99,102,241,0.1)] text-[var(--primary-light)] px-2 py-1 rounded-md text-[10px] font-semibold">{log.taskType}</span>
                            </td>
                            <td className="p-3.5">
                              <p className="font-bold text-white">{log.topic}</p>
                              {log.description && <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate max-w-[150px]">{log.description}</p>}
                              <p className="text-[9px] text-[var(--text-secondary)] mt-1">
                                Completed By: {log.user.name} <span className="opacity-70">({log.user.role.replace('_', ' ')})</span>
                              </p>
                            </td>
                            <td className="p-3.5 font-bold text-white">{Math.round((log.timeSpent / 60) * 10) / 10} hrs</td>
                            <td className="p-3.5 text-right">
                              <button 
                                onClick={() => handleEdit(log)}
                                className="bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[var(--glass-border)] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
