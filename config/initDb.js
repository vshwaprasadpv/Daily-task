/**
 * config/initDb.js — SQLite schema with proper CASCADE/SET NULL rules + seed data
 * Drops and recreates schema each run to apply FK fixes.
 */
const bcrypt = require('bcryptjs');
const db     = require('./db');
const sqlite = db._sqlite;

function initDb() {
  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").all();
  if (tables.length > 0) {
    console.log('✅ Database already initialized.');
    return;
  }

  console.log('⚡ Initializing database schema + seed data...');

  // ── Schema: all FK columns use ON DELETE CASCADE or SET NULL ─────────────
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      name                TEXT    NOT NULL,
      email               TEXT    NOT NULL UNIQUE,
      password_hash       TEXT    NOT NULL,
      phone               TEXT    DEFAULT '',
      role                TEXT    NOT NULL DEFAULT 'designer',
      department          TEXT    DEFAULT 'Design',
      employee_id         TEXT    DEFAULT '',
      reporting_manager   TEXT    DEFAULT '',
      joining_date        TEXT,
      status              TEXT    NOT NULL DEFAULT 'active',
      profile_picture_url TEXT,
      created_at          TEXT    DEFAULT (datetime('now')),
      updated_at          TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      title            TEXT    NOT NULL,
      description      TEXT    DEFAULT '',
      assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      priority         TEXT    NOT NULL DEFAULT 'medium',
      category         TEXT    NOT NULL DEFAULT 'Miscellaneous',
      status           TEXT    NOT NULL DEFAULT 'pending',
      due_date         TEXT,
      completion_note  TEXT,
      completed_at     TEXT,
      created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at       TEXT    DEFAULT (datetime('now')),
      updated_at       TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS okrs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      objective   TEXT    NOT NULL,
      created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at  TEXT    DEFAULT (datetime('now')),
      updated_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS key_results (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      okr_id     INTEGER NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
      title      TEXT    NOT NULL,
      target     INTEGER NOT NULL DEFAULT 100,
      current    INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    DEFAULT (datetime('now')),
      updated_at TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS okr_assignments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      okr_id     INTEGER NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role       TEXT    DEFAULT '',
      created_at TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activities (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT,
      action    TEXT    NOT NULL,
      details   TEXT    DEFAULT '',
      timestamp TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      message     TEXT    NOT NULL,
      read_status INTEGER DEFAULT 0,
      created_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS backups (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      filename   TEXT    NOT NULL,
      filepath   TEXT    NOT NULL DEFAULT '',
      size       INTEGER DEFAULT 0,
      created_by TEXT    DEFAULT '',
      created_at TEXT    DEFAULT (datetime('now'))
    );
  `);

  // ── Seed users ─────────────────────────────────────────────────────────────
  const hash = bcrypt.hashSync('Admin@123', 10);

  const insertUser = sqlite.prepare(`
    INSERT INTO users (name,email,password_hash,phone,role,department,employee_id,reporting_manager,joining_date,status)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `);

  const users = [
    ['Vishwa Admin',  'admin@creative.com',   hash, '9876543210', 'super_admin',  'Management', 'EMP001', '',             '2023-01-01', 'active'],
    ['Priya Sharma',  'priya@creative.com',   hash, '9876543211', 'designer',     'Design',     'EMP002', 'Vishwa Admin', '2023-03-15', 'active'],
    ['Rahul Verma',   'rahul@creative.com',   hash, '9876543212', 'video_editor', 'Video',      'EMP003', 'Vishwa Admin', '2023-04-01', 'active'],
    ['Ananya Singh',  'ananya@creative.com',  hash, '9876543213', 'designer',     'Design',     'EMP004', 'Priya Sharma', '2023-06-01', 'active'],
    ['Karthik Raj',   'karthik@creative.com', hash, '9876543214', 'video_editor', 'Video',      'EMP005', 'Rahul Verma',  '2023-07-15', 'active'],
    ['Meera Nair',    'meera@creative.com',   hash, '9876543215', 'team_lead',    'Design',     'EMP006', 'Vishwa Admin', '2022-11-01', 'active'],
  ];

  const seedAll = sqlite.transaction(() => {
    // Users
    for (const u of users) insertUser.run(...u);

    // Tasks
    const today     = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const insertTask = sqlite.prepare(`
      INSERT INTO tasks (title,description,assigned_user_id,priority,category,status,due_date,completion_note,completed_at,created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `);

    const tasks = [
      ['Instagram Reel — Product Launch',  'Create 30-sec reel for new product',   2, 'high',   'Reel Editing',       'pending',   today,     null, null,      1],
      ['Festive Banner Design — Diwali',   'Design banner set for Diwali campaign', 2, 'high',   'Banner Design',      'pending',   today,     null, null,      1],
      ['YouTube Thumbnail Set',            '10 thumbnails for YouTube series',      3, 'medium', 'Thumbnail Creation', 'pending',   today,     null, null,      1],
      ['Brand Guideline Document',         'Create PDF brand guidelines',           4, 'low',    'Branding',           'pending',   today,     null, null,      1],
      ['Audio Sync — Promo Video',         'Sync background music to promo video',  5, 'medium', 'Audio Syncing',      'pending',   today,     null, null,      1],
      ['Logo Redesign Presentation',       'Redesign logo, present 3 options',      2, 'high',   'Branding',           'completed', yesterday, 'Presented 3 logo concepts. All approved!', yesterday, 1],
      ['Social Media Story Pack',          '15 stories for Instagram campaign',     4, 'medium', 'Instagram Story',    'completed', yesterday, 'Delivered 15 stories in brand colors.', yesterday, 1],
      ['Video Campaign — Summer Sale',     '60-sec video for summer campaign',      3, 'high',   'Video Campaign',     'completed', yesterday, 'Video edited in 4K. Client loved it!', yesterday, 1],
    ];
    for (const t of tasks) insertTask.run(...t);

    // OKRs
    const o1 = sqlite.prepare("INSERT INTO okrs (objective,created_by) VALUES (?,?)").run('Increase Creative Output by 40% this Quarter', 1);
    const o2 = sqlite.prepare("INSERT INTO okrs (objective,created_by) VALUES (?,?)").run('Build Brand Identity for 5 New Clients', 1);

    const insertKR = sqlite.prepare("INSERT INTO key_results (okr_id,title,target,current) VALUES (?,?,?,?)");
    insertKR.run(o1.lastInsertRowid, 'Complete 50 design tasks',          50, 23);
    insertKR.run(o1.lastInsertRowid, 'Publish 20 reels per month',        20, 12);
    insertKR.run(o1.lastInsertRowid, 'Reduce revision cycles to <2',      10,  7);
    insertKR.run(o2.lastInsertRowid, 'Deliver brand kits to 5 clients',    5,  2);
    insertKR.run(o2.lastInsertRowid, 'Create 10 brand presentations',     10,  4);

    // Activities
    const insertAct = sqlite.prepare("INSERT INTO activities (user_id,user_name,action,details) VALUES (?,?,?,?)");
    insertAct.run(1,'Vishwa Admin','user_created','Added team member Priya Sharma (Designer)');
    insertAct.run(1,'Vishwa Admin','user_created','Added team member Rahul Verma (Video Editor)');
    insertAct.run(1,'Vishwa Admin','task_created','Created task: Instagram Reel — Product Launch');
    insertAct.run(1,'Vishwa Admin','task_created','Created task: Festive Banner Design — Diwali');
    insertAct.run(2,'Priya Sharma', 'task_completed','Completed: Logo Redesign Presentation');
    insertAct.run(4,'Ananya Singh', 'task_completed','Completed: Social Media Story Pack');
    insertAct.run(3,'Rahul Verma',  'task_completed','Completed: Video Campaign — Summer Sale');
    insertAct.run(1,'Vishwa Admin','okr_created','Created OKR: Increase Creative Output by 40%');
    insertAct.run(1,'Vishwa Admin','login','Vishwa Admin logged in');

    // Notifications
    const insertNotif = sqlite.prepare("INSERT INTO notifications (user_id,message,read_status) VALUES (?,?,?)");
    insertNotif.run(2, 'Your task "Instagram Reel" is due today!', 0);
    insertNotif.run(2, 'New task assigned: Festive Banner Design',  0);
    insertNotif.run(3, 'New task assigned: YouTube Thumbnail Set',  0);
    insertNotif.run(1, 'Priya completed: Logo Redesign Presentation ✅', 1);
    insertNotif.run(1, 'Rahul completed: Video Campaign — Summer Sale ✅', 1);
    insertNotif.run(1, 'Team OKR progress updated: 46% overall', 1);
  });

  seedAll();

  console.log('✅ Database seeded successfully!');
  console.log('   👥 6 users | ✅ 8 tasks | 🎯 2 OKRs | 📊 5 key results');
}

module.exports = initDb;
