# DESIGN.md — BMS Component Library
## HTML + Tailwind CSS + Alpine.js Snippets

> Dokumen ini adalah referensi komponen siap pakai untuk agent.
> Gunakan snippet ini sebagai dasar — jangan improvisasi desain di luar yang ada di sini.

---

## 1. Prinsip Wajib (Baca Dulu)

```
WARNA   → hanya untuk sinyal status. Bukan dekorasi.
ANGKA   → selalu font-mono (Consolas). Tanpa pengecualian.
BADGE   → hanya muncul untuk Warning dan Critical. Normal = teks abu biasa.
BORDER  → border border-gray-300 rounded. Bukan shadow-lg atau rounded-xl.
ELEMEN  → jangan tambah elemen tanpa fungsi/data.
```

---

## 2. Layout Shell (copy ke setiap halaman baru)

> **Catatan Flask:** Semua file berada di `templates/`. Gunakan `url_for` untuk
> referensi file static. Sidebar dan topbar di-include dari `templates/partials/`.

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>BMS — [Nama Halaman]</title>

  <!-- CDN Libraries -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: { extend: {
        fontFamily: { mono: ['Consolas', 'Courier New', 'monospace'] }
      }}
    }
  </script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <!-- Static files via Flask url_for -->
  <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
  <script src="{{ url_for('static', filename='js/api.js') }}"></script>
</head>
<body class="bg-gray-100 flex h-screen overflow-hidden font-sans">

  <!-- Sidebar — dari partials/ -->
  {% include 'partials/sidebar.html' %}

  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

    <!-- Error Banner (hidden by default, ditampilkan oleh api.js) -->
    <div id="error-banner"
      class="hidden bg-amber-50 border-b border-amber-200 px-5 py-2
             flex items-center gap-2 text-sm text-amber-700">
      <span class="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span>
      <span id="error-message">Koneksi ke server bermasalah...</span>
    </div>

    <!-- Topbar — dari partials/ -->
    {% include 'partials/topbar.html' %}

    <!-- Page Content -->
    <main class="flex-1 overflow-y-auto p-5">
      <!-- KONTEN HALAMAN DI SINI -->
    </main>

  </div>

  <!-- JS spesifik halaman — load terakhir setelah api.js -->
  <script src="{{ url_for('static', filename='js/[nama-halaman].js') }}" defer></script>
</body>
</html>
```

### Nav Item di sidebar.html — class aktif vs tidak aktif
```html
<!-- TIDAK AKTIF -->
<a href="{{ url_for('[route]') }}"
  class="flex items-center px-3 py-2.5 rounded text-sm w-full
         text-white/55 hover:bg-white/[0.06] hover:text-white transition-colors">
  [Nama Menu]
</a>

<!-- AKTIF — tambahkan pada halaman yang sesuai -->
<a href="{{ url_for('[route]') }}"
  class="flex items-center px-3 py-2.5 text-sm w-full font-semibold
         text-white bg-white/10 border-l-2 border-cyan-400">
  [Nama Menu]
</a>
```

> **Tip:** Gunakan variabel Jinja2 `{{ active_page }}` yang di-pass dari Flask route
> untuk menentukan item mana yang aktif secara dinamis:
> ```python
> # app/routes.py
> @app.route('/dashboard')
> def dashboard():
>     return render_template('dashboard.html', active_page='dashboard')
> ```
> ```html
> <!-- partials/sidebar.html -->
> <a href="{{ url_for('dashboard') }}"
>   class="... {% if active_page == 'dashboard' %}
>              bg-white/10 border-l-2 border-cyan-400 text-white font-semibold
>              {% else %}
>              text-white/55 hover:bg-white/[0.06] hover:text-white
>              {% endif %}">
>   Dashboard
> </a>
> ```

---

## 3. Metric Card

### Standard (tanpa progress bar)
```html
<div class="bg-white border border-gray-300 rounded p-4">
  <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
    PACK VOLTAGE
  </div>
  <div class="flex items-baseline gap-1">
    <span class="font-mono text-3xl font-bold text-gray-900" id="val-voltage">52.4</span>
    <span class="font-mono text-sm text-gray-500">V</span>
  </div>
  <!-- Status: HANYA tampilkan jika Warning/Critical -->
  <!-- <div class="text-xs text-amber-600 mt-1">Warning</div> -->
</div>
```

### Dengan Progress Bar (untuk SOC, SOH)
```html
<div class="bg-white border border-gray-300 rounded p-4">
  <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
    SOC
  </div>
  <div class="flex items-baseline gap-1 mb-2">
    <span class="font-mono text-3xl font-bold text-gray-900" id="val-soc">95.0</span>
    <span class="font-mono text-sm text-gray-500">%</span>
  </div>
  <div class="h-1 bg-gray-100 rounded-full overflow-hidden">
    <div class="h-1 bg-green-500 rounded-full transition-all duration-500"
         id="bar-soc" style="width: 95%"></div>
  </div>
</div>
```

### Dengan Sub-teks Peringatan (untuk Temperature)
```html
<div class="bg-white border border-gray-300 rounded p-4">
  <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
    TEMPERATURE
  </div>
  <div class="flex items-baseline gap-1">
    <span class="font-mono text-3xl font-bold text-gray-900" id="val-temp">30.0</span>
    <span class="font-mono text-sm text-gray-500">°C</span>
  </div>
  <!-- Sub-teks hanya muncul jika ada sensor yang abnormal -->
  <div class="text-xs text-red-600 mt-1 font-mono" id="temp-warning">
    MOSFET 45.0°C ↑
  </div>
</div>
```

### Dengan Sparkline (untuk Realtime)
```html
<div class="bg-white border border-gray-300 rounded p-4 relative">
  <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
    CURRENT
  </div>
  <div class="flex items-baseline gap-1">
    <span class="font-mono text-3xl font-bold text-gray-900" id="val-current">15.8</span>
    <span class="font-mono text-sm text-gray-500">A</span>
  </div>
  <!-- Sparkline di pojok kanan bawah -->
  <canvas id="spark-current" width="60" height="24"
    class="absolute bottom-3 right-3 opacity-70"></canvas>
</div>
```

---

## 4. Status Dot

```html
<!-- Connected / Active / Normal yang perlu ditampilkan -->
<span class="inline-block w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>

<!-- Warning -->
<span class="inline-block w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span>

<!-- Critical / Error -->
<span class="inline-block w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>

<!-- OFF / Inactive -->
<span class="inline-block w-2 h-2 rounded-full bg-gray-400 flex-shrink-0"></span>

<!-- Live indicator (berkedip) — untuk header chart Realtime -->
<span class="relative flex h-2 w-2">
  <span class="animate-ping absolute inline-flex h-full w-full
               rounded-full bg-green-400 opacity-75"></span>
  <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
</span>
```

---

## 5. Data Row (label | nilai)

```html
<!-- Single row -->
<div class="flex items-center justify-between py-2
            border-b border-gray-50 last:border-0">
  <span class="text-sm text-gray-500">COM Port</span>
  <span class="font-mono text-sm text-gray-900">COM3</span>
</div>

<!-- Panel flat list (tanpa card wrapper) -->
<div class="space-y-0">
  <div class="flex items-center justify-between py-2 border-b border-gray-50">
    <span class="text-sm text-gray-500">Pack ID</span>
    <span class="font-mono text-sm text-gray-900">BMS-PACK-001</span>
  </div>
  <div class="flex items-center justify-between py-2 border-b border-gray-50">
    <span class="text-sm text-gray-500">Battery Model</span>
    <span class="font-mono text-sm text-gray-900">LiFePO4 16S 100Ah</span>
  </div>
  <!-- dst -->
</div>
```

---

## 6. Section Header

```html
<!-- Header section di dalam panel -->
<div class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
  VOLTAGE TREND
</div>

<!-- Dengan divider bawah -->
<div class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest
            pb-2 border-b border-gray-100 mb-3">
  LIVE STATUS
</div>
```

---

## 7. Alarm Badge (HANYA untuk Warning/Critical)

```html
<!-- Critical -->
<span class="text-xs font-semibold px-2 py-0.5 rounded
             border border-red-300 bg-red-50 text-red-600">
  CRITICAL
</span>

<!-- Warning -->
<span class="text-xs font-semibold px-2 py-0.5 rounded
             border border-amber-300 bg-amber-50 text-amber-600">
  WARNING
</span>

<!-- Info -->
<span class="text-xs font-semibold px-2 py-0.5 rounded
             border border-blue-300 bg-blue-50 text-blue-600">
  INFO
</span>

<!-- Acknowledged -->
<span class="text-xs font-semibold px-2 py-0.5 rounded
             border border-gray-300 bg-gray-50 text-gray-400">
  ACK
</span>
```

---

## 8. Chart Tab Toggle (Alpine.js)

```html
<!-- Tab switcher untuk chart — underline bukan pill -->
<div x-data="{ tab: 'voltage' }" class="w-full">

  <!-- Tab buttons -->
  <div class="flex items-center gap-5 mb-3">
    <button @click="tab = 'voltage'; switchChart('voltage')"
      :class="tab === 'voltage'
        ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
        : 'text-gray-400 hover:text-gray-600'"
      class="text-sm pb-1 transition-colors">
      Voltage
    </button>
    <button @click="tab = 'current'; switchChart('current')"
      :class="tab === 'current'
        ? 'text-amber-600 border-b-2 border-amber-600 font-semibold'
        : 'text-gray-400 hover:text-gray-600'"
      class="text-sm pb-1 transition-colors">
      Current
    </button>
    <button @click="tab = 'temp'; switchChart('temp')"
      :class="tab === 'temp'
        ? 'text-red-600 border-b-2 border-red-600 font-semibold'
        : 'text-gray-400 hover:text-gray-600'"
      class="text-sm pb-1 transition-colors">
      Temp
    </button>

    <!-- Nilai terkini (kanan) -->
    <div class="ml-auto">
      <span class="font-mono text-lg font-bold" id="chart-current-val"
            :class="tab === 'voltage' ? 'text-blue-600' :
                    tab === 'current' ? 'text-amber-600' : 'text-red-600'">
        52.4 V
      </span>
    </div>
  </div>

  <!-- Canvas chart (satu canvas, data diganti via JS) -->
  <canvas id="live-chart" height="160"></canvas>

</div>
```

---

## 9. Cell Voltage Grid (Battery Status)

```html
<!-- Grid 4x4 untuk 16 sel -->
<div class="grid grid-cols-4 gap-2" id="cell-grid">

  <!-- Sel NORMAL (bg putih biasa — tidak ada warna hijau) -->
  <div class="bg-gray-50 border border-gray-200 rounded p-3">
    <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
      C01
    </div>
    <div class="font-mono text-2xl font-bold text-gray-900">3.27</div>
    <div class="font-mono text-xs text-gray-400">V</div>
    <div class="mt-2 h-[3px] bg-gray-200 rounded-full">
      <div class="h-[3px] bg-gray-400 rounded-full" style="width: 72%"></div>
    </div>
  </div>

  <!-- Sel HIGHEST (border biru, teks biru) -->
  <div class="bg-gray-50 border-[1.5px] border-blue-500 rounded p-3">
    <div class="text-[10px] font-semibold text-blue-500 uppercase tracking-wide mb-1">
      C04
    </div>
    <div class="font-mono text-2xl font-bold text-blue-600">3.28</div>
    <div class="font-mono text-xs text-blue-400">V ↑ Highest</div>
    <div class="mt-2 h-[3px] bg-blue-100 rounded-full">
      <div class="h-[3px] bg-blue-500 rounded-full" style="width: 100%"></div>
    </div>
  </div>

  <!-- Sel WARNING (bg kuning) -->
  <div class="bg-amber-50 border-[1.5px] border-amber-400 rounded p-3">
    <div class="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-1">
      C15
    </div>
    <div class="font-mono text-2xl font-bold text-amber-600">3.18</div>
    <div class="font-mono text-xs text-amber-500">V ↓ Warning</div>
    <div class="mt-2 h-[3px] bg-amber-200 rounded-full">
      <div class="h-[3px] bg-amber-500 rounded-full" style="width: 52%"></div>
    </div>
  </div>

  <!-- Sel LOW (bg merah) -->
  <div class="bg-red-50 border-[1.5px] border-red-400 rounded p-3">
    <div class="text-[10px] font-semibold text-red-600 uppercase tracking-wide mb-1">
      C16
    </div>
    <div class="font-mono text-2xl font-bold text-red-600">3.10</div>
    <div class="font-mono text-xs text-red-500">V ↓ Low</div>
    <div class="mt-2 h-[3px] bg-red-200 rounded-full">
      <div class="h-[3px] bg-red-500 rounded-full" style="width: 24%"></div>
    </div>
  </div>

</div>

<!-- Summary strip di bawah grid -->
<div class="mt-3 bg-gray-50 rounded p-3 flex items-center gap-6">
  <div>
    <div class="text-[9px] text-gray-400 uppercase tracking-wide">MIN</div>
    <div class="font-mono text-sm font-bold text-red-600">3.10V</div>
    <div class="text-[9px] text-gray-400">C16</div>
  </div>
  <div class="w-px h-8 bg-gray-200"></div>
  <div>
    <div class="text-[9px] text-gray-400 uppercase tracking-wide">AVG</div>
    <div class="font-mono text-sm font-bold text-gray-900">3.24V</div>
  </div>
  <div class="w-px h-8 bg-gray-200"></div>
  <div>
    <div class="text-[9px] text-gray-400 uppercase tracking-wide">MAX</div>
    <div class="font-mono text-sm font-bold text-blue-600">3.28V</div>
    <div class="text-[9px] text-gray-400">C04 · C07</div>
  </div>
  <div class="w-px h-8 bg-gray-200"></div>
  <div class="flex items-center gap-2">
    <div>
      <div class="text-[9px] text-gray-400 uppercase tracking-wide">DIFF</div>
      <div class="font-mono text-sm font-bold text-amber-600">0.18V</div>
    </div>
    <!-- Chip hanya muncul jika diff > threshold -->
    <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded
                 border border-amber-300 bg-amber-50 text-amber-600">
      ABOVE LIMIT
    </span>
  </div>
</div>
```

---

## 10. Alarm Item

```html
<!-- Alarm AKTIF — Critical -->
<div class="bg-white border border-gray-200 rounded overflow-hidden
            flex border-l-4 border-l-red-600">
  <div class="flex-1 p-4 min-w-0">
    <div class="flex items-center gap-2 mb-1">
      <span class="font-mono text-xs text-gray-400">10:18:32</span>
      <span class="text-[10px] text-gray-400">·</span>
      <span class="text-xs text-gray-400">Temperature Sensor 2</span>
    </div>
    <div class="font-semibold text-gray-900 text-sm">
      High Temperature Warning
    </div>
    <div class="text-xs text-gray-500 mt-0.5">
      MOSFET temp exceeded 40°C — reading: 45°C
    </div>
  </div>
  <div class="flex items-center gap-2 pr-4 flex-shrink-0">
    <span class="text-xs font-semibold px-2 py-0.5 rounded
                 border border-red-300 bg-red-50 text-red-600">CRITICAL</span>
    <button onclick="acknowledgeAlarm(1)"
      class="text-xs border border-red-400 text-red-600 rounded
             px-2 py-1 hover:bg-red-50 transition-colors font-medium">
      Ack
    </button>
  </div>
</div>

<!-- Alarm AKTIF — Warning -->
<div class="bg-white border border-gray-200 rounded overflow-hidden
            flex border-l-4 border-l-amber-500">
  <div class="flex-1 p-4 min-w-0">
    <div class="flex items-center gap-2 mb-1">
      <span class="font-mono text-xs text-gray-400">10:25:00</span>
      <span class="text-[10px] text-gray-400">·</span>
      <span class="text-xs text-gray-400">COM3 Port</span>
    </div>
    <div class="font-semibold text-gray-900 text-sm">Communication Lost</div>
    <div class="text-xs text-gray-500 mt-0.5">
      No response after 3000ms timeout
    </div>
  </div>
  <div class="flex items-center gap-2 pr-4 flex-shrink-0">
    <span class="text-xs font-semibold px-2 py-0.5 rounded
                 border border-amber-300 bg-amber-50 text-amber-600">WARNING</span>
    <button onclick="acknowledgeAlarm(3)"
      class="text-xs border border-amber-400 text-amber-600 rounded
             px-2 py-1 hover:bg-amber-50 transition-colors font-medium">
      Ack
    </button>
  </div>
</div>

<!-- Alarm ACKNOWLEDGED (redup + dicoret) -->
<div class="bg-white border border-gray-100 rounded overflow-hidden
            flex border-l-4 border-l-gray-300 opacity-40">
  <div class="flex-1 p-4 min-w-0">
    <div class="flex items-center gap-2 mb-1">
      <span class="font-mono text-xs text-gray-400">09:52:11</span>
    </div>
    <div class="font-semibold text-gray-400 text-sm line-through">
      Charging Started
    </div>
    <div class="text-xs text-gray-400 mt-0.5 line-through">
      Charger connected
    </div>
  </div>
  <div class="flex items-center gap-2 pr-4 flex-shrink-0">
    <span class="text-xs font-semibold px-2 py-0.5 rounded
                 border border-gray-300 bg-gray-50 text-gray-400">ACK</span>
  </div>
</div>
```

---

## 11. Tabel History

```html
<div class="overflow-x-auto">
  <table class="w-full text-sm">
    <thead>
      <tr class="bg-gray-100 border-b-2 border-gray-300">
        <th class="text-left px-4 py-2.5 text-[10px] font-semibold
                   text-gray-500 uppercase tracking-wider">Timestamp</th>
        <th class="text-left px-4 py-2.5 text-[10px] font-semibold
                   text-gray-500 uppercase tracking-wider">Voltage (V)</th>
        <th class="text-left px-4 py-2.5 text-[10px] font-semibold
                   text-gray-500 uppercase tracking-wider">Current (A)</th>
        <th class="text-left px-4 py-2.5 text-[10px] font-semibold
                   text-gray-500 uppercase tracking-wider">SOC (%)</th>
        <th class="text-left px-4 py-2.5 text-[10px] font-semibold
                   text-gray-500 uppercase tracking-wider">SOH (%)</th>
        <th class="text-left px-4 py-2.5 text-[10px] font-semibold
                   text-gray-500 uppercase tracking-wider">Temp (°C)</th>
      </tr>
    </thead>
    <tbody id="log-table-body">

      <!-- Row normal (alternating white / gray-50) -->
      <tr class="border-b border-gray-50 hover:bg-gray-50/50 bg-white">
        <td class="px-4 py-2.5 font-mono text-xs text-gray-400">
          2026-07-23 10:35:44
        </td>
        <td class="px-4 py-2.5 font-mono text-sm text-gray-900">52.4</td>
        <td class="px-4 py-2.5 font-mono text-sm text-gray-900">15.8</td>
        <td class="px-4 py-2.5 font-mono text-sm text-gray-900">95.0</td>
        <td class="px-4 py-2.5 font-mono text-sm text-gray-900">98.0</td>
        <td class="px-4 py-2.5 font-mono text-sm text-gray-900">30.0</td>
      </tr>

      <!-- Row alternating -->
      <tr class="border-b border-gray-50 hover:bg-gray-50/50 bg-gray-50">
        <!-- sama, hanya bg berbeda -->
      </tr>

      <!-- Row ANOMALI (suhu tinggi) — bg amber, nilai merah saja -->
      <tr class="border-b border-amber-100 bg-amber-50/50">
        <td class="px-4 py-2.5 font-mono text-xs text-gray-400">
          2026-07-23 10:30:44
        </td>
        <td class="px-4 py-2.5 font-mono text-sm text-gray-900">51.6</td>
        <td class="px-4 py-2.5 font-mono text-sm text-gray-900">15.0</td>
        <td class="px-4 py-2.5 font-mono text-sm text-gray-900">93.0</td>
        <td class="px-4 py-2.5 font-mono text-sm text-gray-900">98.0</td>
        <!-- Hanya nilai anomali yang merah -->
        <td class="px-4 py-2.5 font-mono text-sm font-bold text-red-600">
          45.0
        </td>
      </tr>

    </tbody>
  </table>
</div>

<!-- Pagination -->
<div class="flex items-center justify-between px-4 py-3
            border-t border-gray-100 mt-2">
  <span class="text-sm text-gray-500">
    Showing <span class="font-mono font-semibold text-gray-700">1–15</span>
    of <span class="font-mono font-semibold text-gray-700">150</span> records
  </span>
  <div class="flex items-center gap-1">
    <button class="px-2 py-1 text-sm text-gray-500 hover:text-gray-900
                   disabled:opacity-30" id="btn-prev">‹</button>
    <!-- Halaman aktif -->
    <button class="px-2.5 py-1 text-sm bg-blue-600 text-white rounded
                   font-semibold">1</button>
    <button class="px-2.5 py-1 text-sm text-gray-500 hover:text-gray-900
                   rounded">2</button>
    <button class="px-2.5 py-1 text-sm text-gray-500 hover:text-gray-900
                   rounded">3</button>
    <span class="px-1 text-gray-400 text-sm">...</span>
    <button class="px-2.5 py-1 text-sm text-gray-500 hover:text-gray-900
                   rounded">10</button>
    <button class="px-2 py-1 text-sm text-gray-500 hover:text-gray-900"
            id="btn-next">›</button>
  </div>
</div>
```

---

## 12. Settings — Advanced Accordion (Alpine.js)

```html
<!-- Advanced Settings yang collapsed by default -->
<div x-data="{ open: false }" class="border-b border-gray-50">
  <button @click="open = !open"
    class="w-full flex items-center justify-between py-4 text-left">
    <span class="text-sm font-semibold text-gray-700">
      Advanced Serial Settings
    </span>
    <div class="flex items-center gap-2">
      <span class="text-xs text-gray-400">Data bits · Stop bits · Parity</span>
      <span class="text-gray-400 text-xs transition-transform duration-200"
            :class="open ? 'rotate-180' : ''">▾</span>
    </div>
  </button>
  <div x-show="open" x-transition
    class="pb-4 grid grid-cols-3 gap-3">
    <div>
      <label class="block text-xs text-gray-500 mb-1">Data Bits</label>
      <select class="w-full border border-gray-300 rounded px-3 py-2
                     text-sm font-mono text-gray-900 bg-white">
        <option>8</option>
        <option>7</option>
      </select>
    </div>
    <div>
      <label class="block text-xs text-gray-500 mb-1">Stop Bits</label>
      <select class="w-full border border-gray-300 rounded px-3 py-2
                     text-sm font-mono text-gray-900 bg-white">
        <option>1</option>
        <option>2</option>
      </select>
    </div>
    <div>
      <label class="block text-xs text-gray-500 mb-1">Parity</label>
      <select class="w-full border border-gray-300 rounded px-3 py-2
                     text-sm font-mono text-gray-900 bg-white">
        <option>None</option>
        <option>Even</option>
        <option>Odd</option>
      </select>
    </div>
  </div>
</div>
```

---

## 13. Chart.js Config

### Line Chart Standar (Voltage Trend)
```javascript
const chartConfig = {
  type: 'line',
  data: {
    labels: [],  // timestamp labels
    datasets: [{
      label: 'Voltage',
      data: [],
      borderColor: '#1E88E5',     // biru
      borderWidth: 1.5,
      pointRadius: 0,             // tidak ada titik — garis saja
      fill: false,                // tidak ada area fill
      tension: 0.3,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },   // matikan animasi untuk real-time
    plugins: {
      legend: { display: false }, // tidak ada legend
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.parsed.y.toFixed(1)} V`
        }
      }
    },
    scales: {
      x: {
        grid: { color: '#F3F4F6' },  // grid lines abu sangat tipis
        ticks: {
          font: { family: 'Consolas', size: 9 },
          color: '#9CA3AF',
          maxTicksLimit: 6,
        }
      },
      y: {
        grid: { color: '#F3F4F6' },
        ticks: {
          font: { family: 'Consolas', size: 9 },
          color: '#9CA3AF',
        }
      }
    }
  }
};
```

### Update Chart Real-time
```javascript
function updateChart(chart, newValue, newLabel) {
  const MAX_POINTS = 100;
  chart.data.labels.push(newLabel);
  chart.data.datasets[0].data.push(newValue);

  // Hapus data lama jika melebihi buffer
  if (chart.data.labels.length > MAX_POINTS) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }

  chart.update('none'); // 'none' = tanpa animasi, untuk real-time
}
```

### Warna Chart per Tab
```javascript
const CHART_COLORS = {
  voltage:  '#1E88E5',  // biru
  current:  '#D97706',  // oranye/amber
  temp:     '#DC2626',  // merah
};

function switchChartTab(tab) {
  liveChart.data.datasets[0].borderColor = CHART_COLORS[tab];
  liveChart.data.datasets[0].data = [];   // reset data
  liveChart.data.labels = [];
  liveChart.update();
}
```

### Sparkline Config (mini chart di metric card)
```javascript
const sparkConfig = {
  type: 'line',
  data: { labels: Array(20).fill(''), datasets: [{
    data: Array(20).fill(0),
    borderColor: '#1E88E5',
    borderWidth: 1,
    pointRadius: 0,
    fill: false,
    tension: 0.4,
  }]},
  options: {
    responsive: false,
    animation: { duration: 0 },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } }
  }
};
```

---

## 14. Error Banner

```html
<!-- Muncul di atas konten saat API error — hidden by default -->
<div id="error-banner"
  class="hidden bg-amber-50 border-b border-amber-200 px-5 py-2
         flex items-center gap-2 text-sm text-amber-700">
  <span class="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span>
  <span id="error-message">Koneksi ke server lambat...</span>
</div>

<script>
function showError(msg) {
  document.getElementById('error-banner').classList.remove('hidden');
  document.getElementById('error-message').textContent = msg;
}
function hideError() {
  document.getElementById('error-banner').classList.add('hidden');
}
</script>
```

---

## 15. Clock (Topbar)

```javascript
// Taruh di setiap file .js halaman
function startClock() {
  const el = document.getElementById('clock');
  function tick() {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });
  }
  tick();
  setInterval(tick, 1000);
}
document.addEventListener('DOMContentLoaded', startClock);
```

---

## 16. Filter Waktu History (Alpine.js)

```html
<div x-data="{ filter: 'today', showDatePicker: false }"
     class="flex items-center gap-1 flex-wrap">

  <template x-for="f in ['today','yesterday','last7','last30','custom']">
    <button @click="filter = f; showDatePicker = (f === 'custom');
                    applyFilter(f)"
      :class="filter === f
        ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
        : 'text-gray-400 hover:text-gray-600'"
      class="text-sm px-2 pb-1 transition-colors capitalize">
      <span x-text="{
        today:'Today', yesterday:'Yesterday',
        last7:'Last 7d', last30:'Last 30d', custom:'Custom'
      }[f]"></span>
    </button>
  </template>

  <!-- Date picker muncul saat Custom dipilih -->
  <div x-show="showDatePicker" x-transition class="flex items-center gap-2 ml-2">
    <input type="date" id="date-from"
      class="border border-gray-300 rounded px-2 py-1 text-sm font-mono"/>
    <span class="text-gray-400 text-sm">—</span>
    <input type="date" id="date-to"
      class="border border-gray-300 rounded px-2 py-1 text-sm font-mono"/>
    <button onclick="applyCustomFilter()"
      class="bg-blue-600 text-white rounded px-3 py-1 text-sm">
      Apply
    </button>
  </div>

  <!-- Export buttons (kanan) -->
  <div class="ml-auto flex items-center gap-3 text-sm text-gray-500">
    <button onclick="exportData('csv')"
      class="hover:text-gray-700 transition-colors">↓ CSV</button>
    <span class="text-gray-300">|</span>
    <button onclick="exportData('excel')"
      class="hover:text-green-600 transition-colors">↓ Excel</button>
    <span class="text-gray-300">|</span>
    <button onclick="exportData('pdf')"
      class="hover:text-red-600 transition-colors">↓ PDF</button>
  </div>

</div>
```

---

## 17. Login Page (templates/login.html)

> Halaman login **tidak menggunakan** sidebar, topbar, atau layout shell biasa.
> Tidak ada file JS terpisah — form submit langsung ke Flask backend.
> Tanggung jawab frontend: tampilan saja. Auth logic = urusan Rafly.

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>BMS — Login</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: { extend: {
        fontFamily: { mono: ['Consolas', 'Courier New', 'monospace'] }
      }}
    }
  </script>
  <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
</head>
<body class="min-h-screen flex items-center justify-center"
  style="background: linear-gradient(135deg,
    #112244 0%, #0D4455 40%, #0B6E6E 75%, #12897A 100%)">

  <div class="w-full max-w-sm">

    <!-- Logo + Nama Perusahaan -->
    <div class="flex flex-col items-center mb-8">
      <div class="w-16 h-16 rounded-full flex items-center justify-center
                  text-white font-bold text-2xl mb-4"
        style="background: linear-gradient(135deg, #43A047, #00BCD4)">
        SR
      </div>
      <h1 class="text-white font-bold text-xl tracking-wide">
        SUMBER REJEKI ENERGY
      </h1>
      <p class="text-white/50 text-sm mt-1">Battery Management System</p>
    </div>

    <!-- Form Card -->
    <div class="bg-white rounded border border-white/10 p-8">

      <h2 class="text-gray-900 font-bold text-lg mb-1">Sign In</h2>
      <p class="text-gray-500 text-sm mb-6">
        Masukkan kredensial untuk melanjutkan
      </p>

      <!-- Pesan error dari Flask (muncul jika login gagal) -->
      {% if error %}
      <div class="bg-red-50 border border-red-300 rounded px-4 py-3 mb-5
                  flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
        <span class="text-sm text-red-600">{{ error }}</span>
      </div>
      {% endif %}

      <!-- Form — action ke endpoint Flask yang disediakan Rafly -->
      <form method="POST" action="{{ url_for('auth.login') }}">

        <!-- CSRF token jika Flask-WTF dipakai Rafly -->
        {% if csrf_token is defined %}
          <input type="hidden" name="csrf_token" value="{{ csrf_token() }}">
        {% endif %}

        <!-- Username -->
        <div class="mb-4">
          <label for="username"
            class="block text-xs font-semibold text-gray-500
                   uppercase tracking-wider mb-1.5">
            Username
          </label>
          <input type="text" id="username" name="username"
            autocomplete="username" required
            placeholder="Masukkan username"
            class="w-full border border-gray-300 rounded px-3 py-2.5
                   text-sm text-gray-900 placeholder-gray-400
                   focus:outline-none focus:border-blue-500
                   focus:ring-1 focus:ring-blue-500 transition-colors
                   font-mono">
        </div>

        <!-- Password -->
        <div class="mb-6">
          <label for="password"
            class="block text-xs font-semibold text-gray-500
                   uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div class="relative">
            <input type="password" id="password" name="password"
              autocomplete="current-password" required
              placeholder="Masukkan password"
              class="w-full border border-gray-300 rounded px-3 py-2.5
                     text-sm text-gray-900 placeholder-gray-400
                     focus:outline-none focus:border-blue-500
                     focus:ring-1 focus:ring-blue-500 transition-colors
                     font-mono pr-10">
            <!-- Toggle show/hide password -->
            <button type="button"
              onclick="togglePassword()"
              class="absolute right-3 top-1/2 -translate-y-1/2
                     text-gray-400 hover:text-gray-600 transition-colors">
              <svg id="eye-icon" class="w-4 h-4" fill="none"
                   stroke="currentColor" stroke-width="1.5"
                   viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639
                     C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007
                     9.963 7.178.07.207.07.431 0 .639C20.577 16.49
                     16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <button type="submit"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold
                 text-sm py-2.5 rounded transition-colors">
          Sign In
        </button>

      </form>
    </div>

    <!-- Footer -->
    <p class="text-center text-white/30 text-xs mt-6">
      BMS Monitor v1.0.0 · Sumber Rejeki Energy
    </p>

  </div>

  <script>
    function togglePassword() {
      const input = document.getElementById('password');
      input.type = input.type === 'password' ? 'text' : 'password';
    }

    // Auto-focus username field
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('username').focus();
    });
  </script>

</body>
</html>
```

### Catatan untuk Rafly (backend)
Frontend mengirim form POST dengan field:
- `username` (string)
- `password` (string)

Yang dibutuhkan dari backend:
- Endpoint `POST /auth/login` atau sesuai kesepakatan
- Jika **berhasil** → redirect ke `dashboard`
- Jika **gagal** → render ulang `login.html` dengan variabel `error` berisi pesan kesalahan
  ```python
  # Contoh di Flask
  return render_template('login.html', error='Username atau password salah')
  ```
