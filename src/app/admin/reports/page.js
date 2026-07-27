'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { FileDown, Calendar, Users, Info } from 'lucide-react';

export default function AdminReports() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [timeframe, setTimeframe] = useState('weekly');
  const [department, setDepartment] = useState('all');
  const [loading, setLoading] = useState(false);

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
  }, []);

  const handleDownload = async (format) => {
    setLoading(true);
    try {
      const url = `/api/reports?format=${format}&timeframe=${timeframe}&department=${department}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Report export failed');

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `productivity-report-${timeframe}-${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
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
            <h2 className="text-sm font-extrabold text-white">Reports Panel</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Generate and download compiled work reports and logs</p>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 max-w-4xl space-y-8 flex-1">
          <div className="p-6 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] space-y-6">
            <div className="flex items-center gap-2">
              <FileDown className="w-5 h-5 text-[var(--primary-light)]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Configure Export Parameters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>Select Timeframe</span>
                </div>
                <select 
                  value={timeframe}
                  onChange={e => setTimeframe(e.target.value)}
                  className="w-full bg-[#111127] border border-[var(--glass-border)] rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                >
                  <option value="daily">Daily (Today's Logs)</option>
                  <option value="weekly">Weekly (Last 7 Days)</option>
                  <option value="monthly">Monthly (Last 30 Days)</option>
                  <option value="quarterly">Quarterly (Last 90 Days)</option>
                  <option value="half-yearly">Half-Yearly (Last 180 Days)</option>
                  <option value="yearly">Yearly (Last 365 Days)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  <Users className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>Select Department</span>
                </div>
                <select 
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full bg-[#111127] border border-[var(--glass-border)] rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-[var(--primary-light)]"
                >
                  <option value="all">All Departments</option>
                  <option value="Design">Design</option>
                  <option value="Video">Video</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Management">Management</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.015)] border border-[var(--glass-border)] p-4 rounded-xl text-xs text-[var(--text-secondary)]">
              <Info className="w-5 h-5 text-[var(--primary-light)] flex-shrink-0" />
              <p>Reports aggregate all work logged by employees during the selected timeframe. You can choose styled PDFs for presentations, or formatted Excel spreadsheets for auditing.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[var(--glass-border)]">
              <button 
                onClick={() => handleDownload('pdf')}
                disabled={loading}
                className="flex-1 bg-[rgba(99,102,241,0.1)] hover:bg-[rgba(99,102,241,0.18)] border border-[var(--primary)] text-white text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? <div className="spinner"></div> : 'Download PDF Report'}
              </button>
              
              <button 
                onClick={() => handleDownload('excel')}
                disabled={loading}
                className="flex-1 bg-[rgba(16,185,129,0.1)] hover:bg-[rgba(16,185,129,0.18)] border border-[var(--success)] text-white text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? <div className="spinner"></div> : 'Download Excel Sheet'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
