const db = require('../config/db');
const fs   = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

exports.list = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM backups ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const [users]       = await db.query('SELECT * FROM users');
    const [tasks]       = await db.query('SELECT * FROM tasks');
    const [okrs]        = await db.query('SELECT * FROM okrs');
    const [krs]         = await db.query('SELECT * FROM key_results');
    const [assignments] = await db.query('SELECT * FROM okr_assignments');
    const [activities]  = await db.query('SELECT * FROM activities');

    const backup = { users, tasks, okrs, key_results: krs, okr_assignments: assignments, activities, timestamp: new Date().toISOString() };
    const filename = `backup-${Date.now()}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
    const size = fs.statSync(filepath).size;

    await db.query('INSERT INTO backups (filename, filepath, size, created_by) VALUES (?,?,?,?)',
      [filename, filepath, size, req.user.name]);
    await db.query('INSERT INTO activities (user_id, user_name, action, details) VALUES (?,?,?,?)',
      [req.user.id, req.user.name, 'backup_created', `Backup "${filename}" created (${(size/1024).toFixed(1)} KB)`]);

    res.json({ success: true, filename, size });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.restore = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM backups WHERE id=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Backup not found' });

    const filepath = rows[0].filepath || path.join(BACKUP_DIR, rows[0].filename);
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Backup file not found on disk' });

    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

    // Restore tasks (INSERT OR IGNORE to avoid duplicates)
    for (const task of (data.tasks || [])) {
      await db.query(
        'INSERT OR IGNORE INTO tasks (id,title,description,assigned_user_id,priority,due_date,category,status,completion_note,completed_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [task.id, task.title, task.description, task.assigned_user_id, task.priority, task.due_date, task.category, task.status, task.completion_note, task.completed_at, task.created_at]
      );
    }
    await db.query('INSERT INTO activities (user_id, user_name, action, details) VALUES (?,?,?,?)',
      [req.user.id, req.user.name, 'backup_restored', `Backup "${rows[0].filename}" restored`]);
    res.json({ success: true, message: 'Backup restored successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM backups WHERE id=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Backup not found' });
    const filepath = rows[0].filepath || path.join(BACKUP_DIR, rows[0].filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    await db.query('DELETE FROM backups WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
