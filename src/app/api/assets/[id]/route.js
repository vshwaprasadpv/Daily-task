import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userSession.role);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { name, category, serialNumber, modelNumber, location, imageUrl, status, notes } = body;

    // Check if asset exists
    const existingAsset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!existingAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingAsset.name,
        category: category !== undefined ? category : existingAsset.category,
        serialNumber: serialNumber !== undefined ? serialNumber : existingAsset.serialNumber,
        modelNumber: modelNumber !== undefined ? modelNumber : existingAsset.modelNumber,
        location: location !== undefined ? location : existingAsset.location,
        imageUrl: imageUrl !== undefined ? imageUrl : existingAsset.imageUrl,
        status: status !== undefined ? status : existingAsset.status,
        notes: notes !== undefined ? notes : existingAsset.notes
      }
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'ASSET_UPDATE',
        details: `Updated asset "${updatedAsset.name}" details`
      }
    });

    return NextResponse.json(updatedAsset);
  } catch (err) {
    console.error('Failed to update asset:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userSession.role);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    const existingAsset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!existingAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    await prisma.asset.delete({
      where: { id }
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'ASSET_DELETE',
        details: `Deleted asset "${existingAsset.name}"`
      }
    });

    return NextResponse.json({ success: true, message: 'Asset deleted successfully' });
  } catch (err) {
    console.error('Failed to delete asset:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
