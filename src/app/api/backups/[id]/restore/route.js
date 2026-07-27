import { NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const extract = require('extract-zip').default || require('extract-zip');

export const dynamic = 'force-dynamic';

const backupsDir = path.join(process.cwd(), 'backups');

export async function POST(req, { params }) {
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
    if (!isValid) return NextResponse.json({ error: 'Invalid password. Restore denied.' }, { status: 403 });

    const { id } = await params;
    const safeFilename = path.basename(id);
    const filePath = path.join(backupsDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
    }

    // 1. Disconnect Prisma connection to release database file locks
    await prisma.$disconnect();

    const targetDir = path.join(process.cwd(), 'prisma');
    const dbPath = path.join(targetDir, 'dev.db');

    // 2. Clean up temporary SQLite journal files to prevent corruption
    const journalFile = `${dbPath}-journal`;
    if (fs.existsSync(journalFile)) {
      try { fs.unlinkSync(journalFile); } catch (e) { console.warn('Could not delete journal:', e); }
    }
    const walFile = `${dbPath}-wal`;
    if (fs.existsSync(walFile)) {
      try { fs.unlinkSync(walFile); } catch (e) { console.warn('Could not delete wal:', e); }
    }
    const shmFile = `${dbPath}-shm`;
    if (fs.existsSync(shmFile)) {
      try { fs.unlinkSync(shmFile); } catch (e) { console.warn('Could not delete shm:', e); }
    }

    // 3. Extract the backup zip file into prisma/ (overwriting dev.db)
    await extract(filePath, { dir: targetDir });

    // 4. Log the restore activity (This will execute on the restored database!)
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'RESTORE_BACKUP',
        details: `Restored database from backup: ${safeFilename}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Database restore failed:', err);
    return NextResponse.json({ error: `Restore failed: ${err.message}` }, { status: 500 });
  }
}
