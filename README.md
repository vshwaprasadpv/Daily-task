# 🎨 Creative Task Manager

A full-stack **Node.js + Express + SQLite** web application for managing creative team tasks, OKRs, users, and reports — converted from Flutter/Firebase to a modern web stack.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js + Express.js |
| **Database** | SQLite (via better-sqlite3) |
| **Auth** | JWT + bcryptjs |
| **Frontend** | Vanilla HTML/CSS/JS — Dark Glassmorphism UI |
| **Charts** | Chart.js |
| **Reports** | PDFKit + ExcelJS |

---

## ✨ Features

- 🛡️ **Role-Based Access** — Super Admin / Admin / Team Lead / Designer / Video Editor / Viewer
- 📊 **Dashboard** — Real-time stats, 7-day completion chart, category breakdown
- ✅ **Task Management** — Create, assign, track, complete with daily update notes
- 👥 **User Management** — Add/edit/disable team members
- 🎯 **OKR Tracking** — Objectives + Key Results with progress bars
- 📈 **Reports** — Download PDF & Excel reports by timeframe and department
- 🕐 **Activity Log** — Full audit trail of all actions
- 🔔 **Notifications** — Bell icon with unread badge
- 💾 **Backup** — Create and restore JSON snapshots

---

## 🏃 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server (SQLite DB auto-creates on first run)
npm start

# 3. Open browser
# http://localhost:3000
```

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| 🛡️ Super Admin | `admin@creative.com` | `Admin@123` |
| 🎨 Designer | `priya@creative.com` | `Admin@123` |
| 🎬 Video Editor | `rahul@creative.com` | `Admin@123` |
| 🎨 Designer 2 | `ananya@creative.com` | `Admin@123` |
| 🎬 Video Editor 2 | `karthik@creative.com` | `Admin@123` |
| 👥 Team Lead | `meera@creative.com` | `Admin@123` |

---

## 📁 Project Structure

```
creative-task-manager-nodejs/
├── config/
│   ├── db.js          # SQLite adapter (mysql2-compatible interface)
│   └── initDb.js      # Schema + seed data (auto-runs on first start)
├── controllers/       # Business logic for each feature
├── middleware/
│   └── auth.js        # JWT verification + role-based guards
├── routes/            # Express route definitions
├── public/
│   ├── login.html     # Premium dark login page
│   ├── index.html     # Main SPA shell
│   ├── css/
│   │   └── style.css  # Glassmorphism dark theme
│   └── js/
│       ├── app.js       # Core auth, routing, API helper
│       ├── dashboard.js # Chart.js charts + stats
│       ├── tasks.js     # Task management
│       ├── users.js     # User management
│       ├── okrs.js      # OKR tracking
│       ├── reports.js   # Report downloads
│       ├── activity.js  # Audit log
│       └── backup.js    # Backup management
├── sql/
│   └── schema.sql     # (reference) Original MySQL schema
├── server.js          # Express app entry point
└── package.json
```

---

## 🔧 Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
PORT=3000
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
```

---

## 📄 License

MIT © Creative Team
