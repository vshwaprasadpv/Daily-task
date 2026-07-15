const db = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const getFilteredTasks = async (timeframe, department) => {
  const now = new Date();
  let daysBack = 1;
  switch (timeframe) {
    case 'weekly':    daysBack = 7;   break;
    case 'monthly':   daysBack = 30;  break;
    case '90days':    daysBack = 90;  break;
    case '180days':   daysBack = 180; break;
    case 'yearly':    daysBack = 365; break;
    default:          daysBack = 1;
  }
  const since = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  let q = `SELECT t.*, u.name as user_name, u.department, u.role
           FROM tasks t LEFT JOIN users u ON t.assigned_user_id=u.id
           WHERE t.status='completed'`;
  const params = [];

  if (timeframe === 'daily') {
    q += ' AND DATE(t.completed_at)=?';
    params.push(now.toISOString().slice(0, 10));
  } else {
    q += ' AND t.completed_at >= ?';
    params.push(since);
  }

  if (department && department !== 'all') {
    q += ' AND u.department=?';
    params.push(department);
  }
  q += ' ORDER BY t.completed_at DESC';
  const [rows] = await db.query(q, params);
  return rows;
};

exports.generatePDF = async (req, res) => {
  const { timeframe = 'daily', department = 'all' } = req.query;
  try {
    const tasks = await getFilteredTasks(timeframe, department);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${timeframe}-${Date.now()}.pdf"`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, 612, 80).fill('#1e1b4b');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
       .text('🎨 Creative Task Manager', 50, 20);
    doc.fontSize(12).font('Helvetica')
       .text(`Task Report — ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}`, 50, 50);
    doc.moveDown(3);

    // Summary
    doc.fillColor('#1e1b4b').fontSize(14).font('Helvetica-Bold').text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fillColor('#333').fontSize(11).font('Helvetica')
       .text(`Generated: ${new Date().toLocaleString('en-IN')}`)
       .text(`Department: ${department === 'all' ? 'All Departments' : department}`)
       .text(`Total Completed Tasks: ${tasks.length}`);
    doc.moveDown(1);

    // Table header
    if (tasks.length > 0) {
      doc.fillColor('#1e1b4b').fontSize(13).font('Helvetica-Bold').text('Task Details');
      doc.moveDown(0.5);
      const cols = [30, 200, 100, 80, 80, 100];
      const headers = ['#', 'Title', 'Category', 'Priority', 'Assigned To', 'Completed'];
      let x = 50;
      doc.rect(50, doc.y, 500, 20).fill('#6366f1');
      doc.fillColor('#fff').fontSize(10).font('Helvetica-Bold');
      headers.forEach((h, i) => { doc.text(h, x, doc.y - 18, { width: cols[i] }); x += cols[i]; });
      doc.moveDown(0.5);

      tasks.forEach((task, idx) => {
        const y = doc.y;
        if (y > 720) { doc.addPage(); }
        doc.rect(50, doc.y, 500, 18).fill(idx % 2 === 0 ? '#f8f9ff' : '#ffffff');
        x = 50;
        doc.fillColor('#333').fontSize(9).font('Helvetica');
        const row = [idx + 1, task.title?.substring(0, 30), task.category, task.priority, task.user_name || '-',
          task.completed_at ? new Date(task.completed_at).toLocaleDateString('en-IN') : '-'];
        row.forEach((val, i) => { doc.text(String(val), x, doc.y - 15, { width: cols[i] }); x += cols[i]; });
        doc.moveDown(0.3);
      });
    } else {
      doc.fillColor('#666').fontSize(12).text('No completed tasks found for the selected period.');
    }

    doc.end();
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.generateExcel = async (req, res) => {
  const { timeframe = 'daily', department = 'all' } = req.query;
  try {
    const tasks = await getFilteredTasks(timeframe, department);
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Creative Task Manager';
    const ws = wb.addWorksheet('Task Report');

    // Title row
    ws.mergeCells('A1:G1');
    ws.getCell('A1').value = `Creative Task Manager — ${timeframe} Report`;
    ws.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF6366F1' } };
    ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F0B2C' } };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    ws.getRow(2).values = ['', `Generated: ${new Date().toLocaleString('en-IN')}`, '', '', '', `Dept: ${department}`, `Total: ${tasks.length}`];

    // Headers
    const headers = ['#', 'Task Title', 'Description', 'Category', 'Priority', 'Assigned To', 'Dept', 'Completed At', 'Notes'];
    ws.getRow(4).values = headers;
    ws.getRow(4).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      cell.alignment = { horizontal: 'center' };
    });

    tasks.forEach((task, idx) => {
      const row = ws.addRow([
        idx + 1, task.title, task.description, task.category, task.priority,
        task.user_name || '-', task.department || '-',
        task.completed_at ? new Date(task.completed_at).toLocaleDateString('en-IN') : '-',
        task.completion_note || '-'
      ]);
      if (idx % 2 === 0) {
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0FF' } };
        });
      }
    });

    ws.columns.forEach(col => { col.width = 20; });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="report-${timeframe}-${Date.now()}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { res.status(500).json({ error: err.message }); }
};
