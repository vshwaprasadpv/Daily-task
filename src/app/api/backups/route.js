import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { ZipArchive } from 'archiver';

export const dynamic = 'force-dynamic';

const backupsDir = path.join(process.cwd(), 'backups');

export async function GET() {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession || !['SUPER_ADMIN', 'ADMIN'].includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const files = fs.readdirSync(backupsDir);
    const backups = files
      .filter(f => f.endsWith('.zip'))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        return {
          id: file,
          filename: file,
          createdAt: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json(backups);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession || !['SUPER_ADMIN', 'ADMIN'].includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Database file not found' }, { status: 404 });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup-${timestamp}.zip`;
    const backupPath = path.join(backupsDir, backupFilename);

    // Create zip archive
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(backupPath);
      const archive = new ZipArchive({ zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', err => reject(err));

      archive.pipe(output);
      archive.file(dbPath, { name: 'dev.db' });
      archive.finalize();
    });

    // Log the backup activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'CREATE_BACKUP',
        details: `Created database backup: ${backupFilename}`
      }
    });

    return NextResponse.json({ success: true, filename: backupFilename });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
