import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userSession.role);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // e.g. UNDER_REPAIR, RESOLVED
    const assetId = searchParams.get('assetId');

    const where = {};
    if (status) {
      where.status = status;
    }
    if (assetId) {
      where.assetId = assetId;
    }

    const logs = await prisma.assetMaintenance.findMany({
      where,
      include: {
        asset: true
      },
      orderBy: { sentAt: 'desc' }
    });

    return NextResponse.json(logs);
  } catch (err) {
    console.error('Failed to get maintenance logs:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userSession.role);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { assetId, issue, cost, notes } = body;

    if (!assetId || !issue) {
      return NextResponse.json({ error: 'Asset ID and Issue description are required' }, { status: 400 });
    }

    // Verify asset exists and is available
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (asset.status === 'UNDER_MAINTENANCE') {
      return NextResponse.json({ error: 'Asset is already under maintenance' }, { status: 400 });
    }

    // Perform transaction to create maintenance log and update asset status
    const maintenance = await prisma.$transaction(async (tx) => {
      // 1. Create repair log
      const log = await tx.assetMaintenance.create({
        data: {
          assetId,
          issue,
          cost: cost ? parseFloat(cost) : null,
          notes,
          status: 'UNDER_REPAIR'
        },
        include: {
          asset: true
        }
      });

      // 2. Update asset status
      await tx.asset.update({
        where: { id: assetId },
        data: { status: 'UNDER_MAINTENANCE' }
      });

      return log;
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'ASSET_MAINTENANCE_START',
        details: `Sent asset "${maintenance.asset.name}" for repair/maintenance (Issue: ${issue})`
      }
    });

    return NextResponse.json(maintenance, { status: 201 });
  } catch (err) {
    console.error('Failed to log maintenance:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
