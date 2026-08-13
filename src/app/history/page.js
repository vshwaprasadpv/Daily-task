'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  History, Search, Filter, X, Eye, Calendar, Clock, FileText,
  Briefcase, CheckCircle, TrendingUp, Download, Link as LinkIcon
} from 'lucide-react';

function WorkHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdQuery = searchParams.get('userId');

  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState('all');
  const [taskTypeFilter, setTaskTypeFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [previewFileUrl, setPreviewFileUrl] = useState(null);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, timeframe, taskTypeFilter, clientFilter, projectFilter, employeeFilter, roleFilter, departmentFilter]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const sessionUser = JSON.parse(storedUser);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(sessionUser);

    fetchHistory(sessionUser, userIdQuery);
  }, [userIdQuery]);

  const fetchHistory = async (sessionUser, queryUserId) => {
    try {
      let url = '/api/work-logs';
      if (queryUserId && ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD'].includes(sessionUser.role)) {
        url += `?userId=${queryUserId}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load history');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const clients = new Set();
    const projects = new Set();
    const employees = new Set();
    const roles = new Set();
    const departments = new Set();
    const taskTypes = new Set();

    logs.forEach(log => {
      if (log.client?.name) clients.add(log.client.name);
      if (log.project?.name) projects.add(log.project.name);
      if (log.user?.name) employees.add(log.user.name);
      if (log.user?.role) roles.add(log.user.role);
      if (log.user?.department) {
        departments.add(log.user.department);
      } else {
        departments.add('Unassigned');
      }
      if (log.taskType) taskTypes.add(log.taskType);
    });

    return {
      clients: Array.from(clients).sort(),
      projects: Array.from(projects).sort(),
      employees: Array.from(employees).sort(),
      roles: Array.from(roles).sort(),
      departments: Array.from(departments).map(d => d || 'Unassigned').sort(),
      taskTypes: Array.from(taskTypes).sort()
    };
  }, [logs]);

  // Filter Logic
  const filteredLogs = useMemo(() => {
    let result = [...logs];
    const now = new Date();

    // Timeframe filter
    if (timeframe !== 'all') {
      // Don't mutate the original 'now' object
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
      
      const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
      
      const startOfQuarter = new Date(startOfToday);
      startOfQuarter.setMonth(startOfToday.getMonth() - (startOfToday.getMonth() % 3), 1);
      
      const startOfHalfYear = new Date(startOfToday);
      startOfHalfYear.setMonth(startOfToday.getMonth() < 6 ? 0 : 6, 1);
      
      const startOfYear = new Date(startOfToday.getFullYear(), 0, 1);

      result = result.filter(log => {
        const logDate = new Date(log.date);
        if (timeframe === 'today') return logDate >= startOfToday;
        if (timeframe === 'week') return logDate >= startOfWeek;
        if (timeframe === 'month') return logDate >= startOfMonth;
        if (timeframe === 'quarter') return logDate >= startOfQuarter;
        if (timeframe === 'halfYear') return logDate >= startOfHalfYear;
        if (timeframe === 'year') return logDate >= startOfYear;
        return true;
      });
    }

    // Exact Dropdown Filters
    if (taskTypeFilter !== 'all') result = result.filter(l => l.taskType === taskTypeFilter);
    if (clientFilter !== 'all') result = result.filter(l => l.client?.name === clientFilter);
    if (projectFilter !== 'all') result = result.filter(l => l.project?.name === projectFilter);
    
    // Admin Only Filters
    const userRole = user?.role?.toUpperCase();
    if (['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD'].includes(userRole)) {
      if (employeeFilter !== 'all') result = result.filter(l => l.user?.name === employeeFilter);
      if (roleFilter !== 'all') result = result.filter(l => l.user?.role === roleFilter);
      if (departmentFilter !== 'all') result = result.filter(l => (l.user?.department || 'Unassigned') === departmentFilter);
    }

    // Search query (fuzzy match across text fields)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(log => 
        (log.topic || '').toLowerCase().includes(q) ||
        (log.description || '').toLowerCase().includes(q) ||
        (log.client?.name || '').toLowerCase().includes(q) ||
        (log.project?.name || '').toLowerCase().includes(q) ||
        (log.taskType || '').toLowerCase().includes(q) ||
        (log.user?.name || '').toLowerCase().includes(q) ||
        (log.user?.role || '').replace(/_/g, ' ').toLowerCase().includes(q)
      );
    }

    return result;
  }, [logs, timeframe, taskTypeFilter, clientFilter, projectFilter, employeeFilter, roleFilter, departmentFilter, searchQuery, user]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalTasks = filteredLogs.length;
    const totalHours = filteredLogs.reduce((acc, l) => acc + (l.timeSpent / 60), 0);
    const clients = new Set(filteredLogs.map(l => l.client?.name)).size;
    const projects = new Set(filteredLogs.filter(l => l.project).map(l => l.project.name)).size;
    
    const taskTypeCount = {};
    filteredLogs.forEach(l => {
      taskTypeCount[l.taskType] = (taskTypeCount[l.taskType] || 0) + 1;
    });
    let mostUsedTaskType = 'None';
    let max = 0;
    Object.keys(taskTypeCount).forEach(k => {
      if (taskTypeCount[k] > max) {
        max = taskTypeCount[k];
        mostUsedTaskType = k;
      }
    });

    const avgTime = totalTasks > 0 ? (totalHours / totalTasks) : 0;

    return { totalTasks, totalHours, clients, projects, mostUsedTaskType, avgTime };
  }, [filteredLogs]);


  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Date', 'Client', 'Project', 'Task Type', 'Topic', 'Duration (mins)', 'Priority', 'Completed By', 'Role', 'Department'];
    const rows = filteredLogs.map(l => [
      new Date(l.date).toLocaleDateString(),
      l.client?.name || '',
      l.project?.name || '',
      l.taskType,
      `"${(l.topic || '').replace(/"/g, '""')}"`,
      l.timeSpent,
      l.priority,
      `"${l.user?.name || ''}"`,
      (l.user?.role || '').replace(/_/g, ' '),
      l.user?.department || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Work_History_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Sliced items for pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  if (!user) return null;
  const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD'].includes(user.role?.toUpperCase());

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto overflow-x-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-[var(--glass-border)] bg-[rgba(7,7,15,0.8)] backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-sm font-extrabold text-white">Work History {isAdmin ? '(Admin View)' : ''}</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Complete timeline of completed tasks and projects</p>
          </div>
          <button 
            onClick={handleExportCSV}
            className="bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[var(--glass-border)] text-white text-[10px] font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </header>

        <div className="p-8 space-y-6">
          
          {loading ? (
            <div className="flex justify-center py-20"><div className="spinner"></div></div>
          ) : (
            <>
              {/* Statistics Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 rounded-xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)]">
                  <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Total Tasks</p>
                  <p className="text-2xl font-black text-white">{stats.totalTasks}</p>
                </div>
                <div className="p-4 rounded-xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)]">
                  <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Total Hours</p>
                  <p className="text-2xl font-black text-[var(--primary-light)]">{Math.round(stats.totalHours * 10) / 10}h</p>
                </div>
                <div className="p-4 rounded-xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)]">
                  <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Avg Time/Task</p>
                  <p className="text-2xl font-black text-white">{Math.round(stats.avgTime * 10) / 10}h</p>
                </div>
                <div className="p-4 rounded-xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)]">
                  <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Most Used Type</p>
                  <p className="text-sm font-bold text-pink-400 mt-2 truncate">{stats.mostUsedTaskType}</p>
                </div>
                <div className="p-4 rounded-xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)]">
                  <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Total Clients</p>
                  <p className="text-2xl font-black text-white">{stats.clients}</p>
                </div>
                <div className="p-4 rounded-xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)]">
                  <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Total Projects</p>
                  <p className="text-2xl font-black text-[var(--success)]">{stats.projects}</p>
                </div>
              </div>

              {/* Layout Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                {/* Main Table Area */}
                <div className="xl:col-span-3 space-y-4">
                  
                  {/* Advanced Filters */}
                  <div className="p-4 rounded-xl glass-panel bg-[rgba(255,255,255,0.01)] border border-[var(--glass-border)] space-y-3">
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input 
                        type="text" 
                        placeholder="Search across all fields (topics, employee name, description, client)..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-3 items-center">
                      <div className="relative w-full md:w-auto">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <select 
                          value={timeframe}
                          onChange={(e) => setTimeframe(e.target.value)}
                          className="w-full bg-[#111127] border border-[var(--glass-border)] rounded-lg py-2 pl-9 pr-8 text-[10px] font-bold text-white focus:outline-none focus:border-[var(--primary-light)] appearance-none"
                        >
                          <option value="all">All Time</option>
                          <option value="today">Daily (Today)</option>
                          <option value="week">Weekly</option>
                          <option value="month">Monthly</option>
                          <option value="quarter">Quarterly</option>
                          <option value="halfYear">Half-Yearly</option>
                          <option value="year">Yearly</option>
                        </select>
                      </div>

                      <select 
                        value={taskTypeFilter}
                        onChange={(e) => setTaskTypeFilter(e.target.value)}
                        className="bg-[#111127] border border-[var(--glass-border)] rounded-lg py-2 px-3 text-[10px] font-bold text-white focus:outline-none"
                      >
                        <option value="all">All Task Types</option>
                        {filterOptions.taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      
                      <select 
                        value={clientFilter}
                        onChange={(e) => setClientFilter(e.target.value)}
                        className="bg-[#111127] border border-[var(--glass-border)] rounded-lg py-2 px-3 text-[10px] font-bold text-white focus:outline-none"
                      >
                        <option value="all">All Clients</option>
                        {filterOptions.clients.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>

                      <select 
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        className="bg-[#111127] border border-[var(--glass-border)] rounded-lg py-2 px-3 text-[10px] font-bold text-white focus:outline-none"
                      >
                        <option value="all">All Projects</option>
                        {filterOptions.projects.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    {isAdmin && (
                      <div className="flex flex-wrap gap-3 items-center pt-3 border-t border-[rgba(255,255,255,0.05)]">
                        <span className="text-[10px] font-bold text-[var(--primary-light)] uppercase tracking-wider">Admin Filters:</span>
                        
                        <select 
                          value={employeeFilter}
                          onChange={(e) => setEmployeeFilter(e.target.value)}
                          className="bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] rounded-lg py-1.5 px-3 text-[10px] font-bold text-white focus:outline-none"
                        >
                          <option value="all" className="bg-[#111127] text-white">All Employees</option>
                          {filterOptions.employees.map(e => <option key={e} value={e} className="bg-[#111127] text-white">{e}</option>)}
                        </select>
                        
                        <select 
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          className="bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] rounded-lg py-1.5 px-3 text-[10px] font-bold text-white focus:outline-none"
                        >
                          <option value="all" className="bg-[#111127] text-white">All Roles</option>
                          {filterOptions.roles.map(r => <option key={r} value={r} className="bg-[#111127] text-white">{r.replace(/_/g, ' ')}</option>)}
                        </select>

                        <select 
                          value={departmentFilter}
                          onChange={(e) => setDepartmentFilter(e.target.value)}
                          className="bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] rounded-lg py-1.5 px-3 text-[10px] font-bold text-white focus:outline-none"
                        >
                          <option value="all" className="bg-[#111127] text-white">All Departments / Teams</option>
                          {filterOptions.departments.map(d => <option key={d} value={d} className="bg-[#111127] text-white">{d}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Table */}
                  <div className="glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[rgba(0,0,0,0.3)]">
                            <th className="p-3.5 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Date & Time</th>
                            <th className="p-3.5 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Client & Project</th>
                            <th className="p-3.5 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Task Type</th>
                            <th className="p-3.5 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Topic / Title</th>
                            <th className="p-3.5 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Duration</th>
                            <th className="p-3.5 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--glass-border)]">
                          {paginatedLogs.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center p-8 text-[var(--text-muted)]">No logs match your filters.</td>
                            </tr>
                          ) : (
                            paginatedLogs.map(log => (
                              <tr key={log.id} className="hover:bg-[rgba(255,255,255,0.015)] transition-all">
                                <td className="p-3.5 whitespace-nowrap">
                                  <div className="font-bold text-white">{new Date(log.date).toLocaleDateString('en-IN')}</div>
                                  <div className="text-[9px] text-[var(--text-muted)]">{new Date(log.createdAt).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</div>
                                </td>
                                <td className="p-3.5">
                                  <div className="flex items-center gap-2">
                                    {log.client?.logoUrl ? (
                                      <img 
                                        src={log.client.logoUrl} 
                                        alt={log.client.name} 
                                        className="w-5 h-5 rounded-md object-contain bg-white/10 p-0.5"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                    ) : (
                                      <div className="w-5 h-5 rounded-md bg-[var(--primary)] flex items-center justify-center text-[8px] font-black text-white">
                                        {log.client?.name ? log.client.name.charAt(0).toUpperCase() : 'C'}
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-bold text-white leading-tight">{log.client?.name}</div>
                                      {log.project && <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{log.project.name}</div>}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3.5">
                                  <span className="bg-[rgba(99,102,241,0.1)] text-[var(--primary-light)] px-2 py-1 rounded border border-[rgba(99,102,241,0.2)] text-[9px] font-bold whitespace-nowrap">
                                    {log.taskType}
                                  </span>
                                </td>
                                <td className="p-3.5">
                                  <div className="font-bold text-white max-w-[200px] truncate">{log.topic}</div>
                                  <div className="text-[9px] text-[var(--text-secondary)] mt-1">
                                    Completed By: <span className="text-white font-bold">{log.user?.name}</span> <span className="opacity-70">({(log.user?.role || '').replace('_', ' ')})</span>
                                  </div>
                                </td>
                                <td className="p-3.5 font-bold text-white">
                                  {Math.floor(log.timeSpent/60)}h {log.timeSpent%60}m
                                </td>
                                <td className="p-3.5 text-right">
                                  <button 
                                    onClick={() => setSelectedLog(log)}
                                    className="bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[var(--glass-border)] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
                                  >
                                    <Eye className="w-3 h-3" /> View
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
                      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-[var(--glass-border)] text-xs text-[var(--text-secondary)] bg-[rgba(0,0,0,0.15)] gap-4">
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

                {/* Right Sidebar: Timeline */}
                <div className="xl:col-span-1 space-y-4">
                  <div className="p-5 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] max-h-[600px] flex flex-col">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[var(--primary-light)]" /> Recent Activity
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto pr-2 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[rgba(255,255,255,0.1)] before:to-transparent">
                      {filteredLogs.slice(0, 10).map((log, i) => (
                        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-6">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border border-[var(--primary-light)] bg-[#12122a] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <CheckCircle className="w-3 h-3 text-[var(--primary-light)]" />
                          </div>
                          <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded glass-panel bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{new Date(log.createdAt).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-xs font-bold text-white leading-tight mb-1">{log.topic}</p>
                            <p className="text-[9px] text-[var(--text-secondary)]">{log.client?.name}</p>
                          </div>
                        </div>
                      ))}
                      {filteredLogs.length > 10 && (
                        <p className="text-center text-[10px] text-[var(--text-muted)] mt-4">Showing last 10 entries</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal - Work Log Card (PRD Exact Format) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel bg-[rgba(12,12,25,0.95)] border border-[var(--glass-border)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-[var(--glass-border)] flex items-center justify-between sticky top-0 bg-[rgba(12,12,25,0.95)]">
              <div>
                <h3 className="text-sm font-extrabold text-white">Work Log Card</h3>
                <p className="text-[10px] text-[var(--text-muted)]">Historical Record Detail</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.1)] text-[var(--text-muted)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              <div className="bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.2)] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold text-[var(--primary-light)] uppercase tracking-wider mb-1">Completed By:</div>
                  <div className="text-sm font-black text-white">
                    {selectedLog.user?.name} <span className="opacity-70 text-xs font-semibold">({(selectedLog.user?.role || '').replace('_', ' ')})</span>
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
                      <span className="block text-xs font-bold text-white">{selectedLog.topic}</span>
                    </li>
                    <li>
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Client</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {selectedLog.client?.logoUrl ? (
                          <img 
                            src={selectedLog.client.logoUrl} 
                            alt={selectedLog.client.name} 
                            className="w-5 h-5 rounded-md object-contain bg-white/10 p-0.5"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-md bg-[var(--primary)] flex items-center justify-center text-[8px] font-black text-white">
                            {selectedLog.client?.name ? selectedLog.client.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                        )}
                        <span className="text-xs font-bold text-white">{selectedLog.client?.name}</span>
                      </div>
                    </li>
                    <li>
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Project</span>
                      <span className="block text-xs font-bold text-white">{selectedLog.project ? selectedLog.project.name : 'N/A'}</span>
                    </li>
                    <li>
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Task Type</span>
                      <span className="block text-xs font-bold text-white">{selectedLog.taskType}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-[var(--primary-light)] uppercase tracking-wider mb-3">Time & Audit Logs</h4>
                  <ul className="space-y-3">
                    <li>
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Completion Date</span>
                      <span className="block text-xs font-bold text-white">{new Date(selectedLog.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </li>
                    <li>
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Time Spent</span>
                      <span className="block text-xs font-bold text-white">{Math.floor(selectedLog.timeSpent/60)}h {selectedLog.timeSpent%60}m</span>
                    </li>
                    <li>
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Created At</span>
                      <span className="block text-[11px] font-mono text-[var(--text-secondary)]">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                    </li>
                    <li>
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Last Updated</span>
                      <span className="block text-[11px] font-mono text-[var(--text-secondary)]">{new Date(selectedLog.updatedAt || selectedLog.createdAt).toLocaleString()}</span>
                    </li>
                  </ul>
                </div>
              </div>

              {selectedLog.description && (
                <div>
                  <h4 className="text-[10px] font-bold text-[var(--primary-light)] uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-xs text-[var(--text-secondary)] bg-[rgba(255,255,255,0.02)] p-4 rounded-xl border border-[var(--glass-border)] leading-relaxed">
                    {selectedLog.description}
                  </p>
                </div>
              )}

              {selectedLog.attachmentUrl && (
                <div>
                  <h4 className="text-[10px] font-bold text-[var(--primary-light)] uppercase tracking-wider mb-2">Attachment Preview</h4>
                  <a 
                    href={selectedLog.attachmentUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-3 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] p-4 rounded-xl border border-[var(--glass-border)] transition-colors group"
                  >
                    <div className="p-2 bg-[rgba(99,102,241,0.1)] rounded-lg text-[var(--primary-light)] group-hover:scale-110 transition-transform">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white">View Asset Attachment</span>
                      <span className="block text-[9px] text-[var(--text-muted)] truncate max-w-sm">{selectedLog.attachmentUrl}</span>
                    </div>
                  </a>
                </div>
              )}

              {(selectedLog.finalFile || selectedLog.workFile) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parseFiles(selectedLog.finalFile).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-[var(--primary-light)] uppercase tracking-wider">Final Files ({parseFiles(selectedLog.finalFile).length})</h4>
                      {parseFiles(selectedLog.finalFile).map((file, idx) => (
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
                              onClick={() => setPreviewFileUrl(file)}
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

                  {parseFiles(selectedLog.workFile).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-[var(--primary-light)] uppercase tracking-wider">Work Files ({parseFiles(selectedLog.workFile).length})</h4>
                      {parseFiles(selectedLog.workFile).map((file, idx) => (
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
                              onClick={() => setPreviewFileUrl(file)}
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
      {previewFileUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-4xl w-full flex flex-col items-center justify-center">
            <button 
              onClick={() => setPreviewFileUrl(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full bg-[rgba(12,12,25,0.95)] border border-[var(--glass-border)] rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
              {previewFileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || previewFileUrl.startsWith('data:image') ? (
                <img 
                  src={previewFileUrl} 
                  alt="Work File Preview" 
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl border border-white/10" 
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-center p-8">
                  <FileText className="w-20 h-20 text-[var(--primary-light)] animate-pulse" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Non-Image Document Preview</h4>
                    <p className="text-xs text-[var(--text-secondary)] max-w-md truncate">{previewFileUrl}</p>
                  </div>
                  <a 
                    href={previewFileUrl} 
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
      )}
    </div>
  );
}

export default function WorkHistory() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]"><div className="spinner"></div></div>}>
      <WorkHistoryContent />
    </Suspense>
  );
}
