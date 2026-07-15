/* users.js — User Management (Admin only) */
let allUsersData = [];

async function loadUsers() {
  try {
    allUsersData = await api('/api/users');
    renderUsers(allUsersData);
  } catch (err) { toast('Failed to load users: '+err.message,'error'); }
}

function renderUsers(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">👥</div><h3>No team members yet</h3></div></td></tr>`;
    return;
  }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">
            ${u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-weight:600;font-size:13px;">${u.name}</div>
            <div style="font-size:11px;color:var(--text-muted);">${u.employee_id||'—'}</div>
          </div>
        </div>
      </td>
      <td style="font-size:12px;color:var(--text-muted);">${u.email}</td>
      <td>${roleBadge(u.role)}</td>
      <td><span style="font-size:12px;">${u.department||'—'}</span></td>
      <td style="font-size:12px;">${u.employee_id||'—'}</td>
      <td>${statusBadge(u.status)}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-icon btn-ghost" onclick="editUser(${u.id})" title="Edit">✏️</button>
          <button class="btn btn-sm btn-ghost" onclick="toggleStatus(${u.id},'${u.name.replace(/'/g,"\\'")}','${u.status}')">${u.status==='active'?'🚫 Disable':'✅ Enable'}</button>
          <button class="btn btn-icon btn-danger" onclick="deleteUser(${u.id},'${u.name.replace(/'/g,"\\'")}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterUsers() {
  const q  = document.getElementById('userSearch').value.toLowerCase();
  const r  = document.getElementById('userRoleFilter').value;
  const st = document.getElementById('userStatusFilter').value;
  renderUsers(allUsersData.filter(u =>
    (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
    (!r || u.role === r) && (!st || u.status === st)
  ));
}

function openAddUser() {
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  document.getElementById('userModalTitle').textContent = 'Add Team Member';
  document.getElementById('userJoining').value = new Date().toISOString().slice(0,10);
  openModal('userModal');
}

async function editUser(id) {
  const u = allUsersData.find(x => x.id === id);
  if (!u) return;
  document.getElementById('userId').value = u.id;
  document.getElementById('userName').value = u.name;
  document.getElementById('userEmail').value = u.email;
  document.getElementById('userPhone').value = u.phone||'';
  document.getElementById('userRole').value  = u.role;
  document.getElementById('userDept').value  = u.department;
  document.getElementById('userEmpId').value = u.employee_id||'';
  document.getElementById('userManager').value = u.reporting_manager||'';
  document.getElementById('userJoining').value = u.joining_date ? u.joining_date.slice(0,10) : '';
  document.getElementById('userModalTitle').textContent = 'Edit Team Member';
  openModal('userModal');
}

document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('userId').value;
  const body = {
    name:             document.getElementById('userName').value,
    email:            document.getElementById('userEmail').value,
    password:         document.getElementById('userPassword').value,
    phone:            document.getElementById('userPhone').value,
    role:             document.getElementById('userRole').value,
    department:       document.getElementById('userDept').value,
    employee_id:      document.getElementById('userEmpId').value,
    reporting_manager:document.getElementById('userManager').value,
    joining_date:     document.getElementById('userJoining').value,
  };
  if (!id && !body.password) { toast('Password is required for new user','error'); return; }
  try {
    if (id) await api(`/api/users/${id}`, { method:'PUT', body:JSON.stringify(body) });
    else    await api('/api/users',        { method:'POST',body:JSON.stringify(body) });
    closeModal('userModal');
    toast(id ? 'Member updated!' : 'Member added!', 'success');
    loadUsers();
  } catch (err) { toast(err.message,'error'); }
});

async function toggleStatus(id, name, currentStatus) {
  const action = currentStatus === 'active' ? 'disable' : 'enable';
  if (!confirm(`${action.charAt(0).toUpperCase()+action.slice(1)} user "${name}"?`)) return;
  try {
    const data = await api(`/api/users/${id}/status`, { method:'PATCH' });
    toast(`${name} is now ${data.status}`, 'success'); loadUsers();
  } catch (err) { toast(err.message,'error'); }
}

async function deleteUser(id, name) {
  if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
  try {
    await api(`/api/users/${id}`, { method:'DELETE' });
    toast('User deleted', 'success'); loadUsers();
  } catch (err) { toast(err.message,'error'); }
}
