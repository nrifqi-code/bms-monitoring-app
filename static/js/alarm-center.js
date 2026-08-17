let alarms = [];
let severityFilter = "all";
const acknowledgedIds = new Set();

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function startClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };
  tick();
  setInterval(tick, 1000);
}

function badgeClass(severity) {
  return severity === "Critical"
    ? "border-red-300 bg-red-50 text-red-600"
    : "border-amber-300 bg-amber-50 text-amber-600";
}

function alarmMarkup(alarm) {
  const ack = acknowledgedIds.has(alarm.id);
  const border =
    alarm.severity === "Critical" ? "border-l-red-600" : "border-l-amber-500";
  const button =
    alarm.severity === "Critical"
      ? "border-red-400 text-red-600 hover:bg-red-50"
      : "border-amber-400 text-amber-600 hover:bg-amber-50";

  if (ack) {
    return `
      <div class="bg-white border border-gray-100 rounded overflow-hidden flex border-l-4 border-l-gray-300 opacity-40">
        <div class="flex-1 p-4 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-mono text-xs text-gray-400">${alarm.timestamp}</span>
            <span class="text-[10px] text-gray-400">&middot;</span>
            <span class="text-xs text-gray-400">${alarm.source}</span>
          </div>
          <div class="font-semibold text-gray-400 text-sm line-through">${alarm.title}</div>
          <div class="text-xs text-gray-400 mt-0.5 line-through">${alarm.description}</div>
        </div>
        <div class="flex items-center gap-2 pr-4 flex-shrink-0">
          <span class="text-xs font-semibold px-2 py-0.5 rounded border border-gray-300 bg-gray-50 text-gray-400">ACK</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="bg-white border border-gray-200 rounded overflow-hidden flex border-l-4 ${border}">
      <div class="flex-1 p-4 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-mono text-xs text-gray-400">${alarm.timestamp}</span>
          <span class="text-[10px] text-gray-400">&middot;</span>
          <span class="text-xs text-gray-400">${alarm.source}</span>
        </div>
        <div class="font-semibold text-gray-900 text-sm">${alarm.title}</div>
        <div class="text-xs text-gray-500 mt-0.5">${alarm.description}</div>
      </div>
      <div class="flex items-center gap-2 pr-4 flex-shrink-0">
        <span class="text-xs font-semibold px-2 py-0.5 rounded border ${badgeClass(alarm.severity)}">${alarm.severity.toUpperCase()}</span>
        <button onclick="acknowledgeAlarm(${alarm.id})"
          class="text-xs border ${button} rounded px-2 py-1 transition-colors font-medium"
          type="button">
          Ack
        </button>
      </div>
    </div>
  `;
}

function renderAlarms() {
  const list = document.getElementById("alarm-list");
  if (!list) return;

  const shown =
    severityFilter === "all"
      ? alarms
      : alarms.filter((alarm) => alarm.severity === severityFilter);
  list.innerHTML = shown.length
    ? shown.map(alarmMarkup).join("")
    : '<div class="bg-white border border-gray-300 rounded p-4 text-sm text-gray-500">No active alarms</div>';
}

function filterAlarms(severity) {
  severityFilter = severity;
  renderAlarms();
}

async function acknowledgeAlarm(id) {
  await api.acknowledgeAlarm(id);
  acknowledgedIds.add(id);
  renderAlarms();
}

async function acknowledgeAll() {
  await api.acknowledgeAllAlarms();
  alarms.forEach((alarm) => acknowledgedIds.add(alarm.id));
  renderAlarms();
}

async function refresh() {
  alarms = await api.getActiveAlarms();
  setText(
    "active-alarm-total",
    alarms.filter((alarm) => !acknowledgedIds.has(alarm.id)).length,
  );
  setText(
    "alarm-count",
    alarms.filter((alarm) => !acknowledgedIds.has(alarm.id)).length,
  );
  setText(
    "alarm-last-update",
    new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
  );
  renderAlarms();
}

document.addEventListener("DOMContentLoaded", () => {
  startClock();
  refresh();
  setInterval(refresh, 3000);
});
