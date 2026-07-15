/* activity.js — Activity Log with pagination */
let allActivities = [], activityOffset = 0;
const ACTIVITY_LIMIT = 20;

async function loadActivities(offset = 0) {
  try {
    const data = await api(`/api/activities?limit=${ACTIVITY_LIMIT}&offset=${offset}`);
    allActivities = data.activities;
    activityOffset = offset;
    renderActivities(allActivities);
    renderPagination(data.total, offset);
  } catch (err) { toast('Failed to load activities: '+err.message,'error'); }
}

function renderActivities(activities) {
  const tbody = document.getElementById('activityTableBody');
  if (!activities.length) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">🕐</div><h3>No activity yet</h3></div></td></tr>`;
    return;
  }
  tbody.innerHTML = activities.map(a => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">
            ${(a.user_name||'S').charAt(0).toUpperCase()}
          </div>
          <span style="font-size:13px;font-weight:500;">${a.user_name||'System'}</span>
        </div>
      </td>
      <td><span style="font-size:12px;background:rgba(99,102,241,.12);color:#a5b4fc;padding:3px 8px;border-radius:4px;">${actionIcon(a.action)} ${a.action.replace(/_/g,' ')}</span></td>
      <td style="font-size:12px;color:var(--text-muted);max-width:320px;">${a.details}</td>
      <td style="font-size:11px;color:var(--text-muted);white-space:nowrap;">${timeAgo(a.timestamp)}<br><span style="font-size:10px;">${new Date(a.timestamp).toLocaleString('en-IN')}</span></td>
    </tr>
  `).join('');
}

function filterActivities() {
  const q = document.getElementById('activitySearch').value.toLowerCase();
  renderActivities(allActivities.filter(a =>
    (a.user_name||'').toLowerCase().includes(q) ||
    a.action.toLowerCase().includes(q) ||
    a.details.toLowerCase().includes(q)
  ));
}

function renderPagination(total, offset) {
  const pag = document.getElementById('activityPagination');
  const pages = Math.ceil(total / ACTIVITY_LIMIT);
  const current = Math.floor(offset / ACTIVITY_LIMIT);
  if (pages <= 1) { pag.innerHTML=''; return; }
  let html = '';
  if (current > 0) html += `<button class="btn btn-ghost btn-sm" onclick="loadActivities(${(current-1)*ACTIVITY_LIMIT})">← Prev</button>`;
  html += `<span style="color:var(--text-muted);font-size:13px;">Page ${current+1} of ${pages}</span>`;
  if (current < pages-1) html += `<button class="btn btn-ghost btn-sm" onclick="loadActivities(${(current+1)*ACTIVITY_LIMIT})">Next →</button>`;
  pag.innerHTML = html;
}
