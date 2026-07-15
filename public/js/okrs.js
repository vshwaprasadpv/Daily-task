/* okrs.js — OKR Management */
let allOkrs = [];

async function loadOkrs() {
  try {
    allOkrs = await api('/api/okrs');
    renderOkrs(allOkrs);
  } catch (err) { toast('Failed to load OKRs: '+err.message,'error'); }
}

function renderOkrs(okrs) {
  const container = document.getElementById('okrsContainer');
  if (!okrs.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><h3>No OKRs yet</h3><p>Create your first Objective & Key Results</p></div>`;
    return;
  }
  container.innerHTML = okrs.map(o => {
    const pct = Math.round((o.overall_progress || 0) * 100);
    const color = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';
    return `
    <div class="card okr-card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;gap:12px;flex-wrap:wrap;">
        <div class="okr-objective">${o.objective}</div>
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
          <span style="font-size:18px;font-weight:700;color:${color};">${pct}%</span>
          ${isAdmin ? `<button class="btn btn-icon btn-ghost" onclick="editOkr(${o.id})" title="Edit">✏️</button>
          <button class="btn btn-icon btn-danger" onclick="deleteOkr(${o.id})" title="Delete">🗑️</button>` : ''}
        </div>
      </div>
      <div class="progress-bar" style="margin-bottom:16px;">
        <div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,${color},${color}88);"></div>
      </div>
      <div class="kr-list">
        ${(o.key_results||[]).map(kr => {
          const krPct = kr.target > 0 ? Math.min(Math.round(kr.current/kr.target*100),100) : 0;
          const krColor = krPct>=70?'var(--success)':krPct>=40?'var(--warning)':'var(--danger)';
          return `
          <div class="kr-item">
            <div class="kr-header">
              <span class="kr-title">${kr.title}</span>
              <div style="display:flex;align-items:center;gap:10px;">
                <span class="kr-count">${kr.current} / ${kr.target} (${krPct}%)</span>
                ${isAdmin ? `<button class="btn btn-sm btn-ghost" onclick="openUpdateKR(${o.id},${kr.id},'${kr.title.replace(/'/g,"\\'")}',${kr.current},${kr.target})">Update</button>` : ''}
              </div>
            </div>
            <div class="progress-bar" style="height:6px;">
              <div class="progress-fill" style="width:${krPct}%;background:${krColor};"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

let _krCount = 0;
function addKrRow(title='', target=100) {
  const id = ++_krCount;
  const div = document.createElement('div');
  div.id = 'kr-row-'+id;
  div.style.cssText = 'display:grid;grid-template-columns:1fr 100px auto;gap:10px;margin-bottom:10px;align-items:center;';
  div.innerHTML = `
    <input class="form-control kr-title" placeholder="Key result title..." value="${title}"/>
    <input class="form-control kr-target" type="number" min="1" placeholder="Target" value="${target}"/>
    <button type="button" class="btn btn-icon btn-danger" onclick="document.getElementById('kr-row-${id}').remove()">✕</button>`;
  document.getElementById('krRows').appendChild(div);
}

function openAddOkr() {
  document.getElementById('okrForm').reset();
  document.getElementById('okrId').value = '';
  document.getElementById('okrModalTitle').textContent = 'Add OKR';
  document.getElementById('krRows').innerHTML = '';
  _krCount = 0;
  addKrRow();
  openModal('okrModal');
}

async function editOkr(id) {
  const o = allOkrs.find(x => x.id === id);
  if (!o) return;
  document.getElementById('okrId').value = o.id;
  document.getElementById('okrObjective').value = o.objective;
  document.getElementById('okrModalTitle').textContent = 'Edit OKR';
  document.getElementById('krRows').innerHTML = ''; _krCount = 0;
  (o.key_results||[]).forEach(kr => addKrRow(kr.title, kr.target));
  openModal('okrModal');
}

document.getElementById('okrForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('okrId').value;
  const krs = Array.from(document.querySelectorAll('#krRows > div')).map(row => ({
    title:  row.querySelector('.kr-title').value,
    target: parseInt(row.querySelector('.kr-target').value) || 100,
    current: 0,
  })).filter(kr => kr.title.trim());
  const body = { objective: document.getElementById('okrObjective').value, key_results: krs };
  try {
    if (id) await api(`/api/okrs/${id}`, { method:'PUT', body:JSON.stringify(body) });
    else    await api('/api/okrs',        { method:'POST',body:JSON.stringify(body) });
    closeModal('okrModal');
    toast(id ? 'OKR updated!' : 'OKR created!', 'success');
    loadOkrs();
  } catch (err) { toast(err.message,'error'); }
});

async function deleteOkr(id) {
  if (!confirm('Delete this OKR and all its key results?')) return;
  try {
    await api(`/api/okrs/${id}`, { method:'DELETE' });
    toast('OKR deleted','success'); loadOkrs();
  } catch (err) { toast(err.message,'error'); }
}

function openUpdateKR(okrId, krId, title, current, target) {
  const val = prompt(`Update "${title}" (current: ${current} / ${target}):\n\nEnter new current value:`, current);
  if (val === null) return;
  const n = parseInt(val);
  if (isNaN(n) || n < 0) { toast('Please enter a valid number','error'); return; }
  api(`/api/okrs/${okrId}/key-results/${krId}`, { method:'PATCH', body:JSON.stringify({ current:n }) })
    .then(() => { toast('Key result updated!','success'); loadOkrs(); })
    .catch(err => toast(err.message,'error'));
}
