let currentTab = 'monitoring';
let currentFilter = 'today';
let currentPage = 1;
let currentRows = [];
let currentMeta = { total: 0, per_page: 15, total_pages: 1 };

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function startClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };
  tick();
  setInterval(tick, 1000);
}

function severityBadge(severity) {
  if (severity === 'Critical') {
    return 'border-red-300 bg-red-50 text-red-600';
  }
  if (severity === 'Warning') {
    return 'border-amber-300 bg-amber-50 text-amber-600';
  }
  return 'border-blue-300 bg-blue-50 text-blue-600';
}

function renderMonitoring(rows) {
  const body = document.getElementById('log-table-body');
  if (!body) return;

  body.innerHTML = rows.map((row, index) => {
    const highTemp = row.temperature > 40;
    const trClass = highTemp
      ? 'border-b border-amber-100 bg-amber-50/50'
      : `border-b border-gray-50 hover:bg-gray-50/50 ${index % 2 ? 'bg-gray-50' : 'bg-white'}`;
    const tempClass = highTemp
      ? 'px-4 py-2.5 font-mono text-sm font-bold text-red-600'
      : 'px-4 py-2.5 font-mono text-sm text-gray-900';

    return `
      <tr class="${trClass}">
        <td class="px-4 py-2.5 font-mono text-xs text-gray-400">${row.timestamp}</td>
        <td class="px-4 py-2.5 font-mono text-sm text-gray-900">${row.voltage.toFixed(1)}</td>
        <td class="px-4 py-2.5 font-mono text-sm text-gray-900">${row.current.toFixed(1)}</td>
        <td class="px-4 py-2.5 font-mono text-sm text-gray-900">${row.soc.toFixed(1)}</td>
        <td class="px-4 py-2.5 font-mono text-sm text-gray-900">${row.soh.toFixed(1)}</td>
        <td class="${tempClass}">${row.temperature.toFixed(1)}</td>
      </tr>
    `;
  }).join('');
}

function renderAlarms(rows) {
  const body = document.getElementById('alarm-table-body');
  if (!body) return;

  body.innerHTML = rows.map((row, index) => `
    <tr class="border-b border-gray-50 hover:bg-gray-50/50 ${index % 2 ? 'bg-gray-50' : 'bg-white'}">
      <td class="px-4 py-2.5 font-mono text-xs text-gray-400">${row.time}</td>
      <td class="px-4 py-2.5 text-sm text-gray-900">${row.alarm}</td>
      <td class="px-4 py-2.5">
        <span class="text-xs font-semibold px-2 py-0.5 rounded border ${severityBadge(row.severity)}">${row.severity.toUpperCase()}</span>
      </td>
      <td class="px-4 py-2.5 font-mono text-sm text-gray-900">${row.status}</td>
    </tr>
  `).join('');
}

function renderPagination(meta) {
  const start = meta.total ? ((currentPage - 1) * meta.per_page) + 1 : 0;
  const end = Math.min(currentPage * meta.per_page, meta.total);
  const buttons = document.getElementById('pagination-buttons');

  document.getElementById('pagination-info').innerHTML = `
    Showing <span class="font-mono font-semibold text-gray-700">${start}-${end}</span>
    of <span class="font-mono font-semibold text-gray-700">${meta.total}</span> records
  `;

  if (!buttons) return;
  buttons.innerHTML = `
    <button class="px-2 py-1 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30"
            ${currentPage <= 1 ? 'disabled' : ''} onclick="goPage(${currentPage - 1})" type="button">&lt;</button>
    <span class="px-2.5 py-1 text-sm bg-blue-600 text-white rounded font-semibold font-mono">${currentPage}</span>
    <button class="px-2 py-1 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30"
            ${currentPage >= meta.total_pages ? 'disabled' : ''} onclick="goPage(${currentPage + 1})" type="button">&gt;</button>
  `;
}

async function loadHistory() {
  const result = currentTab === 'monitoring'
    ? await api.getMonitoringLog(currentPage, 15, currentFilter)
    : await api.getAlarmHistory(currentPage, 15, currentFilter);

  currentRows = result.data;
  currentMeta = result;
  if (currentTab === 'monitoring') renderMonitoring(result.data);
  else renderAlarms(result.data);
  renderPagination(result);
}

function switchTab(tab) {
  currentTab = tab;
  currentPage = 1;
  document.getElementById('monitoring-table')?.classList.toggle('hidden', tab !== 'monitoring');
  document.getElementById('alarm-table')?.classList.toggle('hidden', tab !== 'alarms');
  loadHistory();
}

function applyFilter(filter) {
  currentFilter = filter;
  currentPage = 1;
  loadHistory();
}

function applyCustomFilter() {
  currentFilter = `${document.getElementById('date-from').value}:${document.getElementById('date-to').value}`;
  currentPage = 1;
  loadHistory();
}

function goPage(page) {
  currentPage = Math.max(1, Math.min(page, currentMeta.total_pages));
  loadHistory();
}

function exportData(format) {
  if (format === 'pdf') {
    window.print();
    return;
  }

  const headers = currentTab === 'monitoring'
    ? ['timestamp', 'voltage', 'current', 'soc', 'soh', 'temperature']
    : ['time', 'alarm', 'severity', 'status'];
  const csv = [
    headers.join(','),
    ...currentRows.map(row => headers.map(key => JSON.stringify(row[key] ?? '')).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `bms-${currentTab}.${format === 'excel' ? 'xls' : 'csv'}`;
  link.click();
  URL.revokeObjectURL(link.href);
}

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  loadHistory();
});
