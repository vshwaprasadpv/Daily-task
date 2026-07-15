const db     = require('../config/db');
const bcrypt = require('bcryptjs');

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

// Convert any JS Date → ISO date string; empty string / undefined → null
const toStr = (v) => {
  if (v instanceof Date)       return v.toISOString().slice(0, 10);
  if (!v && v !== 0)           return null;
  return String(v);
};

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id,name,email,phone,role,department,employee_id,reporting_manager,joining_date,status,profile_picture_url,created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id,name,email,phone,role,department,employee_id,reporting_manager,joining_date,status,profile_picture_url,created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  const { name, email, password, phone, role, department, employee_id, reporting_manager, joining_date } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name,email,password_hash,phone,role,department,employee_id,reporting_manager,joining_date) VALUES (?,?,?,?,?,?,?,?,?)',
      [
        name,
        email,
        hash,
        toStr(phone)             || '',
        toStr(role)              || 'designer',
        toStr(department)        || 'Design',
        toStr(employee_id)       || '',
        toStr(reporting_manager) || '',
        toStr(joining_date)      || new Date().toISOString().slice(0, 10),  // always a string
      ]
    );
    await logActivity(req.user.id, req.user.name, 'user_created', `User "${name}" created`);
    await notify(result.insertId, `Welcome to Creative Task Manager, ${name}!`);
    const [newUser] = await db.query(
      'SELECT id,name,email,phone,role,department,employee_id,status FROM users WHERE id=?',
      [result.insertId]
    );
    res.status(201).json(newUser[0]);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { name, email, phone, role, department, employee_id, reporting_manager, joining_date, profile_picture_url, password } = req.body;
  try {
    // If password was provided, hash and update it too
    if (password && password.trim()) {
      const hash = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET name=?,email=?,phone=?,role=?,department=?,employee_id=?,reporting_manager=?,joining_date=?,profile_picture_url=?,password_hash=? WHERE id=?',
        [name, email, toStr(phone)||'', toStr(role)||'designer', toStr(department)||'Design', toStr(employee_id)||'', toStr(reporting_manager)||'', toStr(joining_date), toStr(profile_picture_url), hash, req.params.id]
      );
    } else {
      await db.query(
        'UPDATE users SET name=?,email=?,phone=?,role=?,department=?,employee_id=?,reporting_manager=?,joining_date=?,profile_picture_url=? WHERE id=?',
        [name, email, toStr(phone)||'', toStr(role)||'designer', toStr(department)||'Design', toStr(employee_id)||'', toStr(reporting_manager)||'', toStr(joining_date), toStr(profile_picture_url), req.params.id]
      );
    }
    await logActivity(req.user.id, req.user.name, 'user_updated', `User "${name}" updated`);
    res.json({ success: true });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT name FROM users WHERE id=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    // Nullify references before delete (tasks.assigned_user_id handled by ON DELETE SET NULL)
    await db.query('DELETE FROM users WHERE id=?', [req.params.id]);
    await logActivity(req.user.id, req.user.name, 'user_deleted', `User "${rows[0].name}" deleted`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.toggleStatus = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT name,status FROM users WHERE id=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    const newStatus = rows[0].status === 'active' ? 'disabled' : 'active';
    await db.query('UPDATE users SET status=? WHERE id=?', [newStatus, req.params.id]);
    await logActivity(req.user.id, req.user.name, 'user_status_changed', `User "${rows[0].name}" set to ${newStatus}`);
    res.json({ status: newStatus });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
