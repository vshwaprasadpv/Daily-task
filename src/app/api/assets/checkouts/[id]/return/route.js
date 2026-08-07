import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { returnNotes } = body;

    // Fetch the active checkout record
    const checkout = await prisma.assetCheckout.findUnique({
      where: { id },
      include: {
        asset: true,
        user: true
      }
    });

    if (!checkout) {
      return NextResponse.json({ error: 'Checkout log not found' }, { status: 404 });
    }

    if (checkout.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Asset has already been returned' }, { status: 400 });
    }

    // Verify permission: user can only return their own checkouts, unless they are Admin
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userSession.role);
    if (!isAdmin && checkout.userId !== userSession.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Perform transaction to close checkout log and set asset available
    const resolvedCheckout = await prisma.$transaction(async (tx) => {
      // 1. Update checkout record
      const updatedLog = await tx.assetCheckout.update({
        where: { id },
        data: {
          returnedAt: new Date(),
          status: 'RETURNED',
          returnNotes
        },
        include: {
          asset: true
        }
      });

      // 2. Update asset status
      await tx.asset.update({
        where: { id: checkout.assetId },
        data: { status: 'AVAILABLE' }
      });

      return updatedLog;
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'ASSET_RETURN',
        details: `Returned asset "${resolvedCheckout.asset.name}" from employee ${checkout.user.name}`
      }
    });

    return NextResponse.json(resolvedCheckout);
  } catch (err) {
    console.error('Failed to return asset:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
