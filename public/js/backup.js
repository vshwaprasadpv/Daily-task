/* backup.js — Backup Management */
async function loadBackups() {
  try {
    const backups = await api('/api/backup');
    renderBackups(backups);
  } catch (err) { toast('Failed to load backups: '+err.message,'error'); }
}

function renderBackups(backups) {
  const el = document.getElementById('backupList');
  if (!backups.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">💾</div><h3>No backups yet</h3><p>Create your first backup to protect your data</p></div>`;
    return;
  }
  el.innerHTML = `<div class="backup-list">` + backups.map(b => `
    <div class="backup-item">
      <span style="font-size:28px;">📦</span>
      <div class="backup-info">
        <div class="filename">🗃️ ${b.filename}</div>
        <div class="meta">
          💾 ${(b.size/1024).toFixed(1)} KB &nbsp;·&nbsp;
          👤 ${b.created_by} &nbsp;·&nbsp;
          🕐 ${timeAgo(b.created_at)} (${new Date(b.created_at).toLocaleString('en-IN')})
        </div>
      </div>
      <div class="backup-actions">
        <button class="btn btn-sm btn-success" onclick="restoreBackup(${b.id},'${b.filename}')">♻️ Restore</button>
        <button class="btn btn-icon btn-danger" onclick="deleteBackup(${b.id})">🗑️</button>
      </div>
    </div>
  `).join('') + `</div>`;
}

async function createBackup() {
  if (!confirm('Create a new data backup snapshot now?')) return;
  try {
    toast('Creating backup...','info');
    const data = await api('/api/backup/create', { method:'POST' });
    toast(`Backup created: ${data.filename} (${(data.size/1024).toFixed(1)} KB)`, 'success');
    loadBackups();
  } catch (err) { toast('Backup failed: '+err.message,'error'); }
}

async function restoreBackup(id, filename) {
  if (!confirm(`Restore from backup "${filename}"?\n\nThis will merge backup data into the current database.`)) return;
  try {
    toast('Restoring backup...','info');
    await api(`/api/backup/restore/${id}`, { method:'POST' });
    toast('Backup restored successfully!','success');
  } catch (err) { toast('Restore failed: '+err.message,'error'); }
}

async function deleteBackup(id) {
  if (!confirm('Delete this backup file? This cannot be undone.')) return;
  try {
    await api(`/api/backup/${id}`, { method:'DELETE' });
    toast('Backup deleted','success'); loadBackups();
  } catch (err) { toast(err.message,'error'); }
}
