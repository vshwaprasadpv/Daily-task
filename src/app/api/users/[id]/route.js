import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export async function PUT(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession || !ADMIN_ROLES.includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const {
      name,
      email,
      password,
      phone,
      role,
      department,
      employeeId,
      reportingManager,
      joiningDate,
      status
    } = await req.json();

    const updateData = {
      name,
      email,
      phone: phone || null,
      role,
      department: department || null,
      employeeId: employeeId || null,
      reportingManager: reportingManager || null,
      joiningDate: joiningDate ? new Date(joiningDate) : null,
      status
    };

    if (password && password.trim() !== '') {
      updateData.passwordHash = bcrypt.hashSync(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'UPDATE_USER',
        details: `Updated details for account: ${updatedUser.name} (${updatedUser.email})`
      }
    });

    const { passwordHash: _, ...safeUser } = updatedUser;
    return NextResponse.json(safeUser);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession || !ADMIN_ROLES.includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'DELETE_USER',
        details: `Deleted user account: ${user.name} (${user.email})`
      }
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
