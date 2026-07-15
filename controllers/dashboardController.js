const db = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    const today   = new Date().toISOString().slice(0, 10);

    const q = async (sql, p=[]) => { const [rows] = await db.query(sql,p); return rows[0]; };

    const { total_users }      = await q('SELECT COUNT(*) as total_users FROM users');
    const { active_users }     = await q('SELECT COUNT(*) as active_users FROM users WHERE status="active"');
    const { designers }        = await q('SELECT COUNT(*) as designers FROM users WHERE role="designer"');
    const { video_editors }    = await q('SELECT COUNT(*) as video_editors FROM users WHERE role="video_editor"');
    const { pending_tasks }    = await q('SELECT COUNT(*) as pending_tasks FROM tasks WHERE status="pending"');
    const { completed_today }  = await q('SELECT COUNT(*) as completed_today FROM tasks WHERE status="completed" AND DATE(completed_at)=?',[today]);
    const { total_tasks }      = await q('SELECT COUNT(*) as total_tasks FROM tasks');
    const { completed_tasks }  = await q('SELECT COUNT(*) as completed_tasks FROM tasks WHERE status="completed"');

    // OKR average progress
    const [okrs] = await db.query('SELECT id FROM okrs');
    let okrAvgProgress = 0;
    if (okrs.length > 0) {
      const [krs] = await db.query('SELECT okr_id, target, current FROM key_results');
      const okrMap = {};
      for (const kr of krs) {
        if (!okrMap[kr.okr_id]) okrMap[kr.okr_id] = [];
        okrMap[kr.okr_id].push(kr.target > 0 ? kr.current / kr.target : 0);
      }
      const progressValues = Object.values(okrMap).map(arr => arr.reduce((a,b)=>a+b,0)/arr.length);
      okrAvgProgress = progressValues.length ? progressValues.reduce((a,b)=>a+b,0)/progressValues.length : 0;
    }

    // 7-day chart
    const dailyData   = [];
    const dailyLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d  = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const row = await q('SELECT COUNT(*) as count FROM tasks WHERE status="completed" AND DATE(completed_at)=?',[ds]);
      dailyData.push(row.count);
      dailyLabels.push(d.toLocaleDateString('en-US', { weekday:'short' }));
    }

    // Recent activities
    const [recent_activities] = await db.query('SELECT * FROM activities ORDER BY timestamp DESC LIMIT 10');

    // Category breakdown
    const [categories] = await db.query('SELECT category, COUNT(*) as count FROM tasks GROUP BY category ORDER BY count DESC LIMIT 6');

    res.json({
      total_users, active_users, designers, video_editors,
      pending_tasks, completed_today, total_tasks, completed_tasks,
      okr_avg_progress: Math.round(okrAvgProgress * 100),
      daily_labels: dailyLabels, daily_data: dailyData,
      recent_activities, categories,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
