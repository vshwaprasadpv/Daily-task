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
    const clientId = searchParams.get('clientId');

    const filter = clientId ? { clientId } : {};

    const projects = await prisma.project.findMany({
      where: filter,
      include: { client: { select: { name: true } } },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(projects);
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

    const { name, clientId } = await req.json();
    if (!name || !clientId) {
      return NextResponse.json({ error: 'Project name and clientId required' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        clientId
      },
      include: {
        client: true
      }
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'CREATE_PROJECT',
        details: `Created project "${project.name}" for client "${project.client.name}"`
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
