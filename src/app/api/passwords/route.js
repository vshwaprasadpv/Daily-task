import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userSession.role);

    // If admin, return all passwords
    let passwords;
    if (isAdmin) {
      passwords = await prisma.passwordRecord.findMany({
        include: {
          client: true,
          roleAccess: true,
          userAccess: true,
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Return only passwords assigned to the user's role OR directly to the user
      passwords = await prisma.passwordRecord.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { roleAccess: { some: { role: userSession.role } } },
            { userAccess: { some: { userId: userSession.id } } }
          ]
        },
        include: {
          client: true,
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Strip passwordHash from the payload. Users must hit /reveal to get it.
    const safePasswords = passwords.map(p => {
      const { passwordHash, ...rest } = p;
      return rest;
    });

    return NextResponse.json(safePasswords);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession || !['SUPER_ADMIN', 'ADMIN'].includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { 
      platformName, websiteUrl, username, password, category, 
      clientId, notes, expiryDate, twoFactorEnabled, attachmentUrl, 
      roles, users 
    } = data;

    if (!platformName || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const passwordHash = encrypt(password);

    const record = await prisma.passwordRecord.create({
      data: {
        platformName,
        websiteUrl,
        username,
        passwordHash,
        category: category || 'Other',
        clientId: clientId || null,
        notes,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        twoFactorEnabled: !!twoFactorEnabled,
        attachmentUrl,
        status: 'ACTIVE',
        createdById: userSession.id,
        roleAccess: {
          create: roles?.map(r => ({ role: r })) || []
        },
        userAccess: {
          create: users?.map(uId => ({ userId: uId })) || []
        }
      }
    });

    return NextResponse.json(record);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
