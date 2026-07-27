import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const {
      date,
      clientId,
      projectId,
      taskType,
      topic,
      description,
      timeSpent,
      priority,
      attachmentUrl,
      notes
    } = await req.json();

    if (!clientId || !taskType || !topic) {
      return NextResponse.json({ error: 'Missing required work log parameters' }, { status: 400 });
    }

    // Verify ownership or admin
    const existingLog = await prisma.workLog.findUnique({ where: { id } });
    if (!existingLog) {
      return NextResponse.json({ error: 'Work log not found' }, { status: 404 });
    }

    if (existingLog.userId !== userSession.id && !['SUPER_ADMIN', 'ADMIN'].includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedLog = await prisma.workLog.update({
      where: { id },
      data: {
        date: date ? new Date(date) : new Date(),
        clientId,
        projectId: projectId || null,
        taskType,
        topic,
        description: description || null,
        timeSpent: timeSpent ? parseInt(timeSpent, 10) : 0,
        priority: priority || 'MEDIUM',
        attachmentUrl: attachmentUrl || null,
        notes: notes || null
      },
      include: {
        client: true,
        project: true
      }
    });

    return NextResponse.json(updatedLog);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingLog = await prisma.workLog.findUnique({ where: { id } });
    if (!existingLog) {
      return NextResponse.json({ error: 'Work log not found' }, { status: 404 });
    }

    if (existingLog.userId !== userSession.id && !['SUPER_ADMIN', 'ADMIN'].includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.workLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
