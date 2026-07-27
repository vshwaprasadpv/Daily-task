import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { verifyPassword } from '@/lib/auth'; // Ensure this exists or mock a simple comparison

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { loginPassword } = await req.json();

    if (!loginPassword) {
      return NextResponse.json({ error: 'Login password required to verify identity' }, { status: 400 });
    }

    // Verify the user's login password
    const user = await prisma.user.findUnique({ where: { id: userSession.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isValid = await verifyPassword(loginPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid login password' }, { status: 403 });
    }

    // Fetch the target password record
    const passwordRecord = await prisma.passwordRecord.findUnique({
      where: { id },
      include: {
        roleAccess: true,
        userAccess: true,
      }
    });

    if (!passwordRecord) return NextResponse.json({ error: 'Password record not found' }, { status: 404 });

    // Check if user has access
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userSession.role);
    const hasRoleAccess = passwordRecord.roleAccess.some(r => r.role === userSession.role);
    const hasUserAccess = passwordRecord.userAccess.some(u => u.userId === userSession.id);

    if (!isAdmin && !hasRoleAccess && !hasUserAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (passwordRecord.status !== 'ACTIVE' && !isAdmin) {
      return NextResponse.json({ error: 'Password record is disabled' }, { status: 403 });
    }

    // Decrypt the password
    const decrypted = decrypt(passwordRecord.passwordHash);
    if (!decrypted) {
      return NextResponse.json({ error: 'Failed to decrypt password' }, { status: 500 });
    }

    // Log the reveal action
    await prisma.passwordLog.create({
      data: {
        passwordId: id,
        userId: userSession.id,
        action: 'REVEAL'
      }
    });

    return NextResponse.json({ password: decrypted });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
