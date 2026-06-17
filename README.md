# Sistem Informasi Penjadwalan MIS At-Taqwa
### Berbasis Algoritma Genetika — Versi 1.0 | Maret 2026

> **Skripsi S1 Teknik Informatika** — Universitas Hasyim Asy'ari Tebuireng Jombang

---

## 📋 Deskripsi

Sistem penjadwalan mata pelajaran otomatis berbasis website untuk **Madrasah Ibtidaiyah Swasta (MIS) At-Taqwa**, menggunakan **Algoritma Genetika** sebagai mesin optimasi penjadwalan. Sistem mampu menghasilkan jadwal bebas konflik dengan memperhatikan constraint guru dan mata pelajaran.

### Fitur Utama
- ✅ **Generate jadwal otomatis** menggunakan Algoritma Genetika (GA)
- ✅ **Zero conflict** scheduling (hard constraint: guru, kelas, slot waktu)
- ✅ **Preferensi guru** diakomodasi sebagai soft constraint
- ✅ **Real-time progress** monitoring dengan chart konvergensi fitness
- ✅ **Ekspor jadwal** ke PDF (per kelas) dan Excel (semua kelas)
- ✅ **Role-based access**: Admin, Guru, Wali Kelas
- ✅ **Seed data** lengkap MIS At-Taqwa (6 kelas, 8 guru, 12 mapel)

---

## 🛠 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Vue.js 3 + Composition API + Element Plus |
| State Management | Pinia |
| Router | Vue Router 4 |
| Backend | Express.js + Node.js |
| ORM | Sequelize v6 |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Algorithm | Pure JavaScript (Worker Thread) |
| Export PDF | PDFKit |
| Export Excel | ExcelJS |
| HTTP Client | Axios |

---

## 🚀 Cara Instalasi & Menjalankan

### Prasyarat
- Node.js >= 18.x
- PostgreSQL >= 14
- npm atau yarn

---

### 1. Clone / Extract Proyek

```bash
# Jika dari ZIP
unzip mis-attaqwa-scheduling.zip
cd scheduling-system
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Salin dan isi konfigurasi environment
cp .env.example .env
```

Edit file `.env`:
```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=mis_attaqwa_scheduling
DB_USER=postgres
DB_PASSWORD=password_postgres_anda

JWT_SECRET=ganti_dengan_secret_yang_kuat_minimal_32_karakter
JWT_EXPIRES_IN=8h

CORS_ORIGIN=http://localhost:5173
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@123
```

### 3. Setup Database

```bash
# Buat database PostgreSQL
psql -U postgres -c "CREATE DATABASE mis_attaqwa_scheduling;"

# Jalankan seeder (membuat tabel + data awal MIS At-Taqwa)
cd backend
npm run seed
```

> **Seed akan membuat:**
> - 1 tahun ajaran aktif (2025/2026 Semester 1)
> - 8 guru dengan preferensi hari
> - 12 mata pelajaran (7 umum + 5 keagamaan)
> - 6 kelas (I-A hingga VI-A)
> - 60 slot waktu (10/hari × 6 hari)
> - Penugasan guru ke mapel dan kelas
> - 4 akun pengguna (admin, guru1, guru2, walikelas3)

### 4. Jalankan Backend

```bash
cd backend
npm run dev
# Server berjalan di http://localhost:3000
```

### 5. Setup & Jalankan Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend berjalan di http://localhost:5173
```

---

## 🔑 Akun Login Default

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Admin@123` |
| Guru | `guru1` | `Guru@123` |
| Guru | `guru2` | `Guru@123` |
| Wali Kelas | `walikelas3` | `Guru@123` |

> ⚠️ **Ganti password default setelah login pertama!**

---

## 🧬 Panduan Generate Jadwal

1. Login sebagai **Admin**
2. Pastikan data master sudah lengkap (Guru, Mapel, Kelas, Slot Waktu)
3. Buat **Penugasan Guru** di menu *Penugasan Guru*
4. Pergi ke menu **Generate Jadwal**
5. Pilih **Tahun Ajaran** aktif
6. Atur parameter GA (atau gunakan default)
7. Klik tombol **🚀 Generate Jadwal**
8. Monitor progress secara real-time
9. Setelah selesai, klik **Aktifkan Jadwal**
10. Lihat jadwal di menu *Jadwal Per Kelas* / *Jadwal Per Guru*
11. Ekspor ke **PDF** atau **Excel**

---

## ⚙️ Parameter Algoritma Genetika (Default)

| Parameter | Default | Range | Keterangan |
|-----------|---------|-------|------------|
| Ukuran Populasi | 100 | 50–500 | Jumlah individu per generasi |
| Jumlah Generasi | 200 | 50–1000 | Iterasi maksimum |
| Crossover Rate | 0.8 | 0.5–1.0 | Probabilitas crossover |
| Mutation Rate | 0.05 | 0.01–0.2 | Probabilitas mutasi per gen |
| Elitism Rate | 0.1 | 0.05–0.3 | % individu elite yang dipertahankan |
| Tournament Size | 3 | 2–10 | Ukuran turnamen seleksi |

---

## 🏗 Constraint Penjadwalan

### Hard Constraint (Penalti = 80–100)
| Constraint | Penalti |
|-----------|---------|
| Guru mengajar 2+ kelas di slot yang sama | 100 |
| Kelas mendapat 2+ mapel di slot yang sama | 100 |
| Mapel di slot istirahat/sholat | 90 |
| Mapel di slot yang tidak diizinkan | 90 |
| Guru melebihi batas jam/hari | 80 |
| Guru melebihi batas jam/minggu | 80 |

### Soft Constraint (Penalti = 10–20)
| Constraint | Penalti |
|-----------|---------|
| Guru mengajar di hari yang tidak dipreferensikan | 20 |
| Distribusi beban mengajar tidak merata | 10 |

---

## 📁 Struktur Proyek

```
scheduling-system/
├── backend/
│   ├── src/
│   │   ├── algorithms/      # GA engine + Worker Thread
│   │   ├── config/          # Express app + database config
│   │   ├── controllers/     # Request handlers
│   │   ├── exports/         # PDF & Excel generators
│   │   ├── middleware/       # Auth, role guard, error handler
│   │   ├── models/          # 12 Sequelize models
│   │   ├── routes/          # REST API routes
│   │   └── utils/           # Logger, response helper
│   ├── seeders/             # Database seed
│   ├── .env.example
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/      # Reusable components + layout
    │   ├── router/          # Vue Router + guards
    │   ├── services/        # Axios API modules
    │   ├── stores/          # Pinia stores
    │   └── views/           # 10 halaman utama
    ├── index.html
    └── vite.config.js
```

---

## 🔌 REST API Endpoints

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| POST | `/api/auth/login` | Login | Public |
| GET | `/api/auth/me` | Info user login | All |
| GET/POST/PUT/DELETE | `/api/teachers` | CRUD Guru | Admin |
| GET/POST/PUT/DELETE | `/api/subjects` | CRUD Mapel | Admin |
| GET/POST/PUT/DELETE | `/api/classes` | CRUD Kelas | Admin |
| GET/POST/DELETE | `/api/time-slots` | CRUD Slot Waktu | Admin |
| GET/POST/DELETE | `/api/assignments` | Penugasan | Admin |
| POST | `/api/schedule/generate` | Jalankan GA | Admin |
| GET | `/api/schedule/status/:jobId` | Status GA | Admin |
| GET | `/api/schedule/by-class/:classId` | Jadwal kelas | All |
| GET | `/api/schedule/by-teacher/:teacherId` | Jadwal guru | Guru |
| GET | `/api/schedule/export/pdf/:classId` | Ekspor PDF | Admin, WK |
| GET | `/api/schedule/export/excel` | Ekspor Excel | Admin |

---

## 📄 Lisensi

Dokumen penelitian — tidak untuk dipublikasikan.  
© 2026 Unhasy / Peneliti S1 Teknik Informatika
