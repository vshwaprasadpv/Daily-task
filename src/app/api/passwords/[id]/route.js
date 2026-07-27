import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession || !['SUPER_ADMIN', 'ADMIN'].includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();

    const { 
      platformName, websiteUrl, username, password, category, 
      clientId, notes, expiryDate, twoFactorEnabled, attachmentUrl, status,
      roles, users 
    } = data;

    const updateData = {
      platformName,
      websiteUrl,
      username,
      category,
      clientId: clientId || null,
      notes,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      twoFactorEnabled,
      attachmentUrl,
      status
    };

    if (password) {
      updateData.passwordHash = encrypt(password);
    }

    // Handle relations update
    const record = await prisma.passwordRecord.update({
      where: { id },
      data: updateData
    });

    if (roles !== undefined) {
      await prisma.passwordRoleAccess.deleteMany({ where: { passwordId: id } });
      if (roles.length > 0) {
        await prisma.passwordRoleAccess.createMany({
          data: roles.map(r => ({ passwordId: id, role: r }))
        });
      }
    }

    if (users !== undefined) {
      await prisma.passwordUserAccess.deleteMany({ where: { passwordId: id } });
      if (users.length > 0) {
        await prisma.passwordUserAccess.createMany({
          data: users.map(uId => ({ passwordId: id, userId: uId }))
        });
      }
    }

    // Log the update
    await prisma.passwordLog.create({
      data: {
        passwordId: id,
        userId: userSession.id,
        action: 'UPDATE'
      }
    });

    return NextResponse.json(record);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    // Only SUPER_ADMIN can delete passwords according to requirements
    if (!userSession || userSession.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Only Super Admin can delete.' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.passwordRecord.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
