import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId'); // optional
    const isPowerUser = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD'].includes(userSession.role);

    // Calculate 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    let filter = {
      date: { gte: thirtyDaysAgo }
    };

    if (!isPowerUser) {
      filter.userId = userSession.id;
    } else if (employeeId && employeeId !== 'all') {
      filter.userId = employeeId;
    }

    // Fetch work logs for the period
    const logs = await prisma.workLog.findMany({
      where: filter,
      select: {
        date: true,
        timeSpent: true,
        userId: true,
        user: { select: { name: true } }
      }
    });

    // Load office holidays list
    const holidaysFilePath = path.join(process.cwd(), 'src/data/holidays.json');
    let holidays = [];
    try {
      if (fs.existsSync(holidaysFilePath)) {
        holidays = JSON.parse(fs.readFileSync(holidaysFilePath, 'utf8'));
      }
    } catch (err) {
      console.error('Failed to load holidays list:', err);
    }

    // We want to generate a solid 30-day array so days with 0 hours are included
    const timeline = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().slice(0, 10);
      
      const dayOfWeek = d.getUTCDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.includes(dateString);

      timeline.push({
        date: dateString,
        day: d.getUTCDate(),
        isWeekend: isWeekend,
        isHoliday: isHoliday,
        hours: 0,
      });
    }

    // Aggregate hours
    logs.forEach(log => {
      const logDateStr = new Date(log.date).toISOString().slice(0, 10);
      const dayEntry = timeline.find(t => t.date === logDateStr);
      if (dayEntry) {
        dayEntry.hours += log.timeSpent / 60; // convert minutes to hours
      }
    });

    // Round hours
    timeline.forEach(t => {
      t.hours = Math.round(t.hours * 10) / 10;
    });

    return NextResponse.json(timeline);

  } catch (err) {
    console.error('Timeline error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
