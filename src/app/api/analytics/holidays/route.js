import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const holidaysFilePath = path.join(process.cwd(), 'src/data/holidays.json');

function readHolidays() {
  try {
    if (!fs.existsSync(holidaysFilePath)) {
      return [];
    }
    const data = fs.readFileSync(holidaysFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read holidays:', err);
    return [];
  }
}

function writeHolidays(holidays) {
  try {
    fs.writeFileSync(holidaysFilePath, JSON.stringify(holidays, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to write holidays:', err);
    return false;
  }
}

export async function GET(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const holidays = readHolidays();
    return NextResponse.json(holidays);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userSession.role);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { date } = await req.json();
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date format (expected YYYY-MM-DD)' }, { status: 400 });
    }

    const holidays = readHolidays();
    if (!holidays.includes(date)) {
      holidays.push(date);
      holidays.sort();
      writeHolidays(holidays);
    }

    return NextResponse.json({ success: true, holidays });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userSession.role);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { date } = await req.json();
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    let holidays = readHolidays();
    holidays = holidays.filter(d => d !== date);
    writeHolidays(holidays);

    return NextResponse.json({ success: true, holidays });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
