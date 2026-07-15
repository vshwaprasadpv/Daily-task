/**
 * config/db.js  — SQLite adapter with mysql2-compatible interface
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs   = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'creative_task_manager.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);

// Performance tuning
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// ── Sanitize params: convert any JS Date → ISO string, undefined → null ──
function sanitize(params) {
  return (params || []).map(v => {
    if (v === undefined) return null;
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return v;
  });
}

// ── mysql2-compatible wrapper ─────────────────────────────
const db = {
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      try {
        const clean   = sanitize(params);
        const cleanSql = sql.replace(/`/g, '"');
        const upper   = cleanSql.trim().toUpperCase();
        const isSelect = upper.startsWith('SELECT') ||
                         upper.startsWith('SHOW')   ||
                         upper.startsWith('PRAGMA');
        if (isSelect) {
          const rows = sqlite.prepare(cleanSql).all(...clean);
          resolve([rows]);
        } else {
          const info = sqlite.prepare(cleanSql).run(...clean);
          resolve([{ insertId: info.lastInsertRowid, affectedRows: info.changes, changedRows: info.changes }]);
        }
      } catch (err) {
        reject(err);
      }
    });
  },

  execute(sql, params = []) { return this.query(sql, params); },
  getConnection()           { return Promise.resolve({ release: () => {} }); },
  _sqlite: sqlite,
};

console.log('✅ SQLite database ready:', DB_PATH);
module.exports = db;
