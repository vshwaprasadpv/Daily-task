const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const [rows] = await db.query(
      'SELECT * FROM activities ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM activities');
    res.json({ activities: rows, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
