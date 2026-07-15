/* tasks.js — Task Management (Admin CRUD + User submit update) */
let allTasks = [], allUsers = [];

async function loadTasks() {
  try {
    allTasks = await api('/api/tasks');
    allUsers = isAdmin ? await api('/api/users') : [];
    renderTasks(allTasks);
    if (isAdmin) {
      populateUserSelect('taskAssign', allUsers);
      document.getElementById('addTaskBtn').style.display = '';
    } else {
      document.getElementById('addTaskBtn').style.display = 'none';
    }
  } catch (err) { toast('Failed to load tasks: '+err.message,'error'); }
}

function populateUserSelect(selectId, users) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">Select team member...</option>' +
    users.map(u => `<option value="${u.id}">${u.name} (${formatRole(u.role)})</option>`).join('');
}

function renderTasks(tasks) {
  const tbody = document.getElementById('tasksTableBody');
  if (!tasks.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📋</div><h3>No tasks yet</h3><p>Create the first task to get started</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = tasks.map(t => `
    <tr>
      <td><strong style="font-size:13px;">${t.title}</strong>${t.description?`<br><small style="color:var(--text-muted);">${t.description.substring(0,60)}${t.description.length>60?'...':''}</small>`:''}</td>
      <td>${t.assigned_user_name || '—'}</td>
      <td>${priorityBadge(t.priority)}</td>
      <td><span style="font-size:12px;color:var(--text-muted);">${t.category}</span></td>
      <td style="font-size:12px;">${fmtDate(t.due_date)}</td>
      <td>${statusBadge(t.status)}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${t.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="openComplete(${t.id},'${t.title.replace(/'/g,"\\'")}')">✅ Update</button>` : `<span style="font-size:11px;color:var(--text-muted);">Done ${fmtDate(t.completed_at)}</span>`}
          ${isAdmin ? `<button class="btn btn-icon btn-ghost" onclick="editTask(${t.id})" title="Edit">✏️</button>
          <button class="btn btn-icon btn-danger" onclick="deleteTask(${t.id},'${t.title.replace(/'/g,"\\'")}')">🗑️</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function filterTasks() {
  const q = document.getElementById('taskSearch').value.toLowerCase();
  const st = document.getElementById('taskStatusFilter').value;
  const pr = document.getElementById('taskPriorityFilter').value;
  renderTasks(allTasks.filter(t =>
    (!q || t.title.toLowerCase().includes(q) || (t.assigned_user_name||'').toLowerCase().includes(q)) &&
    (!st || t.status === st) && (!pr || t.priority === pr)
  ));
}

function openAddTask() {
  document.getElementById('taskForm').reset();
  document.getElementById('taskId').value = '';
  document.getElementById('taskModalTitle').textContent = 'Add Task';
  document.getElementById('taskDue').value = new Date().toISOString().slice(0,10);
  openModal('taskModal');
}

async function editTask(id) {
  const t = allTasks.find(x => x.id === id);
  if (!t) return;
  document.getElementById('taskId').value = t.id;
  document.getElementById('taskTitle').value = t.title;
  document.getElementById('taskDesc').value = t.description;
  document.getElementById('taskAssign').value = t.assigned_user_id;
  document.getElementById('taskPriority').value = t.priority;
  document.getElementById('taskCategory').value = t.category;
  document.getElementById('taskDue').value = t.due_date ? t.due_date.slice(0,10) : '';
  document.getElementById('taskModalTitle').textContent = 'Edit Task';
  openModal('taskModal');
}

document.getElementById('taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('taskId').value;
  const body = {
    title:           document.getElementById('taskTitle').value,
    description:     document.getElementById('taskDesc').value,
    assigned_user_id: parseInt(document.getElementById('taskAssign').value),
    priority:        document.getElementById('taskPriority').value,
    category:        document.getElementById('taskCategory').value,
    due_date:        document.getElementById('taskDue').value,
    status:          'pending',
  };
  try {
    if (id) await api(`/api/tasks/${id}`, { method:'PUT', body:JSON.stringify(body) });
    else    await api('/api/tasks', { method:'POST', body:JSON.stringify(body) });
    closeModal('taskModal');
    toast(id ? 'Task updated!' : 'Task created!', 'success');
    loadTasks();
  } catch (err) { toast(err.message, 'error'); }
});

async function deleteTask(id, title) {
  if (!confirm(`Delete task "${title}"?`)) return;
  try {
    await api(`/api/tasks/${id}`, { method:'DELETE' });
    toast('Task deleted', 'success'); loadTasks();
  } catch (err) { toast(err.message, 'error'); }
}

function openComplete(id, title) {
  document.getElementById('completeTaskId').value = id;
  document.getElementById('completionNote').value = '';
  openModal('completeModal');
}

async function submitCompletion() {
  const id = document.getElementById('completeTaskId').value;
  const note = document.getElementById('completionNote').value;
  try {
    await api(`/api/tasks/${id}/complete`, { method:'PATCH', body:JSON.stringify({ completion_note: note }) });
    closeModal('completeModal');
    toast('Daily update submitted! Task marked as completed 🎉', 'success');
    loadTasks();
  } catch (err) { toast(err.message, 'error'); }
}
