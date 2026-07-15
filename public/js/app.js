/* ============================================================
   app.js — Core auth, routing, API helpers, toasts, notifs
   ============================================================ */

const adminRoles = ['super_admin','admin','team_lead'];

// ── Auth guard ─────────────────────────────────────────────
const token = localStorage.getItem('ctm_token');
const me = JSON.parse(localStorage.getItem('ctm_user') || 'null');
if (!token || !me) window.location.href = '/login.html';

// ── API helper ─────────────────────────────────────────────
async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token, ...(options.headers||{}) }
  });
  if (res.status === 401) { logout(); return; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Toast ──────────────────────────────────────────────────
function toast(msg, type='info') {
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]||'ℹ️'}</span> <span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ── Modal helpers ──────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// ── Logout ─────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('ctm_token');
  localStorage.removeItem('ctm_user');
  window.location.href = '/login.html';
}

// ── Sidebar Nav ────────────────────────────────────────────
const isAdmin = adminRoles.includes(me.role);

const navConfig = [
  { id:'dashboard', icon:'📊', label:'Dashboard',    section:'dashboard', all:true },
  { id:'tasks',     icon:'✅', label:'Tasks',         section:'tasks',    all:true },
  { id:'users',     icon:'👥', label:'Users',         section:'users',    adminOnly:true },
  { id:'okrs',      icon:'🎯', label:'OKRs',          section:'okrs',     all:true },
  { id:'reports',   icon:'📈', label:'Reports',       section:'reports',  adminOnly:true },
  { id:'activity',  icon:'🕐', label:'Activity Log',  section:'activity', adminOnly:true },
  { id:'backup',    icon:'💾', label:'Backup',        section:'backup',   adminOnly:true },
  { id:'profile',   icon:'👤', label:'My Profile',    section:'profile',  all:true },
];

function buildNav() {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';
  navConfig.forEach(item => {
    if (item.adminOnly && !isAdmin) return;
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.id = 'nav-'+item.id;
    btn.innerHTML = `<span class="nav-icon">${item.icon}</span><span>${item.label}</span>`;
    btn.onclick = () => navigateTo(item.section, item.label);
    nav.appendChild(btn);
  });
}

function navigateTo(section, label) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById('section-'+section);
  if (el) el.classList.add('active');
  const navEl = document.getElementById('nav-'+section);
  if (navEl) navEl.classList.add('active');
  document.getElementById('headerTitle').textContent = label || section;

  // Load section data
  if (section === 'dashboard') loadDashboard();
  if (section === 'tasks') loadTasks();
  if (section === 'users') loadUsers();
  if (section === 'okrs') loadOkrs();
  if (section === 'activity') loadActivities();
  if (section === 'backup') loadBackups();
  if (section === 'profile') loadProfile();
}

// ── Notifications ──────────────────────────────────────────
let notifOpen = false;
function toggleNotifPanel() {
  notifOpen = !notifOpen;
  document.getElementById('notifPanel').classList.toggle('open', notifOpen);
  if (notifOpen) loadNotifications();
}
document.addEventListener('click', e => {
  if (!e.target.closest('.notif-btn') && !e.target.closest('.notif-panel')) {
    notifOpen = false;
    document.getElementById('notifPanel').classList.remove('open');
  }
});

async function loadNotifications() {
  try {
    const data = await api('/api/notifications');
    const badge = document.getElementById('notifBadge');
    const list = document.getElementById('notifList');
    if (data.unread > 0) { badge.textContent = data.unread; badge.style.display='flex'; }
    else { badge.style.display='none'; }
    if (!data.notifications.length) { list.innerHTML='<div class="empty-state" style="padding:30px;"><div class="empty-icon">🔔</div><p>No notifications</p></div>'; return; }
    list.innerHTML = data.notifications.map(n => `
      <div class="notif-item ${n.read_status ? '' : 'unread'}" onclick="markRead(${n.id}, this)">
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${timeAgo(n.created_at)}</div>
      </div>
    `).join('');
  } catch {}
}

async function markRead(id, el) {
  await api(`/api/notifications/${id}/read`, { method:'PATCH' });
  el.classList.remove('unread');
}

async function markAllRead() {
  await api('/api/notifications/read-all', { method:'PATCH' });
  document.getElementById('notifList').querySelectorAll('.notif-item').forEach(el => el.classList.remove('unread'));
  document.getElementById('notifBadge').style.display = 'none';
  toast('All notifications marked as read', 'success');
}

// ── Profile ────────────────────────────────────────────────
async function loadProfile() {
  try {
    const u = await api('/api/auth/me');
    document.getElementById('profileContent').innerHTML = `
      <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;">
        <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;">
          ${u.name.charAt(0).toUpperCase()}
        </div>
        <div><h3 style="font-size:18px;font-weight:700;">${u.name}</h3>
          <p style="color:var(--text-muted);font-size:13px;">${u.email}</p>
          <span class="badge badge-${u.role}">${formatRole(u.role)}</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        ${profileField('📱 Phone', u.phone||'—')}
        ${profileField('🏢 Department', u.department||'—')}
        ${profileField('🆔 Employee ID', u.employee_id||'—')}
        ${profileField('👤 Reporting Manager', u.reporting_manager||'—')}
        ${profileField('📅 Joining Date', u.joining_date ? new Date(u.joining_date).toLocaleDateString('en-IN') : '—')}
        ${profileField('🟢 Status', u.status)}
      </div>
    `;
  } catch {}
}
function profileField(label, val) {
  return `<div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:12px;">
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">${label}</div>
    <div style="font-size:13px;font-weight:500;">${val}</div>
  </div>`;
}

// ── Utilities ──────────────────────────────────────────────
function formatRole(r) {
  return { super_admin:'Super Admin', admin:'Admin', team_lead:'Team Lead', designer:'Designer', video_editor:'Video Editor', viewer:'Viewer' }[r] || r;
}
function priorityBadge(p) { return `<span class="badge badge-${p}">${p}</span>`; }
function statusBadge(s)   { return `<span class="badge badge-${s}">${s}</span>`; }
function roleBadge(r)     { return `<span class="badge badge-${r}">${formatRole(r)}</span>`; }
function fmtDate(d)       { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; }
function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff/60000), h = Math.floor(m/60), dd = Math.floor(h/24);
  if (dd>0) return `${dd}d ago`; if (h>0) return `${h}h ago`; if (m>0) return `${m}m ago`; return 'Just now';
}
function actionIcon(a) {
  const map = { login:'🔑', task_created:'📝', task_completed:'✅', task_updated:'✏️', task_deleted:'🗑️', user_created:'👤', user_updated:'✏️', user_deleted:'🗑️', user_status_changed:'🔄', okr_created:'🎯', okr_updated:'🎯', okr_deleted:'🗑️', backup_created:'💾', backup_restored:'♻️', reports_generated:'📊' };
  return map[a] || '📌';
}

// ── Init ───────────────────────────────────────────────────
buildNav();
document.getElementById('sidebarName').textContent = me.name;
document.getElementById('sidebarRole').textContent = formatRole(me.role);
document.getElementById('sidebarAvatar').textContent = me.name.charAt(0).toUpperCase();
navigateTo('dashboard', 'Dashboard');
loadNotifications();
