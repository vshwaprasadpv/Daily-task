import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const userSession = await getAuthenticatedUser();
    
    // If not authenticated, we just return a 200 without doing anything
    if (!userSession) {
      return NextResponse.json({ success: true, message: 'Unauthenticated ping ignored' });
    }

    // Update the lastActiveAt timestamp
    await prisma.user.update({
      where: { id: userSession.id },
      data: { lastActiveAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Ping failed:', err);
    // Don't leak DB errors on a simple heartbeat endpoint
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
