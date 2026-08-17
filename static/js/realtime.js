const CHART_COLORS = {
  voltage: '#1E88E5',
  current: '#D97706',
  temp: '#DC2626',
  soc: '#16A34A',
  soh: '#4B5563',
};

let liveChart;
let activeChart = 'voltage';
let trendRange = '5m';
const trendHistory = [];
const sparkCharts = {};

const RANGE_MS = {
  '5m': 5 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

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

function chartBase(color) {
  return {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderColor: color,
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.35,
      }],
    },
    options: {
      responsive: false,
      animation: { duration: 0 },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
    },
  };
}

function initCharts() {
  if (typeof Chart === 'undefined') return;

  const liveCanvas = document.getElementById('live-chart');
  if (liveCanvas) {
    liveChart = new Chart(liveCanvas, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Voltage',
          data: [],
          borderColor: CHART_COLORS.voltage,
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
          tooltip: { callbacks: { label: ctx => `${ctx.parsed.y.toFixed(1)}` } },
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

  [
    ['spark-voltage', 'voltage'],
    ['spark-current', 'current'],
    ['spark-soc', 'soc'],
    ['spark-soh', 'soh'],
    ['spark-temp', 'temp'],
    ['mini-voltage', 'voltage'],
    ['mini-current', 'current'],
    ['mini-temp', 'temp'],
  ].forEach(([id, key]) => {
    const canvas = document.getElementById(id);
    if (canvas) sparkCharts[id] = new Chart(canvas, chartBase(CHART_COLORS[key]));
  });
}

function pushPoint(chart, value, label, maxPoints = 100) {
  if (!chart) return;

  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(value);
  if (chart.data.labels.length > maxPoints) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update('none');
}

function renderLiveChart() {
  if (!liveChart) return;

  const cutoff = Date.now() - RANGE_MS[trendRange];
  const visible = trendHistory.filter(point => point.time >= cutoff);
  liveChart.data.labels = visible.map(point => new Date(point.time).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }));
  liveChart.data.datasets[0].data = visible.map(point => point[activeChart]);
  liveChart.update('none');
}

function setTrendRange(range) {
  trendRange = range;
  document.querySelectorAll('[data-trend-range]').forEach(button => {
    const active = button.dataset.trendRange === range;
    button.classList.toggle('text-blue-600', active);
    button.classList.toggle('border-b-2', active);
    button.classList.toggle('font-semibold', active);
    button.classList.toggle('text-gray-400', !active);
  });
  renderLiveChart();
}

function getChartValue(data, key) {
  if (key === 'current') return data.pack_current;
  if (key === 'temp') return data.temperature;
  return data.pack_voltage;
}

function chartUnit(key) {
  if (key === 'current') return 'A';
  if (key === 'temp') return 'C';
  return 'V';
}

function switchChart(tab) {
  activeChart = tab;
  if (!liveChart) return;

  liveChart.data.datasets[0].label = tab;
  liveChart.data.datasets[0].borderColor = CHART_COLORS[tab];
  renderLiveChart();
}

function updateBattery(data) {
  const label = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  setText('rt-voltage', data.pack_voltage.toFixed(1));
  setText('rt-current', data.pack_current.toFixed(1));
  setText('rt-soc', data.soc.toFixed(1));
  setText('rt-soh', data.soh.toFixed(1));
  setText('rt-temp', data.temperature.toFixed(1));
  setText('chart-current-val', `${getChartValue(data, activeChart).toFixed(1)} ${chartUnit(activeChart)}`);
  setText('last-voltage', `${data.pack_voltage.toFixed(1)} V`);
  setText('last-current', `${data.pack_current.toFixed(1)} A`);
  setText('last-temp', `${data.temperature.toFixed(1)} C`);
  setText('last-update', label);

  trendHistory.push({
    time: Date.now(),
    voltage: data.pack_voltage,
    current: data.pack_current,
    temp: data.temperature,
  });
  const cutoff = Date.now() - RANGE_MS['24h'];
  while (trendHistory.length && trendHistory[0].time < cutoff) trendHistory.shift();
  renderLiveChart();
  pushPoint(sparkCharts['spark-voltage'], data.pack_voltage, label, 20);
  pushPoint(sparkCharts['spark-current'], data.pack_current, label, 20);
  pushPoint(sparkCharts['spark-soc'], data.soc, label, 20);
  pushPoint(sparkCharts['spark-soh'], data.soh, label, 20);
  pushPoint(sparkCharts['spark-temp'], data.temperature, label, 20);
  pushPoint(sparkCharts['mini-voltage'], data.pack_voltage, label, 20);
  pushPoint(sparkCharts['mini-current'], data.pack_current, label, 20);
  pushPoint(sparkCharts['mini-temp'], data.temperature, label, 20);
}

function updateStatus(status) {
  setText('status-charging', status.charging_status);
  setText('status-balancer', status.balancer);
  setText('status-mosfet', status.mosfet);
  setText('status-communication', status.communication);
  setText('status-heater', status.heater);
}

function updateConnection(info) {
  setText('sidebar-port', info.com_port);
  setText('sidebar-status', 'Connected');
  setText('conn-port', info.com_port);
  setText('conn-baud', info.baud_rate);
  setText('conn-protocol', info.protocol);
  setText('conn-refresh', `${info.refresh_interval} ms`);
  setText('conn-last-update', info.last_update);
  setText('sys-firmware', info.firmware_version);
  setText('sys-hardware', info.hardware_version);
  setText('sys-serial', info.serial_number);
  setText('sys-uptime', info.uptime);
  setText('last-refresh', `${info.refresh_interval} ms`);
}

async function refresh() {
  const [battery, status, connection] = await Promise.all([
    api.getBatteryData(),
    api.getLiveStatus(),
    api.getConnectionInfo(),
  ]);

  updateBattery(battery);
  updateStatus(status);
  updateConnection(connection);
}

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  initCharts();
  refresh();
  setInterval(refresh, 1000);
});
