import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['SUPER_ADMIN', 'ADMIN'].includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all users (only active)
    const allUsers = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, role: true, profilePictureUrl: true, department: true, lastActiveAt: true }
    });

    // Get work logs for metrics (from the start of the month for broad metrics)
    // For live activity, get the absolute latest 20 across everything
    const latestLogs = await prisma.workLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, profilePictureUrl: true, role: true } }, client: true }
    });

    // To calculate today/week/month stats efficiently, let's query counts
    const todayLogs = await prisma.workLog.findMany({
      where: { createdAt: { gte: startOfToday } },
      select: { userId: true, timeSpent: true, clientId: true, projectId: true }
    });

    const weekCount = await prisma.workLog.count({ where: { date: { gte: startOfWeek } } });
    const monthCount = await prisma.workLog.count({ where: { date: { gte: startOfMonth } } });

    // Processing Today's data
    const activeUserIdsToday = new Set();
    const activeClients = new Set();
    const activeProjects = new Set();
    let hoursToday = 0;

    todayLogs.forEach(log => {
      activeUserIdsToday.add(log.userId);
      activeClients.add(log.clientId);
      if (log.projectId) activeProjects.add(log.projectId);
      hoursToday += (log.timeSpent / 60);
    });

    // Employee Status (Based on heartbeat ping - within last 5 minutes = Online)
    let employeesOnlineNow = 0;
    const employeeStatus = allUsers.map(u => {
      const msSinceLastActive = now.getTime() - new Date(u.lastActiveAt).getTime();
      const isOnline = msSinceLastActive <= (5 * 60 * 1000); // 5 minutes threshold
      
      if (isOnline) employeesOnlineNow++;

      return {
        id: u.id,
        name: u.name,
        role: u.role,
        department: u.department,
        profilePictureUrl: u.profilePictureUrl,
        status: isOnline ? 'Online' : 'Offline'
      };
    });

    // Department Comparison (Mock calculation based on user roles/departments)
    const deptStats = {};
    allUsers.forEach(u => {
      const dept = u.department || 'General';
      if (!deptStats[dept]) deptStats[dept] = { name: dept, active: 0, total: 0 };
      deptStats[dept].total++;
      if (activeUserIdsToday.has(u.id)) deptStats[dept].active++;
    });
    const departmentComparison = Object.values(deptStats);

    return NextResponse.json({
      metrics: {
        employeesActiveToday: employeesOnlineNow,
        totalEmployees: allUsers.length,
        tasksToday: todayLogs.length,
        tasksThisWeek: weekCount,
        tasksThisMonth: monthCount,
        hoursToday: Math.round(hoursToday * 10) / 10,
        activeClients: activeClients.size,
        activeProjects: activeProjects.size,
        averageProductivity: 85 // Mocked for now, requires deep OKR aggregation across all users
      },
      liveActivity: latestLogs.map(l => ({
        id: l.id,
        userName: l.user.name,
        userRole: l.user.role,
        userAvatar: l.user.profilePictureUrl,
        taskType: l.taskType,
        topic: l.topic,
        clientName: l.client?.name || 'Unknown',
        timeAgo: Math.floor((new Date() - new Date(l.createdAt)) / 60000) // minutes ago
      })),
      employeeStatus,
      charts: {
        departmentComparison
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
