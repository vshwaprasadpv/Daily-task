import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save path inside public/uploads folder
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true });

    // Generate unique name
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${safeName}`;
    const filePath = join(uploadDir, filename);

    // Write file to disk
    await writeFile(filePath, buffer);
    console.log(`✅ File saved successfully: ${filePath}`);

    // Return the relative public path
    const url = `/uploads/${filename}`;
    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error('File upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
