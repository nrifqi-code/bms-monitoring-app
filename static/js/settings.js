function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function setChecked(id, value) {
  const el = document.getElementById(id);
  if (el) el.checked = value;
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

function stepNumber(id, delta) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = Math.max(Number(el.min || 0), Number(el.value || 0) + delta);
}

function renderBatteryInfo(info) {
  const el = document.getElementById('battery-info');
  if (!el) return;
  el.innerHTML = [
    ['Pack ID', info.pack_id],
    ['Battery Model', info.battery_model],
    ['Nominal Capacity', `${info.nominal_capacity.toFixed(1)} Ah`],
    ['Nominal Voltage', `${info.nominal_voltage.toFixed(1)} V`],
    ['Max Charge Voltage', `${info.max_charge_voltage.toFixed(1)} V`],
    ['Max Discharge Current', `${info.max_discharge_current.toFixed(1)} A`],
    ['Cycle Count', info.cycle_count],
    ['Manufacture Date', info.manufacture_date],
    ['Manufacturer', info.manufacturer],
  ].map(([label, value]) => `
    <div class="flex items-center justify-between py-2 border-b border-gray-50">
      <span class="text-sm text-gray-500">${label}</span>
      <span class="font-mono text-sm text-gray-900">${value}</span>
    </div>
  `).join('');
}

async function loadSettings() {
  const [settings, packInfo, connection] = await Promise.all([
    api.getSettings(),
    api.getBatteryPackInfo(),
    api.getConnectionInfo(),
  ]);

  const comm = settings.communication;
  const alarm = settings.alarm_threshold;
  const db = settings.database;
  const app = settings.application;

  setValue('set-com-port', comm.com_port);
  setValue('set-baud', comm.baud_rate);
  setValue('set-protocol', comm.protocol);
  setValue('set-refresh', comm.refresh_interval);
  setValue('set-data-bits', comm.data_bits);
  setValue('set-stop-bits', comm.stop_bits);
  setValue('set-parity', comm.parity);
  setValue('set-low-soc', alarm.low_soc);
  setValue('set-full-charge', alarm.full_charge);
  setValue('set-max-temp', alarm.max_temperature);
  setValue('set-min-cell', alarm.min_cell_voltage);
  setValue('set-max-cell', alarm.max_cell_voltage);
  setChecked('set-auto-save', db.auto_save);
  setValue('set-save-interval', db.save_interval);
  setValue('set-export-path', db.export_path);
  setValue('set-theme', app.theme);
  setValue('set-language', app.language);
  setChecked('set-startup', app.start_on_boot);
  setText('sidebar-port', connection.com_port);
  setText('sidebar-status', 'Connected');
  renderBatteryInfo(packInfo);
}

function readSettings() {
  return {
    communication: {
      com_port: document.getElementById('set-com-port').value,
      baud_rate: Number(document.getElementById('set-baud').value),
      protocol: document.getElementById('set-protocol').value,
      refresh_interval: Number(document.getElementById('set-refresh').value),
      data_bits: Number(document.getElementById('set-data-bits').value),
      stop_bits: Number(document.getElementById('set-stop-bits').value),
      parity: document.getElementById('set-parity').value,
    },
    alarm_threshold: {
      low_soc: Number(document.getElementById('set-low-soc').value),
      full_charge: Number(document.getElementById('set-full-charge').value),
      max_temperature: Number(document.getElementById('set-max-temp').value),
      min_cell_voltage: Number(document.getElementById('set-min-cell').value),
      max_cell_voltage: Number(document.getElementById('set-max-cell').value),
    },
    database: {
      auto_save: document.getElementById('set-auto-save').checked,
      save_interval: Number(document.getElementById('set-save-interval').value),
      export_path: document.getElementById('set-export-path').value,
    },
    application: {
      theme: document.getElementById('set-theme').value,
      language: document.getElementById('set-language').value,
      start_on_boot: document.getElementById('set-startup').checked,
    },
  };
}

async function saveSettings() {
  await api.saveSettings(readSettings());
}

async function testConnection() {
  const result = await api.testConnection();
  const el = document.getElementById('test-result');
  if (!el) return;
  el.classList.remove('hidden');
  el.classList.add('flex');
  el.querySelector('.font-mono').textContent = `Connected - ${result.response_time_ms}ms`;
}

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  loadSettings();
});
