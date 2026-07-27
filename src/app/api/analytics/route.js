import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession || !['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD'].includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Get aggregate counts ────────────────────────────────
    const totalUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const totalWorkLogs = await prisma.workLog.count();
    const totalClients = await prisma.client.count();

    // ── Query all work logs with metadata ──────────────────
    const allLogs = await prisma.workLog.findMany({
      include: {
        user: { select: { name: true, role: true, department: true } },
        client: { select: { name: true } },
        project: { select: { name: true } }
      }
    });

    // ── 1. Hourly tracking & Overload check (Threshold: 160h/month = 9600m) ────
    const userTimeMap = {};
    allLogs.forEach(log => {
      if (!userTimeMap[log.userId]) {
        userTimeMap[log.userId] = {
          name: log.user.name,
          role: log.user.role,
          totalMinutes: 0
        };
      }
      userTimeMap[log.userId].totalMinutes += log.timeSpent;
    });

    const employeeWorkloads = Object.values(userTimeMap).map(u => ({
      name: u.name,
      role: u.role,
      hours: Math.round(u.totalMinutes / 60),
      isOverloaded: u.totalMinutes > 9600 // >160 hours
    })).sort((a, b) => b.hours - a.hours);

    // ── 2. Client Effort breakdown (by logged hours) ────────
    const clientMap = {};
    allLogs.forEach(log => {
      const cName = log.client.name;
      if (!clientMap[cName]) clientMap[cName] = 0;
      clientMap[cName] += log.timeSpent;
    });

    const clientDistribution = Object.entries(clientMap).map(([name, mins]) => ({
      name,
      hours: Math.round(mins / 60)
    })).sort((a, b) => b.hours - a.hours);

    // ── 3. Creative Task Type Distribution ──────────────────
    const taskTypeMap = {};
    allLogs.forEach(log => {
      if (!taskTypeMap[log.taskType]) taskTypeMap[log.taskType] = 0;
      taskTypeMap[log.taskType] += 1;
    });

    const taskTypeDistribution = Object.entries(taskTypeMap).map(([type, count]) => ({
      type,
      count
    })).sort((a, b) => b.count - a.count);

    // ── 4. Role Specific Output Rankings ───────────────────
    const designerOutput = {};
    const editorOutput = {};

    allLogs.forEach(log => {
      const role = log.user.role;
      const name = log.user.name;

      if (['GRAPHIC_DESIGNER', 'UI_DESIGNER'].includes(role)) {
        if (!designerOutput[name]) designerOutput[name] = 0;
        designerOutput[name] += 1;
      }
      if (['VIDEO_EDITOR', 'MOTION_DESIGNER'].includes(role)) {
        if (!editorOutput[name]) editorOutput[name] = 0;
        editorOutput[name] += 1;
      }
    });

    const designerRankings = Object.entries(designerOutput).map(([name, count]) => ({
      name,
      completedAssets: count
    })).sort((a, b) => b.completedAssets - a.completedAssets);

    const editorRankings = Object.entries(editorOutput).map(([name, count]) => ({
      name,
      completedVideos: count
    })).sort((a, b) => b.completedVideos - a.completedVideos);

    // ── 5. OKR Performance metrics ──────────────────────────
    const okrs = await prisma.okr.findMany({
      include: { keyResults: true }
    });

    let totalKrCount = 0;
    let totalKrProgress = 0;
    okrs.forEach(okr => {
      okr.keyResults.forEach(kr => {
        totalKrCount++;
        totalKrProgress += kr.target > 0 ? (kr.current / kr.target) : 0;
      });
    });

    const okrAvgProgress = totalKrCount > 0 
      ? Math.round((totalKrProgress / totalKrCount) * 100) 
      : 0;

    // ── 6. Log activity feed ────────────────────────────────
    const recentActivities = await prisma.activity.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json({
      summary: {
        totalUsers,
        totalWorkLogs,
        totalClients,
        okrAvgProgress
      },
      employeeWorkloads,
      clientDistribution,
      taskTypeDistribution,
      rankings: {
        designers: designerRankings,
        editors: editorRankings
      },
      recentActivities
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
