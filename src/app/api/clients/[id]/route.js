import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    const isPowerUser = userSession && ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD'].includes(userSession.role);
    if (!isPowerUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { name, logoUrl } = await req.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    const updatedClient = await prisma.client.update({
      where: { id },
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
        action: 'UPDATE_CLIENT',
        details: `Updated client settings: "${updatedClient.name}"`
      }
    });

    return NextResponse.json(updatedClient);
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

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    await prisma.client.delete({ where: { id } });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'DELETE_CLIENT',
        details: `Deleted client: ${client.name} and all associated projects/logs`
      }
    });

    return NextResponse.json({ success: true, message: 'Client deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
