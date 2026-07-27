import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export async function GET() {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession || !ADMIN_ROLES.includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        employeeId: true,
        reportingManager: true,
        joiningDate: true,
        status: true,
        profilePictureUrl: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(users);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession || !ADMIN_ROLES.includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      name,
      email,
      password,
      phone,
      role,
      department,
      employeeId,
      reportingManager,
      joiningDate
    } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required credentials' }, { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone || null,
        role: role || 'GRAPHIC_DESIGNER',
        department: department || null,
        employeeId: employeeId || null,
        reportingManager: reportingManager || null,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        status: 'ACTIVE'
      }
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'CREATE_USER',
        details: `Created new ${role} account: ${name} (${email})`
      }
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
