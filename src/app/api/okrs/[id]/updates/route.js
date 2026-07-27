import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const updates = await prisma.okrUpdate.findMany({
      where: { okrId: id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(updates);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { comment, description, fileUrl } = await req.json();

    const okr = await prisma.okr.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } }
    });

    if (!okr) return NextResponse.json({ error: 'OKR not found' }, { status: 404 });

    const isPowerUser = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD'].includes(userSession.role);
    if (!isPowerUser && okr.user.id !== userSession.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const newUpdate = await prisma.okrUpdate.create({
      data: {
        okrId: id,
        comment,
        description,
        fileUrl
      }
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'ADD_OKR_UPDATE',
        details: `Added a progress update to OKR "${okr.objective}"`
      }
    });

    return NextResponse.json(newUpdate, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
