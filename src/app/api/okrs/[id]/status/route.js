import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const okr = await prisma.okr.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } }
    });

    if (!okr) {
      return NextResponse.json({ error: 'OKR not found' }, { status: 404 });
    }

    // Only allow the assigned user or an admin to change the status
    const isPowerUser = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD'].includes(userSession.role);
    if (!isPowerUser && okr.user.id !== userSession.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedOkr = await prisma.okr.update({
      where: { id },
      data: { status }
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'UPDATE_OKR_STATUS',
        details: `Changed OKR status to ${status} for "${okr.objective}"`
      }
    });

    return NextResponse.json(updatedOkr);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
