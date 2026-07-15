require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

// ── Init DB (SQLite schema + seed) on first run ────────────
require('./config/initDb')();

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/tasks',         require('./routes/tasks'));
app.use('/api/okrs',          require('./routes/okrs'));
app.use('/api/activities',    require('./routes/activities'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/backup',        require('./routes/backup'));
app.use('/api/dashboard',     require('./routes/dashboard'));

// ── Catch-all: serve SPA ──────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start Server ──────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🎨 Creative Task Manager running at http://localhost:${PORT}`);
  console.log(`   Admin login: admin@creative.com  /  Admin@123\n`);
});
