import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { action } = await req.json(); // e.g., 'COPY_USERNAME', 'COPY_PASSWORD', 'OPEN_WEBSITE'

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    await prisma.passwordLog.create({
      data: {
        passwordId: id,
        userId: userSession.id,
        action
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
