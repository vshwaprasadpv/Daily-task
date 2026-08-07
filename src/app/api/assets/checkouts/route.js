import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // e.g. ACTIVE, RETURNED
    const assetId = searchParams.get('assetId');

    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userSession.role);

    const where = {};
    if (!isAdmin) {
      // Normal users can only see their own checkout history
      where.userId = userSession.id;
    }
    if (status) {
      where.status = status;
    }
    if (assetId) {
      where.assetId = assetId;
    }

    const checkouts = await prisma.assetCheckout.findMany({
      where,
      include: {
        asset: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: true
          }
        }
      },
      orderBy: { checkedOutAt: 'desc' }
    });

    return NextResponse.json(checkouts);
  } catch (err) {
    console.error('Failed to get checkouts:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { assetId, expectedReturnAt, checkoutNotes, userId } = body;

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    // Verify asset availability
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (asset.status !== 'AVAILABLE') {
      return NextResponse.json({ error: `Asset is currently ${asset.status.replace('_', ' ').toLowerCase()}` }, { status: 400 });
    }

    // Determine target checkout user (admins can check out on behalf of someone else)
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userSession.role);
    const targetUserId = (isAdmin && userId) ? userId : userSession.id;

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Perform transaction to create checkout log and update asset status
    const checkout = await prisma.$transaction(async (tx) => {
      // 1. Create checkout log
      const log = await tx.assetCheckout.create({
        data: {
          assetId,
          userId: targetUserId,
          expectedReturnAt: expectedReturnAt ? new Date(expectedReturnAt) : null,
          checkoutNotes,
          status: 'ACTIVE'
        },
        include: {
          asset: true
        }
      });

      // 2. Update asset status
      await tx.asset.update({
        where: { id: assetId },
        data: { status: 'CHECKED_OUT' }
      });

      return log;
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'ASSET_CHECKOUT',
        details: `Checked out asset "${checkout.asset.name}" to employee ${targetUser.name}`
      }
    });

    return NextResponse.json(checkout, { status: 201 });
  } catch (err) {
    console.error('Failed to checkout asset:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
