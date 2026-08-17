# BMS Web Application — Agent Context

## Ringkasan Proyek
Aplikasi web **Battery Management System (BMS)** untuk **Sumber Rejeki Energy**.
Dibangun dengan frontend HTML/Tailwind/Alpine.js dan backend Python (Flask).

## Tim & Scope
| Developer | Scope | Folder |
|---|---|---|
| Farrel (NBI 1462300172) | Frontend — HTML, Tailwind CSS, Alpine.js, JS | `templates/` + `static/` |
| Moch. Rafly Ardiansyah | Backend — Python Flask, serial, API, database | `app/` |

> ⚠️ Jangan sentuh folder `app/` — itu scope Rafly.
> Semua pekerjaan frontend HANYA di dalam `templates/` dan `static/`.

## Struktur Folder
```
bms-monitoring-app/
├── app/                          ← SCOPE RAFLY — jangan sentuh
│   └── ...
│
├── static/                       ← SCOPE FARREL (aset statis)
│   ├── css/
│   │   └── style.css             ← custom CSS minimal (Tailwind dominan)
│   └── js/
│       ├── api.js                ← SATU file untuk semua fetch + dummy data
│       ├── dashboard.js
│       ├── realtime.js
│       ├── battery-status.js
│       ├── history.js
│       ├── alarm-center.js
│       └── settings.js
│
├── templates/                    ← SCOPE FARREL (halaman HTML)
│   ├── partials/
│   │   ├── sidebar.html          ← sidebar (di-include ke setiap halaman)
│   │   └── topbar.html           ← topbar (di-include ke setiap halaman)
│   ├── login.html                ← tanpa sidebar/topbar
│   ├── dashboard.html
│   ├── realtime.html
│   ├── battery-status.html
│   ├── history.html
│   ├── alarm-center.html
│   └── settings.html
│
├── requirements.txt
├── .gitignore
├── AGENTS.md                     ← konteks proyek (file ini)
└── DESIGN.md                     ← komponen HTML siap pakai
```

## Stack Frontend
- **HTML5** — struktur halaman (Flask template)
- **Tailwind CSS** (CDN) — styling utility-first
- **Alpine.js** (CDN) — reaktivitas ringan (tab, toggle, accordion)
- **Chart.js** (CDN) — chart real-time
- **Vanilla Fetch API** — polling data dari Flask backend

## Load CDN (di setiap halaman HTML)
```html
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
```

## Load File JS (path dari Flask)
```html
<!-- Di setiap halaman, load api.js dulu, lalu JS spesifik halaman -->
<script src="{{ url_for('static', filename='js/api.js') }}"></script>
<script src="{{ url_for('static', filename='js/dashboard.js') }}" defer></script>
```

## Mekanisme Real-time: Polling
Frontend fetch ke Flask API endpoint setiap interval tertentu:
```javascript
setInterval(async () => {
    const data = await api.getBatteryData();
    updateUI(data);
}, 1000); // 1 detik untuk Realtime, 2 detik untuk Dashboard
```

## API Layer (static/js/api.js) — ATURAN WAJIB
- Semua fetch ke backend HARUS melalui `api.js`
- Tidak boleh ada `fetch()` langsung di file halaman manapun
- Flag `USE_DUMMY = true` saat development (backend belum siap)
- Flag `USE_DUMMY = false` saat integrasi backend Rafly sudah siap

```javascript
const USE_DUMMY = true;                        // ← ubah ke false saat integrasi
const API_BASE  = 'http://localhost:5000/api'; // ← Flask default port 5000
```

## Flask URL untuk Static Files
Gunakan `url_for` Flask saat referensi file static:
```html
<!-- CSS -->
<link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">

<!-- JS -->
<script src="{{ url_for('static', filename='js/api.js') }}"></script>

<!-- Image -->
<img src="{{ url_for('static', filename='images/logo.png') }}">
```

## Partials (Komponen Berulang)
Sidebar dan topbar ada di `templates/partials/` dan di-include ke setiap halaman:
```html
<!-- Di setiap halaman HTML -->
{% include 'partials/sidebar.html' %}
{% include 'partials/topbar.html' %}
```

## Filosofi Desain: Industrial Utilitarian
Referensi: Grafana, Home Assistant — fungsional, dense, tidak dekoratif.

**6 Aturan Wajib:**
1. Warna = sinyal status saja, bukan dekorasi
2. Semua angka = `font-mono` (Consolas)
3. Tidak ada badge untuk status "Normal" — teks abu biasa saja
4. Border: `border border-gray-300 rounded` — tidak ada `shadow-lg`
5. Radius: `rounded` (4px) — tidak ada `rounded-xl` atau `rounded-full`
6. Jangan tambah elemen tanpa fungsi atau data

## Palet Warna (Tailwind)
```
Page bg:    bg-gray-100
Card:       bg-white border border-gray-300 rounded
Text:       text-gray-900
Muted:      text-gray-500
Hint:       text-gray-400
Aksen:      text-blue-600 / bg-blue-600  (hanya elemen interaktif)
Critical:   text-red-600 / bg-red-50 / border-red-300
Warning:    text-amber-600 / bg-amber-50 / border-amber-300
Connected:  text-green-600
Angka:      font-mono
```

## Sidebar Gradient
```html
<aside style="background: linear-gradient(to bottom,
  #112244 0%, #0D4455 40%, #0B6E6E 75%, #12897A 100%)">
```

## Halaman & Catatan Penting
| Halaman | Template | JS | Catatan |
|---|---|---|---|
| **Login** | login.html | — | Form username + password. Tidak ada sidebar/topbar. Submit ke backend Rafly. |
| Dashboard | dashboard.html | dashboard.js | 6 metric + chart + pack info + recent alarm + pack summary |
| Realtime | realtime.html | realtime.js | 5 metric + **1 chart tabbed** (Voltage/Current/Temp) + live status |
| Battery Status | battery-status.html | battery-status.js | **Tanpa tab** — grid 16 sel + voltage overview kanan |
| History | history.html | history.js | Tab log + alarm, filter tanggal, pagination |
| Alarm Center | alarm-center.html | alarm-center.js | Daftar alarm aktif + acknowledge |
| Settings | settings.html | settings.js | 6 kategori, Advanced serial = collapsed |

## Catatan Halaman Login
- Login **tidak menggunakan** sidebar, topbar, atau layout shell biasa
- Form submit ke endpoint Flask yang disediakan Rafly (method POST)
- Tanggung jawab frontend: tampilan form saja
- Tanggung jawab backend (Rafly): validasi kredensial, session, redirect
- Setelah login berhasil → backend redirect ke dashboard
- Setelah login gagal → backend kembalikan pesan error → frontend tampilkan pesan

## Keputusan Desain yang Sudah Disepakati
- Realtime: **1 chart besar dengan tab toggle** — bukan 3 chart terpisah
- Battery Status: **tidak ada tab** — grid sel langsung tampil tanpa navigasi tab
- Protection Status → dipindah ke **Alarm Center**
- Pack Details → dipindah ke **Settings → Battery Info**
- Settings: **6 kategori** — Communication, Alarm Threshold, Database, Application, Battery Info, About
- Settings: Advanced serial fields → **collapsed by default** (accordion Alpine.js)

## Cara Integrasi Backend (nanti)
Hanya ubah 2 baris di `static/js/api.js`:
```javascript
const USE_DUMMY = false;                       // dari true ke false
const API_BASE  = 'http://localhost:5000/api'; // URL Flask backend Rafly
```
Seluruh file HTML dan JS lainnya tidak perlu disentuh.

## Referensi Komponen
Lihat `DESIGN.md` untuk snippet HTML + Tailwind siap pakai.
Gunakan komponen dari DESIGN.md — jangan improvisasi desain baru.
