import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Security: Only allow users to view their own, unless admin
    if (userSession.id !== id && !['SUPER_ADMIN', 'ADMIN'].includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || 'month';

    // Get time boundaries
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    // Fetch user's data
    const workLogs = await prisma.workLog.findMany({
      where: { userId: id },
      include: { client: true, project: true },
      orderBy: { date: 'desc' }
    });

    const okrs = await prisma.okr.findMany({
      where: { userId: id },
      include: { keyResults: true }
    });

    // Compute Metrics
    let tasksToday = 0;
    let tasksThisWeek = 0;
    let tasksThisMonth = 0;
    let totalHours = 0;

    const taskTypeDistribution = {};
    const clientDistribution = {};
    const projectDistribution = {};
    
    // Group by Date for timeline (last 30 days)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const dailyTimelineMap = {};

    let filterBound = new Date(0);
    if (timeframe === 'today') filterBound = startOfToday;
    else if (timeframe === 'week') filterBound = startOfWeek;
    else if (timeframe === 'month') filterBound = startOfMonth;
    else if (timeframe === 'quarter') filterBound = startOfQuarter;
    else if (timeframe === 'year') filterBound = startOfYear;

    const filteredLogs = workLogs.filter(log => new Date(log.date) >= filterBound);

    filteredLogs.forEach(log => {
      const logDate = new Date(log.date);
      
      if (logDate >= startOfToday) tasksToday++;
      if (logDate >= startOfWeek) tasksThisWeek++;
      if (logDate >= startOfMonth) tasksThisMonth++;
      
      totalHours += (log.timeSpent / 60);

      // Task Type
      taskTypeDistribution[log.taskType] = (taskTypeDistribution[log.taskType] || 0) + 1;
      
      // Client
      const cName = log.client?.name || 'Unknown';
      clientDistribution[cName] = (clientDistribution[cName] || 0) + (log.timeSpent / 60);

      // Project
      if (log.project) {
        const pName = log.project.name;
        projectDistribution[pName] = (projectDistribution[pName] || 0) + (log.timeSpent / 60);
      }

      // Timeline (only last 30 days)
      if (logDate >= thirtyDaysAgo) {
        const dateStr = logDate.toISOString().slice(0, 10);
        dailyTimelineMap[dateStr] = (dailyTimelineMap[dateStr] || 0) + (log.timeSpent / 60);
      }
    });

    // Formatting for Recharts
    const taskTypeChart = Object.keys(taskTypeDistribution).map(k => ({ name: k, value: taskTypeDistribution[k] }));
    const clientChart = Object.keys(clientDistribution).map(k => ({ name: k, hours: Math.round(clientDistribution[k]*10)/10 }));
    const projectChart = Object.keys(projectDistribution).map(k => ({ name: k, hours: Math.round(projectDistribution[k]*10)/10 }));
    
    // Fill empty days for timeline
    const dailyTimeline = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      dailyTimeline.push({
        date: dateStr,
        hours: Math.round((dailyTimelineMap[dateStr] || 0)*10)/10
      });
    }

    // OKR Calculation
    let totalOkrs = 0;
    let completedOkrs = 0;
    okrs.forEach(okr => {
      okr.keyResults.forEach(kr => {
        totalOkrs += kr.target;
        completedOkrs += kr.current;
      });
    });
    const okrProgress = totalOkrs > 0 ? Math.min(100, Math.round((completedOkrs / totalOkrs) * 100)) : 0;

    // Working Days
    const uniqueDays = new Set(filteredLogs.map(l => new Date(l.date).toISOString().slice(0, 10))).size;
    const avgDailyHours = uniqueDays > 0 ? (totalHours / uniqueDays) : 0;

    // Artificial Productivity Score (0-100) based on hours and okrs
    const prodScore = Math.min(100, Math.round((okrProgress * 0.6) + (avgDailyHours > 6 ? 40 : (avgDailyHours/6)*40)));

    return NextResponse.json({
      metrics: {
        tasksToday,
        tasksThisWeek,
        tasksThisMonth,
        totalTasks: filteredLogs.length,
        totalHours: Math.round(totalHours),
        avgDailyHours: Math.round(avgDailyHours * 10) / 10,
        okrProgress,
        productivityScore: prodScore,
        status: prodScore > 80 ? 'Excellent' : prodScore > 50 ? 'Good' : 'Needs Attention'
      },
      charts: {
        taskType: taskTypeChart,
        clientHours: clientChart,
        projectHours: projectChart,
        dailyTimeline
      },
      history: filteredLogs.slice(0, 50) // Return last 50 for table
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
