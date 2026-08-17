const USE_DUMMY = true;
const API_BASE = "http://localhost:5000/api";

const DUMMY = {
  batteryData: {
    soc: 95.0,
    soh: 98.0,
    pack_voltage: 52.4,
    pack_current: 15.8,
    temperature: 30.0,
    status: "Charging",
    cells: [
      ...Array.from({ length: 14 }, (_, i) => ({
        id: i + 1,
        voltage: parseFloat((3.24 + (i % 3) * 0.02).toFixed(2)),
        status: "Normal",
      })),
      { id: 15, voltage: 3.18, status: "Warning" },
      { id: 16, voltage: 3.1, status: "Low" },
    ],
    temperatures: { mosfet: 45.0, cell_group: 32.0, ambient: 28.0 },
    timestamp: new Date().toISOString(),
  },

  liveStatus: {
    charging_status: "Active",
    balancer: "Active",
    mosfet: "Normal",
    communication: "Connected",
    heater: "OFF",
  },

  connectionInfo: {
    com_port: "COM3",
    baud_rate: 9600,
    protocol: "Modbus RTU",
    refresh_interval: 1000,
    last_update: "10:35:44",
    firmware_version: "v2.1.3",
    hardware_version: "BMS-HW-v3",
    serial_number: "SRE-2024-001",
    uptime: "02:45:13",
  },

  batteryPackInfo: {
    pack_id: "BMS-PACK-001",
    battery_model: "LiFePO4 16S 100Ah",
    nominal_capacity: 100.0,
    nominal_voltage: 51.2,
    max_charge_voltage: 58.4,
    max_discharge_current: 100.0,
    cycle_count: 128,
    manufacture_date: "2024-01-15",
    manufacturer: "SR Energy Co.",
  },

  activeAlarms: [
    {
      id: 1,
      type: "high_temp",
      title: "High Temperature Warning",
      description: "MOSFET temp exceeded 40 C - reading: 45 C",
      severity: "Critical",
      status: "Active",
      timestamp: "10:18:32",
      source: "Temperature Sensor 2",
    },
    {
      id: 2,
      type: "low_battery",
      title: "Low Battery - 18%",
      description: "SOC below 20% threshold",
      severity: "Critical",
      status: "Active",
      timestamp: "10:22:15",
      source: "Battery Pack A",
    },
    {
      id: 3,
      type: "comm_lost",
      title: "Communication Lost",
      description: "No response after 3000ms timeout",
      severity: "Warning",
      status: "Active",
      timestamp: "10:25:00",
      source: "COM3 Port",
    },
  ],

  monitoringLog: (page = 1, perPage = 15) => ({
    data: Array.from({ length: perPage }, (_, i) => ({
      timestamp: `2026-07-23 10:${String(35 - i).padStart(2, "0")}:44`,
      voltage: parseFloat((52.4 - i * 0.1).toFixed(1)),
      current: parseFloat((15.8 - i * 0.1).toFixed(1)),
      soc: parseFloat((95.0 - i * 0.3).toFixed(1)),
      soh: 98.0,
      temperature:
        i === 5 ? 45.0 : parseFloat((30 + Math.random() * 2 - 1).toFixed(1)),
    })),
    total: 150,
    page,
    per_page: perPage,
    total_pages: 10,
  }),

  alarmHistory: {
    data: [
      {
        time: "10:18:32",
        alarm: "High Temperature Warning",
        severity: "Critical",
        status: "Active",
      },
      {
        time: "09:52:11",
        alarm: "Charging Started",
        severity: "Info",
        status: "Resolved",
      },
      {
        time: "09:45:03",
        alarm: "System Check",
        severity: "Info",
        status: "Resolved",
      },
    ],
    total: 30,
    page: 1,
    per_page: 15,
    total_pages: 2,
  },

  settings: {
    communication: {
      com_port: "COM3",
      baud_rate: 9600,
      protocol: "Modbus RTU",
      refresh_interval: 1000,
      data_bits: 8,
      stop_bits: 1,
      parity: "None",
    },
    alarm_threshold: {
      low_soc: 20.0,
      full_charge: 80.0,
      max_temperature: 40.0,
      min_cell_voltage: 3.1,
      max_cell_voltage: 3.65,
    },
    database: {
      auto_save: true,
      save_interval: 60,
      export_path: "C:/BMS/exports/",
    },
    application: { theme: "Light", language: "id", start_on_boot: false },
  },
};

async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    hideError();
    return json.data ?? json;
  } catch (err) {
    showError("Gagal mengambil data dari server");
    throw err;
  }
}

const api = {
  async getBatteryData() {
    if (USE_DUMMY) return DUMMY.batteryData;
    return apiFetch("/battery/data");
  },
  async getLiveStatus() {
    if (USE_DUMMY) return DUMMY.liveStatus;
    return apiFetch("/battery/live-status");
  },
  async getConnectionInfo() {
    if (USE_DUMMY) return DUMMY.connectionInfo;
    return apiFetch("/battery/connection");
  },
  async getBatteryPackInfo() {
    if (USE_DUMMY) return DUMMY.batteryPackInfo;
    return apiFetch("/battery/pack-info");
  },
  async getActiveAlarms() {
    if (USE_DUMMY) return DUMMY.activeAlarms;
    return apiFetch("/alarms/active");
  },
  async acknowledgeAlarm(id) {
    if (USE_DUMMY) return { success: true };
    return apiFetch(`/alarms/${id}/acknowledge`, { method: "PATCH" });
  },
  async acknowledgeAllAlarms() {
    if (USE_DUMMY) return { success: true };
    return apiFetch("/alarms/acknowledge-all", { method: "PATCH" });
  },
  async getMonitoringLog(page = 1, perPage = 15, filter = "today") {
    if (USE_DUMMY) return DUMMY.monitoringLog(page, perPage);
    return apiFetch(
      `/history/monitoring?page=${page}&per_page=${perPage}&filter=${filter}`,
    );
  },
  async getAlarmHistory(page = 1, perPage = 15, filter = "today") {
    if (USE_DUMMY) return DUMMY.alarmHistory;
    return apiFetch(
      `/history/alarms?page=${page}&per_page=${perPage}&filter=${filter}`,
    );
  },
  async getSettings() {
    if (USE_DUMMY) return DUMMY.settings;
    return apiFetch("/settings");
  },
  async saveSettings(data) {
    if (USE_DUMMY) return { success: true };
    return apiFetch("/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  async testConnection() {
    if (USE_DUMMY) return { connected: true, response_time_ms: 12 };
    return apiFetch("/connection/test", { method: "POST" });
  },
};

function showError(msg) {
  const el = document.getElementById("error-banner");
  const txt = document.getElementById("error-message");
  if (el) {
    el.classList.remove("hidden");
    if (txt) txt.textContent = msg;
  }
}

function hideError() {
  const el = document.getElementById("error-banner");
  if (el) el.classList.add("hidden");
}
