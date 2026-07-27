import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      include: { projects: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(clients);
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

    const { name, logoUrl } = await req.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Client name required' }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: { 
        name: name.trim(),
        logoUrl: logoUrl || null
      }
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'CREATE_CLIENT',
        details: `Added new client: ${client.name}`
      }
    });

    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
