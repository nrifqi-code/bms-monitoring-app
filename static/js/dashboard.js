let voltageChart;

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

function initChart() {
  const canvas = document.getElementById('voltage-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  voltageChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Voltage',
        data: [],
        borderColor: '#1E88E5',
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y.toFixed(1)} V`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: '#F3F4F6' },
          ticks: {
            font: { family: 'Consolas', size: 9 },
            color: '#9CA3AF',
            maxTicksLimit: 6,
          },
        },
        y: {
          grid: { color: '#F3F4F6' },
          ticks: {
            font: { family: 'Consolas', size: 9 },
            color: '#9CA3AF',
          },
        },
      },
    },
  });
}

function updateChart(value) {
  if (!voltageChart) return;

  const labels = voltageChart.data.labels;
  const values = voltageChart.data.datasets[0].data;
  labels.push(new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }));
  values.push(value);

  if (labels.length > 100) {
    labels.shift();
    values.shift();
  }

  voltageChart.update('none');
}

function updateBattery(data) {
  setText('val-soc', data.soc.toFixed(1));
  setText('val-voltage', data.pack_voltage.toFixed(1));
  setText('val-current', data.pack_current.toFixed(1));
  setText('val-soh', data.soh.toFixed(1));
  setText('val-temp', data.temperature.toFixed(1));
  setText('val-status', data.status.toUpperCase());
  setWidth('bar-soc', data.soc);
  setWidth('bar-soh', data.soh);

  const mosfet = data.temperatures?.mosfet;
  setText('temp-warning', mosfet > 40 ? `MOSFET ${mosfet.toFixed(1)} C ^` : '-');

  const voltages = data.cells.map(cell => cell.voltage);
  const min = Math.min(...voltages);
  const max = Math.max(...voltages);
  setText('sum-cells', data.cells.length);
  setText('sum-max', `${max.toFixed(2)}V`);
  setText('sum-min', `${min.toFixed(2)}V`);
  setText('sum-diff', `${(max - min).toFixed(2)}V`);

  updateChart(data.pack_voltage);
}

function updatePackInfo(info) {
  setText('info-pack-id', info.pack_id);
  setText('info-model', info.battery_model);
  setText('info-capacity', `${info.nominal_capacity.toFixed(1)}Ah`);
  setText('info-nominal-voltage', `${info.nominal_voltage.toFixed(1)}V`);
  setText('info-cycle-count', info.cycle_count);
  setText('info-manufacturer', info.manufacturer);
}

function updateAlarms(alarms) {
  setText('alarm-count', alarms.length);

  const list = document.getElementById('recent-alarms');
  if (!list) return;

  list.innerHTML = alarms.slice(0, 4).map(alarm => {
    const color = alarm.severity === 'Critical' ? 'bg-red-500' : 'bg-amber-500';
    return `
      <div class="flex items-center gap-2 text-sm">
        <span class="w-2 h-2 rounded-full ${color} flex-shrink-0"></span>
        <span class="font-mono text-xs text-gray-400">${alarm.timestamp.slice(0, 5)}</span>
        <span class="text-gray-400 text-xs">&middot;</span>
        <span class="text-gray-700 truncate">${alarm.title}</span>
      </div>
    `;
  }).join('');
}

function updateConnection(info) {
  setText('sidebar-port', info.com_port);
  setText('sidebar-status', 'Connected');
}

async function refresh() {
  const [battery, alarms, packInfo, connection] = await Promise.all([
    api.getBatteryData(),
    api.getActiveAlarms(),
    api.getBatteryPackInfo(),
    api.getConnectionInfo(),
  ]);

  updateBattery(battery);
  updateAlarms(alarms);
  updatePackInfo(packInfo);
  updateConnection(connection);
}

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  initChart();
  refresh();
  setInterval(refresh, 2000);
});
