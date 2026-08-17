function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setWidth(id, value) {
  const el = document.getElementById(id);
  if (el) el.style.width = `${Math.max(0, Math.min(100, value))}%`;
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

function cellPercent(voltage) {
  return ((voltage - 3.0) / 0.65) * 100;
}

function cellMarkup(cell, highest) {
  const isHighest = cell.voltage === highest;
  const low = cell.status === 'Low';
  const warning = cell.status === 'Warning';
  let box = 'bg-gray-50 border border-gray-200';
  let label = 'text-gray-400';
  let value = 'text-gray-900';
  let barBg = 'bg-gray-200';
  let bar = 'bg-gray-400';
  let hint = 'V';

  if (isHighest) {
    box = 'bg-gray-50 border-[1.5px] border-blue-500';
    label = 'text-blue-500';
    value = 'text-blue-600';
    barBg = 'bg-blue-100';
    bar = 'bg-blue-500';
    hint = 'V ^ Highest';
  }
  if (warning) {
    box = 'bg-amber-50 border-[1.5px] border-amber-400';
    label = 'text-amber-600';
    value = 'text-amber-600';
    barBg = 'bg-amber-200';
    bar = 'bg-amber-500';
    hint = 'V - Warning';
  }
  if (low) {
    box = 'bg-red-50 border-[1.5px] border-red-400';
    label = 'text-red-600';
    value = 'text-red-600';
    barBg = 'bg-red-200';
    bar = 'bg-red-500';
    hint = 'V - Low';
  }

  return `
    <div class="${box} rounded p-3">
      <div class="text-[10px] font-semibold ${label} uppercase tracking-wide mb-1">
        C${String(cell.id).padStart(2, '0')}
      </div>
      <div class="font-mono text-2xl font-bold ${value}">${cell.voltage.toFixed(2)}</div>
      <div class="font-mono text-xs ${label}">${hint}</div>
      <div class="mt-2 h-[3px] ${barBg} rounded-full">
        <div class="h-[3px] ${bar} rounded-full" style="width:${cellPercent(cell.voltage)}%"></div>
      </div>
    </div>
  `;
}

function renderTemperatures(temperatures) {
  const rows = [
    ['MOSFET', temperatures.mosfet, 'text-red-600', 'bg-red-500'],
    ['Cell Group', temperatures.cell_group, 'text-amber-600', 'bg-amber-500'],
    ['Ambient', temperatures.ambient, 'text-gray-900', 'bg-gray-400'],
  ];

  const list = document.getElementById('temp-list');
  if (!list) return;
  list.innerHTML = rows.map(([label, value, text, bar]) => `
    <div>
      <div class="flex items-center justify-between py-1">
        <span class="text-sm text-gray-500">${label}</span>
        <span class="font-mono text-sm ${text}">${value.toFixed(1)} C</span>
      </div>
      <div class="h-[3px] bg-gray-100 rounded-full">
        <div class="h-[3px] ${bar} rounded-full" style="width:${Math.min(100, value * 2)}%"></div>
      </div>
    </div>
  `).join('');
}

function updateBattery(data) {
  const grid = document.getElementById('cell-grid');
  const voltages = data.cells.map(cell => cell.voltage);
  const min = Math.min(...voltages);
  const max = Math.max(...voltages);
  const avg = voltages.reduce((sum, value) => sum + value, 0) / voltages.length;
  const diff = max - min;
  const minCell = data.cells.find(cell => cell.voltage === min);
  const maxCell = data.cells.find(cell => cell.voltage === max);

  if (grid) grid.innerHTML = data.cells.map(cell => cellMarkup(cell, max)).join('');

  setText('cell-min', `${min.toFixed(2)}V`);
  setText('cell-min-id', `C${String(minCell.id).padStart(2, '0')}`);
  setText('cell-avg', `${avg.toFixed(2)}V`);
  setText('cell-max', `${max.toFixed(2)}V`);
  setText('cell-max-id', `C${String(maxCell.id).padStart(2, '0')}`);
  setText('cell-diff', `${diff.toFixed(2)}V`);
  setText('ov-max', max.toFixed(2));
  setText('ov-min', min.toFixed(2));
  setText('ov-avg', avg.toFixed(2));
  setText('ov-diff', diff.toFixed(2));

  document.getElementById('cell-limit')?.classList.toggle('hidden', diff <= 0.1);
  setWidth('bar-max', cellPercent(max));
  setWidth('bar-min', cellPercent(min));
  setWidth('bar-avg', cellPercent(avg));
  setWidth('bar-diff', diff * 500);

  renderTemperatures(data.temperatures);
}

async function refresh() {
  const data = await api.getBatteryData();
  updateBattery(data);
}

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  refresh();
  setInterval(refresh, 2000);
});
