import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;

    const assets = await prisma.asset.findMany({
      where,
      include: {
        checkouts: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                department: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(assets);
  } catch (err) {
    console.error('Failed to get assets:', err);
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
    const { name, category, serialNumber, modelNumber, location, notes, imageUrl } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and Category are required' }, { status: 400 });
    }

    const newAsset = await prisma.asset.create({
      data: {
        name,
        category,
        serialNumber,
        modelNumber,
        location,
        imageUrl,
        notes,
        status: 'AVAILABLE'
      }
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'ASSET_CREATE',
        details: `Added new asset "${name}" (S/N: ${serialNumber || 'N/A'})`
      }
    });

    return NextResponse.json(newAsset, { status: 201 });
  } catch (err) {
    console.error('Failed to create asset:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
