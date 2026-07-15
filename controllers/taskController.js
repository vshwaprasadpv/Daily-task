const db = require('../config/db');

const logActivity = async (userId, userName, action, details) => {
  try {
    await db.query('INSERT INTO activities (user_id, user_name, action, details) VALUES (?,?,?,?)',
      [userId, userName, action, details]);
  } catch {}
};

const notify = async (userId, message) => {
  try {
    await db.query('INSERT INTO notifications (user_id, message) VALUES (?,?)', [userId, message]);
  } catch {}
};

const adminRoles = ['super_admin', 'admin', 'team_lead'];

exports.getAll = async (req, res) => {
  try {
    let query, params;
    if (adminRoles.includes(req.user.role)) {
      query = `SELECT t.*, u.name as assigned_user_name FROM tasks t
               LEFT JOIN users u ON t.assigned_user_id = u.id
               ORDER BY t.created_at DESC`;
      params = [];
    } else {
      query = `SELECT t.*, u.name as assigned_user_name FROM tasks t
               LEFT JOIN users u ON t.assigned_user_id = u.id
               WHERE t.assigned_user_id = ? ORDER BY t.created_at DESC`;
      params = [req.user.id];
    }
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT t.*, u.name as assigned_user_name FROM tasks t LEFT JOIN users u ON t.assigned_user_id=u.id WHERE t.id=?',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  const { title, description, assigned_user_id, priority, due_date, category } = req.body;
  if (!title || !assigned_user_id) return res.status(400).json({ error: 'Title and assigned user required' });
  try {
    const [result] = await db.query(
      'INSERT INTO tasks (title,description,assigned_user_id,priority,due_date,category) VALUES (?,?,?,?,?,?)',
      [title, description || '', assigned_user_id, priority || 'medium', due_date || null, category || 'Miscellaneous']
    );
    const [userRows] = await db.query('SELECT name FROM users WHERE id=?', [assigned_user_id]);
    await logActivity(req.user.id, req.user.name, 'task_created', `Task "${title}" assigned to ${userRows[0]?.name || 'user'}`);
    await notify(assigned_user_id, `New task assigned to you: "${title}" (${priority || 'medium'} priority)`);
    const [newTask] = await db.query('SELECT * FROM tasks WHERE id=?', [result.insertId]);
    res.status(201).json(newTask[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  const { title, description, assigned_user_id, priority, due_date, category, status } = req.body;
  try {
    await db.query(
      'UPDATE tasks SET title=?,description=?,assigned_user_id=?,priority=?,due_date=?,category=?,status=? WHERE id=?',
      [title, description, assigned_user_id, priority, due_date, category, status, req.params.id]
    );
    await logActivity(req.user.id, req.user.name, 'task_updated', `Task "${title}" updated`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT title FROM tasks WHERE id=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
    await db.query('DELETE FROM tasks WHERE id=?', [req.params.id]);
    await logActivity(req.user.id, req.user.name, 'task_deleted', `Task "${rows[0].title}" deleted`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.completeTask = async (req, res) => {
  const { completion_note } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM tasks WHERE id=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
    const task = rows[0];
    if (task.assigned_user_id !== req.user.id && !adminRoles.includes(req.user.role))
      return res.status(403).json({ error: 'Not authorized to complete this task' });

    const now = new Date().toISOString();
    await db.query(
      'UPDATE tasks SET status="completed", completion_note=?, completed_at=? WHERE id=?',
      [completion_note || '', now, req.params.id]
    );
    await logActivity(req.user.id, req.user.name, 'task_completed', `Task "${task.title}" marked as completed`);
    const [admins] = await db.query('SELECT id FROM users WHERE role IN ("super_admin","admin") AND status="active"');
    for (const admin of admins) {
      await notify(admin.id, `"${task.title}" was completed by ${req.user.name}`);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
