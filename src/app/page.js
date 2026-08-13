'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Target,
  Search,
  Upload,
  Eye,
  FileText,
  X,
  Download,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [okrs, setOkrs] = useState([]);
  
  // Search, Month & Pagination State
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // Default to current month
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedMonth]);

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
  const [finalFiles, setFinalFiles] = useState([]);
  const [workFiles, setWorkFiles] = useState([]);
  const [tempFinalUrl, setTempFinalUrl] = useState('');
  const [tempWorkUrl, setTempWorkUrl] = useState('');
  const [finalFileError, setFinalFileError] = useState('');
  const [workFileError, setWorkFileError] = useState('');
  const [previewFilesList, setPreviewFilesList] = useState([]);
  const [previewFileIndex, setPreviewFileIndex] = useState(-1);
  const triggerPreview = (fileUrl, list = []) => {
    let files = Array.isArray(list) ? list : [list];
    if (files.length === 0 && fileUrl) {
      files = [fileUrl];
    }
    const idx = files.indexOf(fileUrl);
    setPreviewFilesList(files);
    setPreviewFileIndex(idx !== -1 ? idx : 0);
  };
  const [notes, setNotes] = useState('');

  const [editingLogId, setEditingLogId] = useState(null);
  const [selectedDetailLog, setSelectedDetailLog] = useState(null);

  const parseFiles = (val) => {
    if (!val) return [];
    if (val.startsWith('[') && val.endsWith(']')) {
      try {
        return JSON.parse(val);
      } catch (e) {
        return [val];
      }
    }
    return [val];
  };

  const handleFileUpload = async (files, setFiles, setError) => {
    if (!files || files.length === 0) return;
    setError('');
    const uploadedUrls = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Upload failed for ${file.name}`);
        }
        
        const data = await res.json();
        uploadedUrls.push(data.url);
      }
      setFiles(prev => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

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
    setFinalFiles(parseFiles(log.finalFile));
    setWorkFiles(parseFiles(log.workFile));
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
          finalFile: JSON.stringify(finalFiles),
          workFile: JSON.stringify(workFiles),
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
      setFinalFiles([]);
      setWorkFiles([]);

      // Refresh listings
      fetchData(user.id);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate month options from workLogs
  const monthOptions = useMemo(() => {
    const options = new Map();
    
    // Add current month by default
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.set(currentMonthKey, currentMonthLabel);
    
    // Add months from workLogs
    workLogs.forEach(log => {
      if (log.date) {
        const d = new Date(log.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        options.set(key, label);
      }
    });
    
    // Convert to sorted array
    return Array.from(options.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [workLogs]);

  // Filter logs by selected month first
  const monthlyLogs = useMemo(() => {
    if (selectedMonth === 'all') return workLogs;
    const [year, month] = selectedMonth.split('-').map(Number);
    return workLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate.getFullYear() === year && (logDate.getMonth() + 1) === month;
    });
  }, [workLogs, selectedMonth]);

  // Filter work logs by search query (topic/client/project/taskType)
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return monthlyLogs;
    const query = searchQuery.toLowerCase().trim();
    return monthlyLogs.filter(log => 
      (log.topic && log.topic.toLowerCase().includes(query)) ||
      (log.client?.name && log.client.name.toLowerCase().includes(query)) ||
      (log.project?.name && log.project.name.toLowerCase().includes(query)) ||
      (log.taskType && log.taskType.toLowerCase().includes(query))
    );
  }, [monthlyLogs, searchQuery]);

  // Sliced logs for dashboard table pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Stats calculation based on monthlyLogs (filtered by month)
  const totalCompletedHours = monthlyLogs.reduce((acc, log) => acc + (log.timeSpent / 60), 0);

  // Active OKR Progress month-wise
  const activeOkrProgress = useMemo(() => {
    const okrsInMonth = okrs.filter(okr => {
      if (selectedMonth === 'all') return true;
      const [year, month] = selectedMonth.split('-').map(Number);
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59);
      
      const okrStart = new Date(okr.startDate);
      const okrEnd = new Date(okr.endDate);
      
      return okrStart <= monthEnd && okrEnd >= monthStart;
    });
    return okrsInMonth.length > 0 
      ? Math.round(okrsInMonth.reduce((acc, o) => acc + o.progress, 0) / okrsInMonth.length)
      : 0;
  }, [okrs, selectedMonth]);

  const taskTypes = [
    'Reel', 'Carousel', 'Static Post', 'Long Video', 'Short Video',
    'Motion Graphic', 'UI Design', 'Website Design', 'Landing Page',
    'Banner', 'Logo', 'Branding', 'Presentation', 'Thumbnail', 'Ad Creative', 'Other Work'
  ];

  if (!user) return null;

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
          {/* Month Selector Filter Control Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl glass-panel bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)]">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--primary-light)] animate-pulse"></span>
                Dashboard Overview Filter
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Filter quick metrics and logs list by specific month</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Select Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-[#111127] border border-[var(--glass-border)] rounded-xl py-2 px-4 text-xs font-bold text-white focus:outline-none focus:border-[var(--primary-light)] cursor-pointer hover:bg-[#181835] transition-all"
              >
                <option value="all">All Time</option>
                {monthOptions.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl glass-panel relative overflow-hidden bg-[var(--glass-bg)] border-[var(--glass-border)] group hover:border-[rgba(251,191,36,0.3)] transition-all">
              <Clock className="w-8 h-8 text-[var(--warning)] mb-3 group-hover:scale-110 transition-all duration-300" />
              <p className="text-2xl font-black text-white">{Math.round(totalCompletedHours * 10) / 10}h</p>
              <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-1">Total Effort Logged ({selectedMonth === 'all' ? 'All Time' : 'Selected Month'})</p>
            </div>
            <div className="p-6 rounded-2xl glass-panel relative overflow-hidden bg-[var(--glass-bg)] border-[var(--glass-border)] group hover:border-[rgba(34,197,94,0.3)] transition-all">
              <FileCheck className="w-8 h-8 text-[var(--success)] mb-3 group-hover:scale-110 transition-all duration-300" />
              <p className="text-2xl font-black text-white">{monthlyLogs.length}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-1">Completed Submissions ({selectedMonth === 'all' ? 'All Time' : 'Selected Month'})</p>
            </div>
            <div className="p-6 rounded-2xl glass-panel relative overflow-hidden bg-[var(--glass-bg)] border-[var(--glass-border)] group hover:border-[rgba(99,102,241,0.3)] transition-all">
              <Target className="w-8 h-8 text-[var(--primary-light)] mb-3 group-hover:scale-110 transition-all duration-300" />
              <p className="text-2xl font-black text-white">{activeOkrProgress}%</p>
              <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-1">Active OKR Progress ({selectedMonth === 'all' ? 'All Time' : 'Selected Month'})</p>
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

                  <div className="space-y-4 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Creative Attachment Link (Optional)</label>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Final File Upload */}
                      <div className="space-y-2 bg-black/10 border border-[var(--glass-border)] rounded-xl p-3.5">
                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Final Files (Delivered Assets)</label>
                        
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text"
                            placeholder="Paste link and click + Add"
                            value={tempFinalUrl}
                            onChange={e => setTempFinalUrl(e.target.value)}
                            className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-lg py-1.5 px-3 text-[10px] text-white focus:outline-none focus:border-[var(--primary-light)]"
                          />
                          {tempFinalUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setFinalFiles(prev => [...prev, tempFinalUrl]);
                                setTempFinalUrl('');
                              }}
                              className="bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.1)] text-white text-[10px] font-bold py-2 px-2.5 rounded-lg cursor-pointer transition-all shrink-0"
                            >
                              + Add
                            </button>
                          )}
                          <label className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white text-[10px] font-bold py-2 px-3 rounded-lg cursor-pointer transition-all flex items-center gap-1 shrink-0">
                            <Upload className="w-3 h-3" /> Upload
                            <input 
                              type="file" 
                              multiple
                              className="hidden" 
                              onChange={async (e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                  await handleFileUpload(files, setFinalFiles, setFinalFileError);
                                }
                              }}
                            />
                          </label>
                        </div>
                        {finalFileError && <p className="text-[10px] text-red-400 font-semibold">{finalFileError}</p>}
                        
                        {finalFiles.length > 0 && (
                          <div className="space-y-1.5 mt-2 max-h-[120px] overflow-y-auto pr-1">
                            {finalFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3 bg-white/5 border border-[var(--glass-border)] rounded-lg p-2">
                                <div className="flex items-center gap-2 truncate">
                                  {file.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || file.startsWith('data:image') ? (
                                    <img src={file} alt="Preview" className="w-8 h-8 rounded object-cover bg-white/10" />
                                  ) : (
                                    <FileText className="w-5 h-5 text-[var(--primary-light)]" />
                                  )}
                                  <span className="text-[10px] text-[var(--text-secondary)] truncate max-w-[120px]">{file.split('/').pop()}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button 
                                    type="button" 
                                    onClick={() => triggerPreview(file, finalFiles)}
                                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
                                    title="Preview File"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => setFinalFiles(prev => prev.filter((_, i) => i !== idx))}
                                    className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                                    title="Remove File"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Work File Upload */}
                      <div className="space-y-2 bg-black/10 border border-[var(--glass-border)] rounded-xl p-3.5">
                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Work Files (Project/Raw Files)</label>
                        
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text"
                            placeholder="Paste link and click + Add"
                            value={tempWorkUrl}
                            onChange={e => setTempWorkUrl(e.target.value)}
                            className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-lg py-1.5 px-3 text-[10px] text-white focus:outline-none focus:border-[var(--primary-light)]"
                          />
                          {tempWorkUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setWorkFiles(prev => [...prev, tempWorkUrl]);
                                setTempWorkUrl('');
                              }}
                              className="bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.1)] text-white text-[10px] font-bold py-2 px-2.5 rounded-lg cursor-pointer transition-all shrink-0"
                            >
                              + Add
                            </button>
                          )}
                          <label className="bg-[var(--secondary)] hover:bg-[var(--secondary-light)] text-white text-[10px] font-bold py-2 px-3 rounded-lg cursor-pointer transition-all flex items-center gap-1 shrink-0">
                            <Upload className="w-3 h-3" /> Upload
                            <input 
                              type="file" 
                              multiple
                              className="hidden" 
                              onChange={async (e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                  await handleFileUpload(files, setWorkFiles, setWorkFileError);
                                }
                              }}
                            />
                          </label>
                        </div>
                        {workFileError && <p className="text-[10px] text-red-400 font-semibold">{workFileError}</p>}

                        {workFiles.length > 0 && (
                          <div className="space-y-1.5 mt-2 max-h-[120px] overflow-y-auto pr-1">
                            {workFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3 bg-white/5 border border-[var(--glass-border)] rounded-lg p-2">
                                <div className="flex items-center gap-2 truncate">
                                  {file.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || file.startsWith('data:image') ? (
                                    <img src={file} alt="Preview" className="w-8 h-8 rounded object-cover bg-white/10" />
                                  ) : (
                                    <FileText className="w-5 h-5 text-[var(--secondary)]" />
                                  )}
                                  <span className="text-[10px] text-[var(--text-secondary)] truncate max-w-[120px]">{file.split('/').pop()}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button 
                                    type="button" 
                                    onClick={() => triggerPreview(file, workFiles)}
                                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
                                    title="Preview File"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => setWorkFiles(prev => prev.filter((_, i) => i !== idx))}
                                    className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                                    title="Remove File"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Work Log History</h3>
                  </div>
                  
                  {/* Search Input Bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] animate-pulse" />
                    <input 
                      type="text" 
                      placeholder="Search topic, client or project..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)] placeholder-[rgba(255,255,255,0.2)]"
                    />
                  </div>
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
                      {paginatedLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-[var(--text-muted)]">No logs match your search query. Try another keyword!</td>
                        </tr>
                      ) : (
                        paginatedLogs.map(log => (
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
                               <button
                                 type="button"
                                 onClick={() => setSelectedDetailLog(log)}
                                 className="font-bold text-white text-left hover:text-[var(--primary-light)] transition-colors cursor-pointer block focus:outline-none"
                               >
                                 {log.topic}
                               </button>
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
                {/* Pagination Controls */}
                {filteredLogs.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-[var(--glass-border)] text-xs text-[var(--text-secondary)] bg-[rgba(0,0,0,0.15)] gap-4 mt-4 rounded-xl">
                    <div>
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.08)] disabled:opacity-40 disabled:hover:bg-[rgba(255,255,255,0.03)] transition-all cursor-pointer font-bold disabled:cursor-not-allowed text-white"
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: Math.ceil(filteredLogs.length / itemsPerPage) }, (_, idx) => idx + 1)
                        .filter(page => page === 1 || page === Math.ceil(filteredLogs.length / itemsPerPage) || Math.abs(page - currentPage) <= 1)
                        .map((page, idx, arr) => {
                          const showEllipsisBefore = page > 1 && arr[idx - 1] !== page - 1;
                          return (
                            <React.Fragment key={page}>
                              {showEllipsisBefore && <span className="px-1 text-[var(--text-muted)]">...</span>}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                                  currentPage === page
                                    ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-md shadow-[rgba(99,102,241,0.2)]'
                                    : 'bg-[rgba(255,255,255,0.03)] border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.08)] text-white'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredLogs.length / itemsPerPage)))}
                        disabled={currentPage === Math.ceil(filteredLogs.length / itemsPerPage)}
                        className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.08)] disabled:opacity-40 disabled:hover:bg-[rgba(255,255,255,0.03)] transition-all cursor-pointer font-bold disabled:cursor-not-allowed text-white"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Detail View Modal */}
      {selectedDetailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel bg-[rgba(12,12,25,0.95)] border border-[var(--glass-border)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-[var(--glass-border)] flex items-center justify-between sticky top-0 bg-[rgba(12,12,25,0.95)] z-10">
              <div>
                <h3 className="text-sm font-extrabold text-white">Work Log Card</h3>
                <p className="text-[10px] text-[var(--text-muted)]">Completed Record Detail</p>
              </div>
              <button 
                onClick={() => setSelectedDetailLog(null)}
                className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.1)] text-[var(--text-muted)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              <div className="bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.2)] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold text-[var(--primary-light)] uppercase tracking-wider mb-1">Completed By:</div>
                  <div className="text-sm font-black text-white">
                    {selectedDetailLog.user?.name} <span className="opacity-70 text-xs font-semibold">({(selectedDetailLog.user?.role || '').replace('_', ' ')})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-[rgba(16,185,129,0.1)] px-3 py-1.5 rounded-lg border border-[rgba(16,185,129,0.2)]">
                  <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                  <span className="text-xs font-bold text-[var(--success)] uppercase tracking-wider">Status: Completed</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-bold text-[var(--primary-light)] uppercase tracking-wider mb-3">Task Information</h4>
                  <ul className="space-y-3">
                    <li>
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Task Title / Topic</span>
                      <span className="block text-xs font-bold text-white">{selectedDetailLog.topic}</span>
                    </li>
                    <li>
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Client</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {selectedDetailLog.client?.logoUrl ? (
                          <img 
                            src={selectedDetailLog.client.logoUrl} 
                            alt={selectedDetailLog.client.name} 
                            className="w-5 h-5 rounded-md object-contain bg-white/10 p-0.5"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-md bg-[var(--primary)] flex items-center justify-center text-[8px] font-black text-white">
                            {selectedDetailLog.client?.name ? selectedDetailLog.client.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                        )}
                        <span className="text-xs font-bold text-white">{selectedDetailLog.client?.name}</span>
                      </div>
                    </li>
                    <li>
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Project</span>
                      <span className="block text-xs font-bold text-white">{selectedDetailLog.project ? selectedDetailLog.project.name : 'N/A'}</span>
                    </li>
                    <li>
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Task Type</span>
                      <span className="block text-xs font-bold text-white">{selectedDetailLog.taskType}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-[var(--primary-light)] uppercase tracking-wider mb-3">Time & Audit Logs</h4>
                  <ul className="space-y-3">
                    <li>
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Completion Date</span>
                      <span className="block text-xs font-bold text-white">{new Date(selectedDetailLog.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </li>
                    <li>
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Time Spent</span>
                      <span className="block text-xs font-bold text-white">{Math.floor(selectedDetailLog.timeSpent/60)}h {selectedDetailLog.timeSpent%60}m</span>
                    </li>
                    <li>
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Created At</span>
                      <span className="block text-[11px] font-mono text-[var(--text-secondary)]">{new Date(selectedDetailLog.createdAt).toLocaleString()}</span>
                    </li>
                    <li>
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Last Updated</span>
                      <span className="block text-[11px] font-mono text-[var(--text-secondary)]">{new Date(selectedDetailLog.updatedAt || selectedDetailLog.createdAt).toLocaleString()}</span>
                    </li>
                  </ul>
                </div>
              </div>

              {selectedDetailLog.description && (
                <div>
                  <h4 className="text-[10px] font-bold text-[var(--primary-light)] uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-xs text-[var(--text-secondary)] bg-[rgba(255,255,255,0.02)] p-4 rounded-xl border border-[var(--glass-border)] leading-relaxed">
                    {selectedDetailLog.description}
                  </p>
                </div>
              )}

              {selectedDetailLog.attachmentUrl && (
                <div>
                  <h4 className="text-[10px] font-bold text-[var(--primary-light)] uppercase tracking-wider mb-2">Attachment Preview</h4>
                  <a 
                    href={selectedDetailLog.attachmentUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-3 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] p-4 rounded-xl border border-[var(--glass-border)] transition-colors group"
                  >
                    <div className="p-2 bg-[rgba(99,102,241,0.1)] rounded-lg text-[var(--primary-light)] group-hover:scale-110 transition-transform">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white">View Attachment</span>
                      <span className="block text-[9px] text-[var(--text-muted)] truncate max-w-sm">{selectedDetailLog.attachmentUrl}</span>
                    </div>
                  </a>
                </div>
              )}

              {(selectedDetailLog.finalFile || selectedDetailLog.workFile) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parseFiles(selectedDetailLog.finalFile).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-[var(--primary-light)] uppercase tracking-wider">Final Files ({parseFiles(selectedDetailLog.finalFile).length})</h4>
                      {parseFiles(selectedDetailLog.finalFile).map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 bg-[rgba(255,255,255,0.02)] p-2.5 rounded-xl border border-[var(--glass-border)]">
                          <div className="flex items-center gap-2 truncate">
                            {file.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || file.startsWith('data:image') ? (
                              <img src={file} alt={`Final File ${idx}`} className="w-8 h-8 rounded object-cover bg-white/10" />
                            ) : (
                              <FileText className="w-5 h-5 text-[var(--primary-light)]" />
                            )}
                            <span className="text-xs font-bold text-white truncate max-w-[120px]">{file.split('/').pop()}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              type="button" 
                              onClick={() => triggerPreview(file, parseFiles(selectedDetailLog.finalFile))}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
                              title="Preview File"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <a 
                              href={file}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all"
                              title="Download File"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {parseFiles(selectedDetailLog.workFile).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-[var(--primary-light)] uppercase tracking-wider">Work Files ({parseFiles(selectedDetailLog.workFile).length})</h4>
                      {parseFiles(selectedDetailLog.workFile).map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 bg-[rgba(255,255,255,0.02)] p-2.5 rounded-xl border border-[var(--glass-border)]">
                          <div className="flex items-center gap-2 truncate">
                            {file.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || file.startsWith('data:image') ? (
                              <img src={file} alt={`Work File ${idx}`} className="w-8 h-8 rounded object-cover bg-white/10" />
                            ) : (
                              <FileText className="w-5 h-5 text-[var(--secondary)]" />
                            )}
                            <span className="text-xs font-bold text-white truncate max-w-[120px]">{file.split('/').pop()}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              type="button" 
                              onClick={() => triggerPreview(file, parseFiles(selectedDetailLog.workFile))}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
                              title="Preview File"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <a 
                              href={file}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all"
                              title="Download File"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Lightbox File Preview Modal */}
      {previewFileIndex !== -1 && previewFilesList.length > 0 && (() => {
        const activeFile = previewFilesList[previewFileIndex];
        const isImage = activeFile.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || activeFile.startsWith('data:image');
        const isVideo = activeFile.match(/\.(mp4|mov|webm|m4v|ogg)$/i);
        
        const handlePrev = (e) => {
          e.stopPropagation();
          setPreviewFileIndex(prev => (prev - 1 + previewFilesList.length) % previewFilesList.length);
        };

        const handleNext = (e) => {
          e.stopPropagation();
          setPreviewFileIndex(prev => (prev + 1) % previewFilesList.length);
        };

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="relative max-w-4xl w-full flex flex-col items-center justify-center">
              
              {/* Close Button */}
              <button 
                onClick={() => {
                  setPreviewFilesList([]);
                  setPreviewFileIndex(-1);
                }}
                className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer z-50"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation Arrows */}
              {previewFilesList.length > 1 && (
                <>
                  <button 
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10 transition-all cursor-pointer z-50"
                    title="Previous Slide"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10 transition-all cursor-pointer z-50"
                    title="Next Slide"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Slide Counter Info */}
              {previewFilesList.length > 1 && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/50 border border-white/10 text-white text-xs font-bold">
                  File {previewFileIndex + 1} of {previewFilesList.length}
                </div>
              )}

              <div className="w-full bg-[rgba(12,12,25,0.95)] border border-[var(--glass-border)] rounded-2xl p-6 flex flex-col items-center justify-center min-h-[350px] relative">
                {isImage ? (
                  <img 
                    src={activeFile} 
                    alt="File Preview" 
                    className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl border border-white/10" 
                  />
                ) : isVideo ? (
                  <video 
                    src={activeFile} 
                    controls 
                    autoPlay 
                    loop 
                    className="max-w-full max-h-[70vh] rounded-xl shadow-2xl border border-white/10" 
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-center p-8">
                    <FileText className="w-20 h-20 text-[var(--primary-light)] animate-pulse" />
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">Non-Image Document Preview</h4>
                      <p className="text-xs text-[var(--text-secondary)] max-w-md truncate">{activeFile.split('/').pop()}</p>
                    </div>
                    <a 
                      href={activeFile} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-bold py-2.5 px-6 rounded-xl hover:opacity-95 transition-all"
                    >
                      Open / Download File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
