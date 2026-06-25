# AGENTS.md — Habs Crew Tracker

> Dokumen ini adalah panduan teknis wajib bagi AI Assistant (Cursor, Copilot, Claude Code, dll) saat membantu coding di project ini. Patuhi seluruh aturan di bawah sebelum menulis kode.

## 1. Tentang Project

**Habs Crew Tracker** adalah aplikasi web internal untuk memantau absensi dan progres harian tukang bangunan di lapangan, dengan tujuan mencegah pembengkakan budget (over-budget) proyek konstruksi.

**User roles (Fase 1):**
- **Admin/Owner** — membuat akun mandor/tukang, membuat proyek, melihat laporan.
- **Mandor** — absen masuk, mengunci target pagi, lapor progres sore.

Tidak ada fitur self-register. Semua akun dibuat manual oleh Admin.

---

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js (App Router) |
| Bahasa | TypeScript (strict mode wajib aktif) |
| Styling | Tailwind CSS + Shadcn UI |
| ORM | Prisma (`@prisma/client`) |
| Auth & Storage | Supabase SDK (auth Email/Password + Storage untuk foto) |
| State Management | Zustand |
| Validasi | Zod (wajib untuk semua input form & API payload) |

---

## 3. Arsitektur: Pragmatic Clean Architecture

```
src/
├── domain/
│   ├── entities/        # Domain entity (plain TS type/class, tanpa dependency eksternal).
│   ├── repositories/    # Interface/kontrak repository (contoh: IAttendanceRepository).
│   └── usecase/         # Business logic murni (contoh: clockInUseCase, lockDailyTaskUseCase).
├── data/
│   ├── datasources/     # Raw access ke external service. TIDAK tahu apa-apa soal domain entity.
│   │   ├── prisma/      # Query mentah Prisma (create, findMany, update, dll).
│   │   └── supabase/    # Call mentah Supabase (auth, storage upload/download).
│   └── repositories/    # Implementasi interface domain/repositories. Orkestrasi datasource(s)
│                        # + mapping raw data <-> domain entity. Boleh pakai >1 datasource.
├── app/api/             # Route Handlers — HANYA orkestrasi (panggil use-case), tidak ada business logic.
├── app/                 # Halaman & komponen UI. TIDAK BOLEH ada query Prisma/Supabase langsung.
├── store/               # Zustand global state (client-side state, bukan server state).
├── hooks/               # Custom hooks: GPS geofence, kamera/selfie, dll.
└── lib/                 # Util generik (formatter, constants, zod schemas bersama).
```

### Aturan alur data (WAJIB diikuti):

```
UI Component → fetch/hook → API Route Handler → Use Case (domain)
            → Repository (data/repositories) → Datasource (data/datasources) → Prisma/Supabase
```

- **`domain/entities/`**: plain type/class merepresentasikan konsep bisnis (contoh: `AttendanceEntity`, `DailyTaskEntity`). Tidak ada dependency ke Prisma/Supabase.
- **`domain/repositories/`**: interface kontrak, contoh `IAttendanceRepository { save(entity): Promise<AttendanceEntity> }`. Tidak ada implementasi di sini.
- **`domain/usecase/`**: business logic murni (validasi aturan bisnis, kalkulasi geofence, dll), menerima repository via dependency injection/parameter. Tidak boleh ada `import { PrismaClient }` atau `import { createClient } from '@supabase/supabase-js'` di seluruh folder `domain/`.
- **`data/datasources/`**: HANYA raw call ke external service (query Prisma mentah, call Supabase mentah). Tidak ada mapping ke domain entity, tidak ada business logic.
- **`data/repositories/`**: implementasi dari `domain/repositories/`. Memanggil satu atau lebih datasource, lalu mapping hasilnya jadi domain entity (function `toDomainEntity()` / `toPrismaModel()`). Di sinilah tempat repository menggabungkan Prisma (simpan data) + Supabase (upload foto) untuk satu use-case yang sama.
- **API routes**: parse request → validasi Zod → panggil use-case → return response. Tidak boleh berisi query Prisma/Supabase langsung.
- **UI Components**: render, panggil API via `fetch`/hook, kelola local/global state. Tidak boleh import Prisma Client atau Supabase admin client.

### Contoh konkret (Clock-in flow):

```ts
// data/datasources/prisma/attendance.datasource.ts
export const insertAttendance = (data: Prisma.AttendanceCreateInput) =>
  prisma.attendance.create({ data });

// data/datasources/supabase/storage.datasource.ts
export const uploadSelfie = (file: File, path: string) =>
  supabase.storage.from('selfies').upload(path, file);

// data/repositories/attendance.repository.ts
export class PrismaAttendanceRepository implements IAttendanceRepository {
  async save(entity: AttendanceEntity): Promise<AttendanceEntity> {
    const { data: photoUrl } = await uploadSelfie(entity.selfieFile, entity.id);
    const raw = await insertAttendance(toPrismaModel(entity, photoUrl));
    return toDomainEntity(raw);
  }
}

// domain/usecase/clock-in.usecase.ts
export const clockInUseCase = async (
  input: ClockInInput,
  repo: IAttendanceRepository
): Promise<AttendanceEntity> => {
  if (!isWithinGeofence(input.coords, input.projectCoords, 50)) {
    throw new GeofenceViolationError();
  }
  return repo.save(toEntity(input));
};

// app/api/attendance/clock-in/route.ts
export async function POST(req: Request) {
  const body = ClockInSchema.parse(await req.json()); // validasi Zod
  const result = await clockInUseCase(body, new PrismaAttendanceRepository());
  return Response.json({ success: true, data: result });
}
```

---

## 4. ATURAN STRICT UNTUK AI (Non-negotiable)

1. ❌ **DILARANG** memanggil `prisma.*` atau `supabase.*` langsung di dalam file `src/app/**` (page/component) maupun di `domain/**`. Akses data hanya boleh lewat: `app/api` → `domain/usecase` → `data/repositories` → `data/datasources`.
2. ❌ **DILARANG** mencampur business logic (kalkulasi, validasi aturan bisnis, kondisi geofence) di dalam komponen React. Logic tersebut harus ada di `src/domain/`.
3. ✅ **WAJIB** validasi setiap input (body request, form) menggunakan **Zod schema** sebelum diproses. Schema didefinisikan di `src/lib/schemas/` dan dipakai bersama oleh frontend (React Hook Form) dan backend (API route).
4. ✅ **WAJIB** semua API Route Handler mengembalikan response dengan format konsisten:
   ```ts
   // Sukses
   { success: true, data: T }
   // Gagal
   { success: false, error: { code: string, message: string } }
   ```
5. ✅ **WAJIB** setiap fungsi di `domain/` dan `data/` punya return type eksplisit. Tidak boleh `any`.
6. ❌ **DILARANG** menyimpan Supabase Service Role Key atau secret apapun di client-side code (`'use client'` files). Hanya boleh dipakai di server (API routes / server actions).
7. ✅ **WAJIB** semua akses lokasi GPS dan kamera dibungkus dalam custom hook di `src/hooks/`, bukan ditulis inline di komponen.
8. ✅ **WAJIB** validasi geofence (radius 50m) dihitung di **server-side** (API route/use-case), bukan hanya di client — client bisa dimanipulasi (fake GPS).
9. ❌ **DILARANG** trust data lokasi/foto dari client tanpa validasi ulang di server (anti-spoofing dasar: cek timestamp, cek koordinat masuk akal).
10. ✅ **WAJIB** setiap perubahan skema database lewat `prisma migrate dev`, jangan edit migration file manual.
11. ✅ **WAJIB** komponen UI baru memakai Shadcn UI sebagai base, kustomisasi via Tailwind, jangan bikin komponen custom dari nol kalau Shadcn punya yang setara.
12. ❌ **DILARANG** menulis `console.log` untuk debugging yang tertinggal di kode final — gunakan logger sederhana atau hapus sebelum commit.

---

## 5. Spesifikasi Fitur MVP (Fase 1)

### 5.1 Auth
- Login-only via Supabase Auth (Email/Password). Tidak ada halaman register publik.
- Akun dibuat manual oleh Admin (lewat dashboard internal atau Supabase Studio di Fase 1).
- Session di-protect via Next.js Middleware — redirect ke `/login` jika belum auth.

### 5.2 Clock-in (Absen Masuk)
- Mandor wajib mengizinkan akses GPS browser.
- Sistem hitung jarak (haversine formula) antara koordinat user vs koordinat proyek.
- **Radius toleransi: 50 meter.** Jika di luar radius → tolak absen, tampilkan pesan jarak.
- Wajib ambil foto selfie (live camera capture, bukan upload galeri — gunakan constraint `capture="user"` atau MediaStream API).
- Foto diupload ke Supabase Storage, simpan URL + metadata (timestamp, lat/long, project_id) ke database via Prisma.
- Validasi ulang radius geofence di server sebelum menyimpan record absen (lihat aturan #8).

### 5.3 Laporan Target Harian (Daily Tasks)
- **Pagi:** Mandor mengunci target kerja hari itu (deskripsi target, lalu di-lock — tidak bisa diedit setelah jam tertentu, definisikan cutoff time di config).
- **Sore:** Mandor lapor:
  - Persentase progres (0–100%, integer, divalidasi Zod `min(0).max(100)`).
  - Upload foto hasil kerja (boleh dari galeri, max size misal 5MB, format jpg/png/webp).
- Setiap laporan terikat ke `project_id`, `mandor_id`, `task_id`, dan `date`.

### 5.4 Data Model (acuan awal — sesuaikan saat implementasi)
```prisma
model Project { id, name, latitude, longitude, radiusMeters, ... }
model User { id, email, role, ... }
model Attendance { id, userId, projectId, clockInAt, latitude, longitude, selfieUrl, ... }
model DailyTask { id, projectId, mandorId, date, targetDescription, lockedAt, progressPercent, photoUrl, ... }
```

---

## 6. Konvensi Kode

- **Naming:** `camelCase` untuk variable/function, `PascalCase` untuk component/type, `kebab-case` untuk nama file non-component.
- **Error handling:** gunakan custom error classes di `domain/errors/` (contoh: `GeofenceViolationError`, `TaskAlreadyLockedError`), jangan `throw new Error("string biasa")` untuk error bisnis.
- **Folder per fitur** di dalam `app/`, `domain/`, `data/` — contoh: `attendance/`, `daily-task/`, `auth/`. Jangan campur semua use-case dalam satu file besar.
- **Commit message:** gunakan format `feat:`, `fix:`, `refactor:`, `chore:` (Conventional Commits).

---

## 7. Definition of Done (per task)

Sebuah task dianggap selesai jika:
- [ ] Kode mengikuti alur layer di Bagian 3 (tidak ada layer violation).
- [ ] Input divalidasi Zod di server-side.
- [ ] Tidak ada `any` type tanpa justifikasi komentar.
- [ ] Response API konsisten dengan format Bagian 4.4.
- [ ] Tidak ada secret/key bocor ke client bundle.
- [ ] Sudah dites manual minimal 1 happy path + 1 edge case (misal: di luar radius geofence).

---

## 8. Hal yang BELUM masuk MVP (jangan over-engineer)

- Tidak perlu real-time tracking (WebSocket/polling live location).
- Tidak perlu offline-first / PWA sync di Fase 1.
- Tidak perlu role granular selain Admin & Mandor.
- Tidak perlu multi-tenant/multi-company.

Jika AI assistant diminta menambah fitur di luar daftar ini tanpa instruksi eksplisit, **tanyakan dulu** sebelum implementasi.
