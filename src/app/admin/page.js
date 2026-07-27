'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Activity, 
  User, 
  Briefcase,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend 
} from 'recharts';
import ActivityTimeline from '@/components/ActivityTimeline';

export default function AdminLiveDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

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

    // Initial Fetch
    fetchLiveAnalytics();

    // Polling every 10 seconds
    const interval = setInterval(() => {
      fetchLiveAnalytics();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchLiveAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics/live');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch live data:', err);
    }
  };

  if (!user || !data) {
    return (
      <div className="flex min-h-screen bg-[var(--bg-primary)]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="spinner"></div>
            <p className="text-xs font-bold text-[var(--text-muted)] animate-pulse uppercase tracking-widest">Establishing Live Connection...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[var(--glass-border)] bg-[rgba(7,7,15,0.8)] backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-extrabold text-white">Live Admin Dashboard</h2>
              <div className="px-2 py-0.5 rounded flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-bold uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                Live
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
              <RefreshCw className="w-3 h-3" /> Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </header>

        <div className="p-8 space-y-6">
          
          <div className="w-full mb-8">
            <ActivityTimeline employeeId="all" />
          </div>

          {/* Live Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-[rgba(16,185,129,0.1)] text-[var(--success)] rounded-lg"><Users className="w-5 h-5" /></div>
                <span className="text-[10px] text-[var(--success)] font-bold bg-[rgba(16,185,129,0.1)] px-2 py-1 rounded-md">Online</span>
              </div>
              <h3 className="text-3xl font-extrabold text-white leading-none">{data.metrics.employeesActiveToday} <span className="text-sm text-[var(--text-muted)] font-medium">/ {data.metrics.totalEmployees}</span></h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-2 font-semibold uppercase tracking-wider">Employees Active Today</p>
            </div>
            
            <div className="p-5 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-[rgba(99,102,241,0.1)] text-[var(--primary-light)] rounded-lg"><CheckCircle className="w-5 h-5" /></div>
                <span className="text-[10px] text-[var(--primary-light)] font-bold bg-[rgba(99,102,241,0.1)] px-2 py-1 rounded-md">Completed</span>
              </div>
              <h3 className="text-3xl font-extrabold text-white leading-none">{data.metrics.tasksToday}</h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-2 font-semibold uppercase tracking-wider">Total Tasks Today</p>
            </div>
            
            <div className="p-5 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-[rgba(245,158,11,0.1)] text-[var(--warning)] rounded-lg"><Clock className="w-5 h-5" /></div>
                <span className="text-[10px] text-[var(--warning)] font-bold bg-[rgba(245,158,11,0.1)] px-2 py-1 rounded-md">Time Logged</span>
              </div>
              <h3 className="text-3xl font-extrabold text-white leading-none">{data.metrics.hoursToday} <span className="text-sm text-[var(--text-muted)] font-medium">hrs</span></h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-2 font-semibold uppercase tracking-wider">Total Working Hours Today</p>
            </div>

            <div className="p-5 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--primary)] opacity-20 blur-2xl rounded-full"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-[rgba(236,72,153,0.1)] text-pink-400 rounded-lg"><Briefcase className="w-5 h-5" /></div>
                <span className="text-[10px] text-pink-400 font-bold bg-[rgba(236,72,153,0.1)] px-2 py-1 rounded-md">Clients</span>
              </div>
              <h3 className="text-3xl font-extrabold text-white leading-none">{data.metrics.activeClients}</h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-2 font-semibold uppercase tracking-wider">Active Clients Today</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Live Team Activity Feed */}
            <div className="xl:col-span-2 p-6 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] flex flex-col max-h-[500px]">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-[var(--primary-light)]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Team Activity</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {data.liveActivity.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">No recent activity found.</p>
                ) : (
                  data.liveActivity.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)] animate-fade-in">
                      <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {log.userAvatar ? (
                          <img src={log.userAvatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-[var(--text-muted)]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-white">
                          Completed a <span className="font-bold">{log.taskType}</span> for <span className="font-bold text-pink-300">{log.clientName}</span>
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                          Completed By: {log.userName} <span className="opacity-70">({log.userRole?.replace('_', ' ')})</span>
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1 line-clamp-1">Topic: {log.topic}</p>
                      </div>
                      <div className="text-[10px] font-bold text-[var(--text-secondary)] whitespace-nowrap bg-[rgba(255,255,255,0.05)] px-2 py-1 rounded">
                        {log.timeAgo < 1 ? 'Just now' : `${log.timeAgo}m ago`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Employee Status Board */}
            <div className="p-6 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] max-h-[500px] flex flex-col">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6">Employee Status</h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {data.employeeStatus.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors border border-transparent hover:border-[var(--glass-border)]">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] flex items-center justify-center overflow-hidden">
                          {emp.profilePictureUrl ? (
                            <img src={emp.profilePictureUrl} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-[var(--text-muted)]" />
                          )}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#12122a] ${emp.status === 'Online' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white leading-tight">{emp.name}</p>
                        <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{emp.department || emp.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${emp.status === 'Online' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                      {emp.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Department Comparison Chart */}
          <div className="p-6 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6">Live Department Comparison</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.departmentComparison} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#12122a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="active" name="Active Today" fill="var(--success)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" name="Total Members" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
