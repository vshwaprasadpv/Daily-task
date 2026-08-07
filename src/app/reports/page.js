'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  BarChart2, 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  FileDown
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// Custom dot to make weekends red, holidays yellow
const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  const isWeekend = payload?.isWeekend;
  const isHoliday = payload?.isHoliday;
  
  if (!cx || !cy) return null;

  let strokeColor = "#6366f1"; // Default purple
  if (isWeekend) strokeColor = "#ef4444"; // Red for weekend
  if (isHoliday) strokeColor = "#fbbf24"; // Yellow for holidays

  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={4} 
      stroke={strokeColor} 
      strokeWidth={2} 
      fill="#12122a" 
    />
  );
};

// Custom tick to make weekend labels red, holidays yellow
const CustomTick = (props) => {
  const { x, y, payload, data } = props;
  const tickData = data?.find(d => d.date === payload.value);
  const isWeekend = tickData?.isWeekend;
  const isHoliday = tickData?.isHoliday;

  let fill = "rgba(255,255,255,0.3)"; // Default gray
  if (isWeekend) fill = "#ef4444"; // Red for weekend
  if (isHoliday) fill = "#fbbf24"; // Yellow for holidays

  return (
    <text 
      x={x} 
      y={y + 12} 
      textAnchor="middle" 
      fill={fill} 
      fontSize={10}
    >
      {tickData ? parseInt(tickData.date.split('-')[2], 10) : payload.value}
    </text>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-[#12122a] border border-gray-800 p-3 rounded-lg shadow-xl text-xs">
        <p className="text-gray-300 font-medium mb-1">
          {dataPoint.label ? dataPoint.label : new Date(dataPoint.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
        <p className="text-[#6366f1] font-bold">
          {dataPoint.hours} Hours Worked
        </p>
        {dataPoint.isWeekend && (
           <p className="text-red-500 font-semibold mt-1">Weekend</p>
        )}
        {dataPoint.isHoliday && (
           <p className="text-yellow-500 font-semibold mt-0.5">Office Holiday</p>
        )}
      </div>
    );
  }
  return null;
};

export default function EmployeeReports() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');
  const [chartMode, setChartMode] = useState('daily'); // 'daily' or 'monthly'

  const fetchAnalytics = useCallback(async (userId) => {
    try {
      const res = await fetch(`/api/analytics/employee/${userId}?timeframe=${timeframe}`);
      if (!res.ok) throw new Error('Failed to load analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const sessionUser = JSON.parse(storedUser);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(sessionUser);
    fetchAnalytics(sessionUser.id);
  }, [router, fetchAnalytics, timeframe]);

  if (!user) return null;

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[var(--glass-border)] bg-[rgba(7,7,15,0.8)] backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-sm font-extrabold text-white">My Performance Report</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Track your productivity, OKRs, and work history</p>
          </div>
          <button 
            onClick={() => window.print()}
            className="bg-[rgba(99,102,241,0.1)] hover:bg-[rgba(99,102,241,0.18)] border border-[var(--primary)] text-[var(--primary-light)] text-[10px] font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all print:hidden"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </header>

        <div className="p-8 space-y-6">
          {loading || !analytics ? (
            <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>
          ) : (
            <>
              {/* Filter Bar */}
              <div className="flex items-center gap-4 bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)] p-3 rounded-xl w-fit">
                <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                <select 
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none font-bold"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-5 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-[rgba(16,185,129,0.1)] text-[var(--success)] rounded-lg"><CheckCircle className="w-5 h-5" /></div>
                    <span className="text-[10px] text-[var(--success)] font-bold bg-[rgba(16,185,129,0.1)] px-2 py-1 rounded-md">Tasks</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-white leading-none">{analytics.metrics.tasksThisMonth}</h3>
                  <p className="text-[10px] text-[var(--text-muted)] mt-2 font-semibold uppercase tracking-wider">Completed This Month</p>
                </div>
                
                <div className="p-5 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-[rgba(99,102,241,0.1)] text-[var(--primary-light)] rounded-lg"><Clock className="w-5 h-5" /></div>
                    <span className="text-[10px] text-[var(--primary-light)] font-bold bg-[rgba(99,102,241,0.1)] px-2 py-1 rounded-md">Hours</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-white leading-none">{analytics.metrics.totalHours} <span className="text-sm text-[var(--text-muted)] font-medium">hrs</span></h3>
                  <p className="text-[10px] text-[var(--text-muted)] mt-2 font-semibold uppercase tracking-wider">Total Work Time</p>
                </div>
                
                <div className="p-5 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-[rgba(139,92,246,0.1)] text-[#a78bfa] rounded-lg"><Target className="w-5 h-5" /></div>
                    <span className="text-[10px] text-[#a78bfa] font-bold bg-[rgba(139,92,246,0.1)] px-2 py-1 rounded-md">OKRs</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <h3 className="text-3xl font-extrabold text-white leading-none">{analytics.metrics.okrProgress}%</h3>
                  </div>
                  <div className="w-full bg-[rgba(255,255,255,0.05)] h-1.5 mt-3 rounded-full overflow-hidden">
                    <div className="bg-[#a78bfa] h-full" style={{ width: `${analytics.metrics.okrProgress}%` }}></div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--primary)] opacity-20 blur-2xl rounded-full"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-[rgba(245,158,11,0.1)] text-[var(--warning)] rounded-lg"><TrendingUp className="w-5 h-5" /></div>
                    <span className="text-[10px] text-[var(--warning)] font-bold bg-[rgba(245,158,11,0.1)] px-2 py-1 rounded-md">{analytics.metrics.status}</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-white leading-none">{analytics.metrics.productivityScore}</h3>
                  <p className="text-[10px] text-[var(--text-muted)] mt-2 font-semibold uppercase tracking-wider">Productivity Score</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Timeline Chart */}
                <div className="lg:col-span-2 p-6 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)]">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Productivity Timeline (Hours)</h3>
                      <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Chronological breakdown of logged effort (hours)</p>
                    </div>
                    
                    {/* Daily / Monthly View Toggle */}
                    <div className="flex items-center bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] rounded-xl p-1 gap-1 print:hidden">
                      <button
                        onClick={() => setChartMode('daily')}
                        className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          chartMode === 'daily' 
                            ? 'bg-[var(--primary)] text-white shadow-md' 
                            : 'text-[var(--text-secondary)] hover:text-white'
                        }`}
                      >
                        Daily
                      </button>
                      <button
                        onClick={() => setChartMode('monthly')}
                        className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          chartMode === 'monthly' 
                            ? 'bg-[var(--primary)] text-white shadow-md' 
                            : 'text-[var(--text-secondary)] hover:text-white'
                        }`}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>

                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartMode === 'daily' ? analytics.charts.dailyTimeline : analytics.charts.monthlyTimeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey={chartMode === 'daily' ? "date" : "label"} 
                          stroke="rgba(255,255,255,0.3)" 
                          fontSize={10}
                          tick={chartMode === 'daily' ? (props) => <CustomTick {...props} data={analytics.charts.dailyTimeline} /> : undefined}
                          tickLine={false}
                        />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="hours" stroke="var(--primary-light)" strokeWidth={3} dot={<CustomDot />} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Task Type Pie Chart */}
                <div className="p-6 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)]">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Task Distribution</h3>
                  <div className="h-[250px] w-full flex items-center justify-center">
                    {analytics.charts.taskType.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)]">No data available</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.charts.taskType}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {analytics.charts.taskType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#12122a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </div>

              {/* Work History Table */}
              <div className="p-6 rounded-2xl glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] mt-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6">Recent Work History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[rgba(0,0,0,0.3)]">
                        <th className="p-4 font-bold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
                        <th className="p-4 font-bold text-[var(--text-muted)] uppercase tracking-wider">Client/Project</th>
                        <th className="p-4 font-bold text-[var(--text-muted)] uppercase tracking-wider">Topic</th>
                        <th className="p-4 font-bold text-[var(--text-muted)] uppercase tracking-wider">Time Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                      {analytics.history.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center p-8 text-[var(--text-muted)]">No logs found for this period.</td>
                        </tr>
                      ) : (
                        analytics.history.map((log) => (
                          <tr key={log.id} className="hover:bg-[rgba(255,255,255,0.015)] transition-all">
                            <td className="p-4 text-[var(--text-muted)] font-medium whitespace-nowrap">
                              {new Date(log.date).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-white">{log.client?.name || 'Unknown'}</span>
                              {log.project && <span className="text-[var(--text-muted)] text-[10px] block mt-0.5">{log.project.name}</span>}
                            </td>
                            <td className="p-4 text-[var(--text-secondary)] font-medium max-w-[200px] truncate">
                              {log.topic}
                            </td>
                            <td className="p-4 font-bold text-[var(--primary-light)] whitespace-nowrap">
                              {log.timeSpent} mins
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </>
          )}
        </div>
      </main>
    </div>
  );
}
