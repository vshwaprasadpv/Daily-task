import { NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const backupsDir = path.join(process.cwd(), 'backups');

export async function GET(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession || !['SUPER_ADMIN', 'ADMIN'].includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify password from header
    const verifyPwd = req.headers.get('x-verify-password');
    if (!verifyPwd) {
      return NextResponse.json({ error: 'Password verification required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userSession.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isValid = await verifyPassword(verifyPwd, user.passwordHash);
    if (!isValid) return NextResponse.json({ error: 'Invalid password. Access denied.' }, { status: 403 });

    const { id } = await params; // Next.js 15+ asynchronous params
    
    // Security check to prevent path traversal
    const safeFilename = path.basename(id);
    const filePath = path.join(backupsDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
    }

    const stats = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);

    // Send back file download response
    return new NextResponse(fileStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': stats.size.toString(),
        'Content-Disposition': `attachment; filename="${safeFilename}"`
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession || !['SUPER_ADMIN', 'ADMIN'].includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify password from header
    const verifyPwd = req.headers.get('x-verify-password');
    if (!verifyPwd) {
      return NextResponse.json({ error: 'Password verification required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userSession.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isValid = await verifyPassword(verifyPwd, user.passwordHash);
    if (!isValid) return NextResponse.json({ error: 'Invalid password. Action denied.' }, { status: 403 });

    const { id } = await params;
    const safeFilename = path.basename(id);
    const filePath = path.join(backupsDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
    }

    fs.unlinkSync(filePath);

    // Log deletion activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'DELETE_BACKUP',
        details: `Deleted database backup file: ${safeFilename}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
