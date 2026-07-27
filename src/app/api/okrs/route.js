import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const isPowerUser = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD'].includes(userSession.role);
    
    let filter = {};
    if (!isPowerUser) {
      filter.userId = userSession.id;
    } else if (userId) {
      filter.userId = userId;
    }

    const okrs = await prisma.okr.findMany({
      where: filter,
      include: {
        user: { select: { name: true, role: true, department: true } },
        keyResults: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate aggregated overall progress per OKR
    const okrsWithProgress = okrs.map(okr => {
      const krs = okr.keyResults;
      let totalProgress = 0;
      if (krs.length > 0) {
        const sum = krs.reduce((acc, kr) => {
          const ratio = kr.target > 0 ? kr.current / kr.target : 0;
          return acc + Math.min(ratio, 1.0);
        }, 0);
        totalProgress = Math.round((sum / krs.length) * 100);
      }
      return {
        ...okr,
        progress: totalProgress
      };
    });

    return NextResponse.json(okrsWithProgress);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const userSession = await getAuthenticatedUser();
    const isPowerUser = userSession && ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD'].includes(userSession.role);
    if (!isPowerUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { objective, userId, targetYear, targetPeriod, startDate, endDate, keyResults = [] } = await req.json();

    if (!objective || !userId || !targetYear || !targetPeriod) {
      return NextResponse.json({ error: 'Missing objective details' }, { status: 400 });
    }

    const okr = await prisma.okr.create({
      data: {
        objective,
        userId,
        targetYear: parseInt(targetYear, 10),
        targetPeriod,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(),
        keyResults: {
          create: keyResults.map(kr => ({
            title: kr.title,
            target: parseInt(kr.target, 10),
            current: 0,
            unit: kr.unit || 'units'
          }))
        }
      },
      include: {
        keyResults: true,
        user: { select: { name: true } }
      }
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'CREATE_OKR',
        details: `Assigned new OKR to ${okr.user.name}: "${objective}"`
      }
    });

    return NextResponse.json(okr, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
