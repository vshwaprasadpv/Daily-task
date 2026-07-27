import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    const isPowerUser = userSession && ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD'].includes(userSession.role);
    if (!isPowerUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { objective, targetYear, targetPeriod, startDate, endDate, keyResults = [] } = await req.json();

    // Use transaction to update OKR and recreate/update its key results safely
    const updatedOkr = await prisma.$transaction(async (tx) => {
      // 1. Update main OKR info
      const okr = await tx.okr.update({
        where: { id },
        data: {
          objective,
          targetYear: parseInt(targetYear, 10),
          targetPeriod,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined
        }
      });

      // 2. Clear old key results
      await tx.keyResult.deleteMany({ where: { okrId: id } });

      // 3. Create new key results (carrying forward original targets or custom adjustments)
      if (keyResults.length > 0) {
        await tx.keyResult.createMany({
          data: keyResults.map(kr => ({
            okrId: id,
            title: kr.title,
            target: parseInt(kr.target, 10),
            current: parseInt(kr.current || 0, 10),
            unit: kr.unit || 'units'
          }))
        });
      }

      return tx.okr.findUnique({
        where: { id },
        include: { keyResults: true, user: { select: { name: true } } }
      });
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'UPDATE_OKR',
        details: `Updated OKR objective for ${updatedOkr.user.name}: "${objective}"`
      }
    });

    return NextResponse.json(updatedOkr);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    const isPowerUser = userSession && ['SUPER_ADMIN', 'ADMIN'].includes(userSession.role);
    if (!isPowerUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const okr = await prisma.okr.findUnique({
      where: { id },
      include: { user: { select: { name: true } } }
    });

    if (!okr) {
      return NextResponse.json({ error: 'OKR not found' }, { status: 404 });
    }

    await prisma.okr.delete({ where: { id } });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'DELETE_OKR',
        details: `Deleted OKR assigned to ${okr.user.name}: "${okr.objective}"`
      }
    });

    return NextResponse.json({ success: true, message: 'OKR deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
