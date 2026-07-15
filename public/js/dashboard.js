/* dashboard.js — Admin & User Dashboard with Chart.js */
let trendChart = null, categoryChart = null;

async function loadDashboard() {
  try {
    const d = await api('/api/dashboard/stats');
    renderStats(d);
    renderTrendChart(d.daily_labels, d.daily_data);
    renderCategoryChart(d.categories);
    renderActivityFeed(d.recent_activities);
  } catch (err) { toast('Failed to load dashboard: ' + err.message, 'error'); }
}

function renderStats(d) {
  const isAdm = isAdmin;
  const cards = isAdm ? [
    { icon:'👥', value: d.total_users,      label:'Total Users',       sub:`${d.active_users} active`, color:'#6366f1' },
    { icon:'✅', value: d.completed_today,  label:'Completed Today',   sub:`${d.pending_tasks} pending`, color:'#10b981' },
    { icon:'⏳', value: d.pending_tasks,    label:'Pending Tasks',     sub:`of ${d.total_tasks} total`, color:'#f59e0b' },
    { icon:'🎯', value: d.okr_avg_progress+'%', label:'OKR Progress', sub:'avg across all OKRs', color:'#8b5cf6' },
    { icon:'🎨', value: d.designers,        label:'Designers',         sub:'active team members', color:'#06b6d4' },
    { icon:'🎬', value: d.video_editors,    label:'Video Editors',     sub:'active team members', color:'#ec4899' },
  ] : [
    { icon:'📋', value: d.pending_tasks,    label:'My Pending Tasks',  sub:'assigned to me', color:'#f59e0b' },
    { icon:'✅', value: d.completed_today,  label:'Completed Today',   sub:'by the whole team', color:'#10b981' },
    { icon:'🎯', value: d.okr_avg_progress+'%', label:'OKR Progress',  sub:'team average', color:'#8b5cf6' },
  ];

  document.getElementById('statsGrid').innerHTML = cards.map(c => `
    <div class="stat-card" style="--accent-color:${c.color};">
      <div class="stat-icon">${c.icon}</div>
      <div class="stat-value">${c.value}</div>
      <div class="stat-label">${c.label}</div>
      <div class="stat-sub">${c.sub}</div>
    </div>
  `).join('');
}

function renderTrendChart(labels, data) {
  const ctx = document.getElementById('trendChart').getContext('2d');
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Completed Tasks',
        data,
        backgroundColor: 'rgba(99,102,241,0.4)',
        borderColor: '#6366f1',
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(99,102,241,0.65)',
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display:false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} tasks completed` } } },
      scales: {
        x: { grid: { color:'rgba(255,255,255,0.05)' }, ticks: { color:'#64748b' } },
        y: { grid: { color:'rgba(255,255,255,0.05)' }, ticks: { color:'#64748b', stepSize:1 }, beginAtZero:true }
      }
    }
  });
}

function renderCategoryChart(categories) {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  if (categoryChart) categoryChart.destroy();
  const colors = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444'];
  if (!categories.length) { ctx.canvas.parentElement.innerHTML = '<div class="empty-state" style="padding:40px;"><div class="empty-icon">📊</div><p>No data yet</p></div>'; return; }
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories.map(c => c.category),
      datasets: [{ data: categories.map(c => c.count), backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: { legend: { position:'bottom', labels: { color:'#94a3b8', padding:12, font:{ size:11 } } } }
    }
  });
}

function renderActivityFeed(activities) {
  const feed = document.getElementById('activityFeed');
  if (!activities.length) { feed.innerHTML = '<div class="empty-state" style="padding:30px;"><p>No recent activity</p></div>'; return; }
  feed.innerHTML = activities.map(a => `
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div class="activity-info">
        <div class="text"><strong>${a.user_name}</strong> — ${a.details}</div>
        <div class="time">${actionIcon(a.action)} ${timeAgo(a.timestamp)}</div>
      </div>
    </div>
  `).join('');
}
