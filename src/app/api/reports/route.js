import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

async function getFilteredLogs(timeframe, department) {
  const now = new Date();
  let dateLimit = new Date();

  switch (timeframe) {
    case 'weekly':
      dateLimit.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      dateLimit.setMonth(now.getMonth() - 1);
      break;
    case 'quarterly':
      dateLimit.setMonth(now.getMonth() - 3);
      break;
    case 'half-yearly':
      dateLimit.setMonth(now.getMonth() - 6);
      break;
    case 'yearly':
      dateLimit.setFullYear(now.getFullYear() - 1);
      break;
    default: // 'daily'
      dateLimit.setHours(0, 0, 0, 0);
  }

  let filter = {
    date: { gte: dateLimit }
  };

  if (department && department !== 'all') {
    filter.user = { department };
  }

  return prisma.workLog.findMany({
    where: filter,
    include: {
      user: { select: { name: true, role: true, department: true } },
      client: { select: { name: true } },
      project: { select: { name: true } }
    },
    orderBy: { date: 'desc' }
  });
}

export async function GET(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession || !['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD'].includes(userSession.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'pdf';
    const timeframe = searchParams.get('timeframe') || 'weekly';
    const department = searchParams.get('department') || 'all';

    const logs = await getFilteredLogs(timeframe, department);

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Creative Productivity Platform';
      const worksheet = workbook.addWorksheet('Productivity Report');

      // Title Card
      worksheet.mergeCells('A1:H1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `Creative Completed Work Report (${timeframe.toUpperCase()})`;
      titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1B4B' } };
      titleCell.alignment = { horizontal: 'center' };

      worksheet.getRow(2).values = [
        'Generated:',
        new Date().toLocaleString('en-IN'),
        '',
        'Department:',
        department === 'all' ? 'All' : department,
        '',
        'Total Work Logs:',
        logs.length
      ];

      // Headers
      const headers = ['#', 'Employee Name', 'Client', 'Project', 'Task Type', 'Topic', 'Hours Spent', 'Priority'];
      worksheet.getRow(4).values = headers;
      worksheet.getRow(4).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
        cell.alignment = { horizontal: 'center' };
      });

      logs.forEach((log, index) => {
        const row = worksheet.addRow([
          index + 1,
          log.user?.name || '—',
          log.client?.name || '—',
          log.project?.name || '—',
          log.taskType || '—',
          log.topic || '—',
          Math.round((log.timeSpent / 60) * 10) / 10,
          log.priority || '—'
        ]);
        if (index % 2 === 0) {
          row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F3FF' } };
          });
        }
      });

      worksheet.columns.forEach(col => { col.width = 18; });

      const buffer = await workbook.xlsx.writeBuffer();

      // Log report generation activity
      await prisma.activity.create({
        data: {
          userId: userSession.id,
          userLabel: userSession.name,
          action: 'GENERATE_REPORT',
          details: `Exported Excel productivity report (${timeframe}, dept: ${department})`
        }
      });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="report-${timeframe}-${Date.now()}.xlsx"`
        }
      });
    }

    // Default: PDF Generation
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    // Collect buffer data
    await new Promise((resolve, reject) => {
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve());
      doc.on('error', err => reject(err));

      // Header Banner
      doc.rect(0, 0, 612, 80).fill('#1e1b4b');
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
         .text('🎨 Creative Productivity Platform', 50, 20);
      doc.fontSize(11).font('Helvetica')
         .text(`Activity Work log Report — Timeframe: ${timeframe.toUpperCase()}`, 50, 50);
      doc.moveDown(3.5);

      // Metadata summary
      doc.fillColor('#1e1b4b').fontSize(14).font('Helvetica-Bold').text('Overview Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fillColor('#333333').fontSize(10).font('Helvetica')
         .text(`Date Exported: ${new Date().toLocaleString('en-IN')}`)
         .text(`Department Group Filter: ${department === 'all' ? 'All Departments' : department}`)
         .text(`Total Logged Creative Tasks: ${logs.length}`);
      doc.moveDown(1.5);

      if (logs.length > 0) {
        doc.fillColor('#1e1b4b').fontSize(12).font('Helvetica-Bold').text('Completed Work Ledger');
        doc.moveDown(0.5);
        
        const cols = [30, 110, 80, 80, 80, 120];
        const headers = ['#', 'Name', 'Client', 'Type', 'Hours', 'Topic'];
        let x = 50;

        // Render header
        doc.rect(50, doc.y, 500, 18).fill('#6366f1');
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
        headers.forEach((h, i) => {
          doc.text(h, x, doc.y - 14, { width: cols[i] });
          x += cols[i];
        });
        doc.moveDown(0.4);

        // Render rows
        logs.forEach((log, idx) => {
          const y = doc.y;
          if (y > 740) doc.addPage();
          
          doc.rect(50, doc.y, 500, 16).fill(idx % 2 === 0 ? '#f5f3ff' : '#ffffff');
          x = 50;
          doc.fillColor('#333333').fontSize(8.5).font('Helvetica');
          
          const row = [
            idx + 1,
            (log.user?.name || '').substring(0, 18),
            (log.client?.name || '').substring(0, 15),
            log.taskType || '',
            `${Math.round((log.timeSpent / 60) * 10) / 10}h`,
            (log.topic || '').substring(0, 22)
          ];

          row.forEach((val, i) => {
            doc.text(String(val), x, doc.y - 13, { width: cols[i] });
            x += cols[i];
          });
          doc.moveDown(0.35);
        });
      } else {
        doc.fillColor('#666666').fontSize(12).text('No creative logs found matching filters.');
      }

      doc.end();
    });

    // Log report generation activity
    await prisma.activity.create({
      data: {
        userId: userSession.id,
        userLabel: userSession.name,
        action: 'GENERATE_REPORT',
        details: `Exported PDF productivity report (${timeframe}, dept: ${department})`
      }
    });

    const pdfBuffer = Buffer.concat(chunks);
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-${timeframe}-${Date.now()}.pdf"`
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
