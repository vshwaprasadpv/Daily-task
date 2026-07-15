const db = require('../config/db');

const logActivity = async (userId, userName, action, details) => {
  try {
    await db.query('INSERT INTO activities (user_id, user_name, action, details) VALUES (?,?,?,?)',
      [userId, userName, action, details]);
  } catch {}
};

const getOkrWithKRs = async (okrId) => {
  const [okrs] = await db.query('SELECT * FROM okrs WHERE id=?', [okrId]);
  if (!okrs[0]) return null;
  const [krs] = await db.query('SELECT * FROM key_results WHERE okr_id=?', [okrId]);
  const [assignments] = await db.query('SELECT * FROM okr_assignments WHERE okr_id=?', [okrId]);
  const okr = okrs[0];
  okr.key_results = krs;
  okr.assignments = assignments;
  const progress = krs.length
    ? krs.reduce((sum, kr) => sum + (kr.target > 0 ? kr.current / kr.target : 0), 0) / krs.length
    : 0;
  okr.overall_progress = Math.min(progress, 1.0);
  return okr;
};

exports.getAll = async (req, res) => {
  try {
    const [okrs] = await db.query('SELECT * FROM okrs ORDER BY created_at DESC');
    const result = [];
    for (const okr of okrs) result.push(await getOkrWithKRs(okr.id));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const okr = await getOkrWithKRs(req.params.id);
    if (!okr) return res.status(404).json({ error: 'OKR not found' });
    res.json(okr);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  const { objective, key_results = [], assigned_user_ids = [] } = req.body;
  if (!objective) return res.status(400).json({ error: 'Objective is required' });
  try {
    const [result] = await db.query('INSERT INTO okrs (objective, created_by) VALUES (?,?)', [objective, req.user.id]);
    const okrId = result.insertId;
    for (const kr of key_results) {
      await db.query('INSERT INTO key_results (okr_id,title,target,current) VALUES (?,?,?,?)',
        [okrId, kr.title, kr.target || 100, 0]);
    }
    for (const uid of assigned_user_ids) {
      await db.query('INSERT INTO okr_assignments (okr_id,user_id,role) VALUES (?,?,?)', [okrId, uid, '']);
    }
    await logActivity(req.user.id, req.user.name, 'okr_created', `OKR "${objective}" created`);
    const okr = await getOkrWithKRs(okrId);
    res.status(201).json(okr);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  const { objective, key_results = [], assigned_user_ids = [] } = req.body;
  try {
    await db.query('UPDATE okrs SET objective=? WHERE id=?', [objective, req.params.id]);
    await db.query('DELETE FROM key_results WHERE okr_id=?', [req.params.id]);
    for (const kr of key_results) {
      await db.query('INSERT INTO key_results (okr_id,title,target,current) VALUES (?,?,?,?)',
        [req.params.id, kr.title, kr.target || 100, kr.current || 0]);
    }
    await db.query('DELETE FROM okr_assignments WHERE okr_id=?', [req.params.id]);
    for (const uid of assigned_user_ids) {
      await db.query('INSERT INTO okr_assignments (okr_id,user_id,role) VALUES (?,?,?)', [req.params.id, uid, '']);
    }
    await logActivity(req.user.id, req.user.name, 'okr_updated', `OKR "${objective}" updated`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT objective FROM okrs WHERE id=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'OKR not found' });
    await db.query('DELETE FROM okrs WHERE id=?', [req.params.id]);
    await logActivity(req.user.id, req.user.name, 'okr_deleted', `OKR "${rows[0].objective}" deleted`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateKeyResult = async (req, res) => {
  const { current } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM key_results WHERE id=? AND okr_id=?', [req.params.krId, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Key result not found' });
    await db.query('UPDATE key_results SET current=? WHERE id=?', [current, req.params.krId]);
    await logActivity(req.user.id, req.user.name, 'okr_updated', `Key result "${rows[0].title}" updated to ${current}/${rows[0].target}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
