/* reports.js — Report Generator */
function downloadReport(type) {
  const timeframe = document.getElementById('reportTimeframe').value;
  const dept = document.getElementById('reportDept').value;
  const url = `/api/reports/${type}?timeframe=${timeframe}&department=${dept}`;
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('Authorization', 'Bearer '+token);

  // Use fetch + blob for download with auth header
  toast(`Generating ${type.toUpperCase()} report...`, 'info');
  fetch(url, { headers:{ Authorization:'Bearer '+token } })
    .then(res => {
      if (!res.ok) return res.json().then(d => { throw new Error(d.error); });
      return res.blob();
    })
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `creative-report-${timeframe}-${Date.now()}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast(`${type.toUpperCase()} report downloaded!`, 'success');
    })
    .catch(err => toast('Report failed: '+err.message, 'error'));
}
