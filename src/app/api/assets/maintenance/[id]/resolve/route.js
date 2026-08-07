import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userSession.role);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { cost, notes, retireAsset } = body;

    // Fetch the active maintenance record
    const maintenance = await prisma.assetMaintenance.findUnique({
      where: { id },
      include: {
        asset: true
      }
    });

    if (!maintenance) {
      return NextResponse.json({ error: 'Maintenance record not found' }, { status: 404 });
    }

    if (maintenance.status !== 'UNDER_REPAIR') {
      return NextResponse.json({ error: 'Repair has already been resolved' }, { status: 400 });
    }

    const finalStatus = retireAsset ? 'RETIRED' : 'AVAILABLE';

    // Perform transaction to resolve repair and set asset back online
    const resolvedLog = await prisma.$transaction(async (tx) => {
      // 1. Update maintenance log
      const updatedLog = await tx.assetMaintenance.update({
        where: { id },
        data: {
          resolvedAt: new Date(),
          status: 'RESOLVED',
          cost: cost !== undefined ? parseFloat(cost) : maintenance.cost,
          notes
        },
        include: {
          asset: true
        }
      });

      // 2. Update asset status
      await tx.asset.update({
        where: { id: maintenance.assetId },
        data: { status: finalStatus }
      });

      return updatedLog;
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'ASSET_MAINTENANCE_RESOLVE',
        details: `Resolved maintenance for asset "${resolvedLog.asset.name}" (Status: ${finalStatus})`
      }
    });

    return NextResponse.json(resolvedLog);
  } catch (err) {
    console.error('Failed to resolve maintenance:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
