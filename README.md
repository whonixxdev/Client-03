# Backend SPMB v11 (NestJS + Prisma + Supabase)

Backend pendaftaran siswa baru SMK TI Bali Global Badung.
Folder proyek: `D:\backup_website\client_backend_all\backend_spmbv11`

Terakhir diperbarui: 31 Oktober 2026

---

## 1. Status Singkat

| Modul | Status |
|-------|--------|
| Koneksi database (Supabase Session pooler) | Selesai, server pernah berhasil start |
| Auth (register, OTP, login, reset password) | Selesai ditulis, **belum dites ulang setelah penguatan keamanan** |
| Biodata siswa | Belum dikerjakan (model sudah ada di skema) |
| Admin dan panitia | Belum dikerjakan |
| Berkas, pembayaran, jurusan, artikel, komentar | Belum dikerjakan (model sudah ada di skema) |

Catatan penting: kode Auth versi terbaru (hasil penguatan keamanan) ditulis tanpa dijalankan.
Log start terakhir yang berhasil adalah versi sebelum penguatan keamanan.
Langkah verifikasi ada di bagian 8.

---

## 2. Stack

- NestJS, TypeScript
- Prisma 7.10.1 (driver adapter `pg`), PostgreSQL di Supabase
- JWT (passport-jwt), bcrypt, class-validator, class-transformer
- Nodemailer dengan Brevo SMTP
- `@nestjs/throttler` (rate limit), `helmet`

---

## 3. Riwayat Pekerjaan

### 3.1 Masalah koneksi database (selesai)

- Error `ECONNREFUSED` saat start, dari `findUnique` di `onModuleInit`.
- Penyebab: host `db.<ref>.supabase.co` dipakai dengan port `6543` (port pooler).
- Perbaikan: `DATABASE_URL` memakai **Session pooler**:
  `aws-0-ap-northeast-2.pooler.supabase.com:5432`, user `postgres.<project-ref>`.
- Parameter `?schema=public` dan `?pgbouncer=true` dihapus (tidak dipakai Prisma 7 dengan adapter).
- `DIRECT_URL` tidak dipakai.

### 3.2 File baru yang dibuat

| File | Isi |
|---|---|
| `src/auth/utils/security.util.ts` | OTP acak (`crypto.randomInt`), hash OTP (HMAC-SHA256), perbandingan aman, normalisasi email/username/panitiaId, deteksi error unik `P2002` |
| `src/auth/dto/reset-password.dto.ts` | DTO untuk `POST /auth/reset-password` |
| `src/auth/dto/resend-otp.dto.ts` | DTO untuk `POST /auth/resend-otp` |

### 3.3 File yang diperbarui

| File | Perubahan |
|---|---|
| `prisma/schema.prisma` | Tambah `enum OtpPurpose` (REGISTER, LOGIN, RESET), field `otpPurpose` dan `otpAttempts` di model `User` |
| `src/auth/auth.service.ts` | Ditulis ulang total (lihat bagian 5) |
| `src/auth/auth.controller.ts` | Tambah endpoint `resend-otp` dan `reset-password`, rate limit per endpoint, `register/panitia` hanya untuk ADMIN |
| `src/auth/auth.module.ts` | Secret JWT wajib minimal 32 karakter, algoritma HS256, tanpa secret cadangan |
| `src/auth/strategies/jwt.strategy.ts` | Secret wajib, algoritma HS256, tolak user yang belum terverifikasi |
| `src/auth/dto/register-siswa.dto.ts` | Validasi username, nomor HP, password (8-72 karakter, huruf dan angka) |
| `src/auth/dto/register-panitia.dto.ts` | Sama seperti di atas, field `panitiaId` dihapus (dibuat otomatis oleh server) |
| `src/auth/dto/login.dto.ts` | Batas panjang input, tipe `string` wajib |
| `src/auth/dto/login-panitia.dto.ts` | `@IsEmail` untuk email, OTP harus 6 digit angka |
| `src/auth/dto/verify-otp.dto.ts` | OTP harus 6 digit angka |
| `src/auth/dto/forgot-password.dto.ts` | `@IsEmail` untuk email, batas panjang username |
| `src/auth/mail/mail.service.ts` | Hanya bagian transporter: port dijadikan angka, `requireTLS: true` |
| `src/app.module.ts` | `ConfigModule.forRoot({ isGlobal: true })`, `ThrottlerModule`, `ThrottlerGuard` global |
| `src/main.ts` | `helmet`, CORS dari `CORS_ORIGINS`, `ValidationPipe` (whitelist, forbidNonWhitelisted, transform) |
| `.env` | Variabel baru: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ORIGINS` |

### 3.4 File yang tidak diubah

- `src/auth/guards/jwt-auth.guard.ts`
- `src/auth/guards/roles.guard.ts`
- `src/auth/decorators/roles.decorator.ts`
- `src/auth/decorators/get-user.decorator.ts`
- `src/app.controller.ts`, `src/app.service.ts`
- `src/prisma/prisma.module.ts`, `src/prisma/prisma.service.ts` (belum diperiksa isinya; disarankan memakai `PrismaPg` dengan `process.env.DATABASE_URL`)

---

## 4. Struktur Folder

```
backend_spmbv11/
├── prisma/schema.prisma
├── .env
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── app.controller.ts
    ├── app.service.ts
    ├── prisma/
    │   ├── prisma.module.ts
    │   └── prisma.service.ts
    └── auth/
        ├── auth.module.ts
        ├── auth.controller.ts
        ├── auth.service.ts
        ├── decorators/
        │   ├── get-user.decorator.ts
        │   └── roles.decorator.ts
        ├── guards/
        │   ├── jwt-auth.guard.ts
        │   └── roles.guard.ts
        ├── strategies/jwt.strategy.ts
        ├── mail/mail.service.ts
        ├── utils/security.util.ts
        └── dto/
            ├── register-siswa.dto.ts
            ├── register-panitia.dto.ts
            ├── login.dto.ts
            ├── login-panitia.dto.ts
            ├── verify-otp.dto.ts
            ├── resend-otp.dto.ts
            ├── forgot-password.dto.ts
            └── reset-password.dto.ts
```

Lokasi `guards/` dan `decorators/` mengikuti impor yang ada di file `roles.guard.ts`.

---

## 5. Modul Auth

### 5.1 Endpoint

| Method | Path | Akses | Batas/menit | Body |
|---|---|---|---|---|
| GET | `/` | Publik | 60 | tidak ada |
| POST | `/auth/register/siswa` | Publik | 5 | email, namaLengkap, username, noHp, password, confirmPassword |
| POST | `/auth/register/panitia` | **Admin** (Bearer token) | 60 | namaLengkap, username, email, noHp, password, confirmPassword |
| POST | `/auth/verify-otp` | Publik | 10 | email, otpCode |
| POST | `/auth/resend-otp` | Publik | 3 | email |
| POST | `/auth/login` | Publik, **hanya siswa** | 10 | identifier (email atau username), password |
| POST | `/auth/login/panitia` | Publik | 10 | panitiaId + password, atau email + password (+ otpCode) |
| POST | `/auth/forgot-password` | Publik | 3 | email atau username |
| POST | `/auth/reset-password` | Publik | 5 | email, otpCode, newPassword, confirmPassword |

### 5.2 Alur

- **Siswa:** `register/siswa` lalu `verify-otp` (mendapat token), berikutnya `login`.
- **Panitia:** dibuat oleh admin lewat `register/panitia`, panitia memverifikasi OTP, lalu login via `panitiaId` + password, atau via email + password + OTP.
- **Admin:** login lewat `login/panitia` dengan email + password. OTP dikirim ke email, lalu kirim ulang dengan `otpCode`.
- **Lupa password:** `forgot-password` lalu `reset-password`.
- **OTP tidak sampai:** `resend-otp`.

### 5.3 Aturan data

| Data | Perlakuan |
|---|---|
| `username` | Dibedakan per karakter: `Anggun`, `anggun`, dan `ANGGUN` adalah tiga username berbeda. Hanya `trim`. Format: 3-30 karakter, huruf, angka, titik, garis bawah |
| `email` | Selalu disimpan dan dicari dalam huruf kecil |
| `panitiaId` | Dibuat otomatis, format `PNT-TAHUN-NNN`, dicari dalam huruf besar |
| `namaLengkap` | Disimpan apa adanya, tidak unik |
| `password` | Dibedakan huruf besar dan kecil, 8-72 karakter, wajib huruf dan angka |
| Username dilarang | `admin`, `administrator`, `superadmin`, `panitia`, `root`, `system` (tanpa membedakan huruf) |

### 5.4 Keamanan yang aktif

- bcrypt cost 12, dengan hash pembanding agar waktu respons login seragam
- OTP: 6 digit acak kriptografis, disimpan sebagai hash, berlaku 5 menit, maksimal 5 percobaan, jeda 60 detik antar permintaan, terikat pada tujuan (REGISTER, LOGIN, RESET)
- Pesan error login seragam; `forgot-password` dan `resend-otp` selalu membalas pesan yang sama
- JWT HS256, secret wajib minimal 32 karakter, `JwtStrategy` membaca ulang user dari database
- `RolesGuard` dengan `@Roles(Role.ADMIN)` untuk `register/panitia`
- Rate limit global 60 permintaan per menit dan batas khusus per endpoint
- `helmet`, CORS dari `.env`, `ValidationPipe` yang menolak field tak dikenal
- Akun admin default dibuat dari `ADMIN_EMAIL` dan `ADMIN_PASSWORD` (bukan tertanam di kode)

---

## 6. Variabel `.env`

Nama variabel saja, nilai jangan pernah dibagikan atau di-commit.

| Variabel | Dipakai oleh |
|---|---|
| `PORT`, `NODE_ENV` | Server |
| `DATABASE_URL` | Prisma (Session pooler, port 5432) |
| `JWT_SECRET` (minimal 32 karakter), `JWT_EXPIRES_IN` | JWT dan hash OTP |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | Pengiriman OTP |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Pembuatan akun admin default |
| `CORS_ORIGINS` | CORS, daftar dipisah koma |
| `SUPABASE_URL`, `SUPABASE_KEY`, `AWS_*` | Belum dipakai auth, disiapkan untuk modul berkas |

---

## 7. Keputusan yang Sudah Diambil

1. Username dibedakan per karakter (permintaan pemilik proyek). Email tetap tidak membedakan huruf.
2. Pendaftaran panitia hanya oleh admin.
3. `/auth/login` khusus siswa; panitia dan admin lewat `/auth/login/panitia`.
4. Admin memakai OTP email saat login, sehingga `ADMIN_EMAIL` harus email yang aktif.
5. Fitur menampilkan email tersamar di `forgot-password` dihapus karena membocorkan data akun.
6. Field di luar DTO ditolak dengan 400, jadi frontend dan mobile tidak boleh mengirim field tambahan.

---

## 8. Checklist Verifikasi (belum dijalankan)

Urutan:

1. Install paket:
   `npm install class-validator class-transformer @nestjs/throttler helmet`
2. Migrasi dan generate:
   `npx prisma migrate dev --name keamanan_otp` lalu `npx prisma generate`
3. Isi `.env`: `JWT_SECRET` hasil acak minimal 32 karakter, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ORIGINS`.
4. Hapus akun admin lama berpassword `admin@123` di tabel `users`.
5. Jalankan email lowercase sekali di SQL Editor:
   `UPDATE users SET email = lower(email) WHERE email <> lower(email);`
6. Jalankan `npm run start:dev`, pastikan muncul `Nest application successfully started`.

Tes Postman:

- [ ] Daftar siswa `Anggun` berhasil, daftar `anggun` (email lain) berhasil
- [ ] Daftar `Anggun` lagi gagal: "Username sudah digunakan!"
- [ ] Daftar `Admin` gagal: "Username tidak diperbolehkan."
- [ ] Verify OTP lalu login siswa memakai email dan username
- [ ] Login siswa dengan `anggun` masuk ke akun `anggun`, bukan `Anggun`
- [ ] OTP salah 5 kali, percobaan ke-6 mendapat 429
- [ ] `resend-otp` kedua dalam 60 detik tidak mengirim email baru
- [ ] `forgot-password` lalu `reset-password` berhasil, login dengan password baru berhasil
- [ ] Admin login via `login/panitia` (email + password, lalu OTP)
- [ ] Admin membuat panitia lewat `register/panitia`; tanpa token admin harus 401 atau 403
- [ ] Panitia login via `panitiaId` + password dan via email + OTP
- [ ] Body dengan field tambahan ditolak 400

---

## 9. Yang Belum Ada dan Perlu Dikerjakan

### 9.1 Rencana berikutnya (dicek dan dilanjutkan besok)

- Modul **biodata siswa** (model `BiodataSiswa`, relasi `Jurusan`)
- Modul **admin dan panitia** (verifikasi berkas, status formulir, komentar panitia)
- Setelah itu: berkas (upload ke Supabase Storage), pembayaran, jurusan, artikel

### 9.2 Kekurangan di Auth

- `namaLengkap` dan `noHp` panitia diterima tetapi tidak tersimpan (model `BiodataSiswa` khusus siswa). Saran: buat model `ProfilPanitia`.
- Belum ada `GET /auth/me`.
- Token tidak bisa dicabut setelah password diganti. Saran: kolom `passwordChangedAt`, tolak token yang terbit sebelumnya.
- Belum ada logout atau refresh token. Masa token masih panjang (`JWT_EXPIRES_IN`).
- Belum ada jejak audit (siapa membuat akun panitia, kapan admin login).
- Email akun yang belum diverifikasi tetap "terkunci" sampai OTP dikirim ulang atau diverifikasi. Perlu pembersihan akun lama yang tidak pernah diverifikasi.

### 9.3 Keamanan yang harus dilakukan segera

Beberapa nilai rahasia pernah tampil di percakapan, jadi harus diganti sebelum dipakai pengguna sungguhan:

- [ ] Password database Supabase (Reset database password)
- [ ] Password SMTP Brevo
- [ ] Secret key Supabase
- [ ] Access key dan secret key S3
- [ ] `JWT_SECRET` (buat baru, jangan tempel di chat)
- [ ] Pastikan `.env` ada di `.gitignore`

---

## 10. Aturan Kerja

- Untuk tugas kode atau bug: pahami masalahnya dulu, jelaskan masalahnya, lalu jelaskan perbaikannya beserta path file yang diperbaiki.
- Kode perbaikan tidak boleh memuat komentar (komentar biasa maupun inline).
- Setelah kode diperbaiki, tegaskan bahwa kode sudah diperbaiki dan sudah fix total.
- Solusi harus tanpa kesalahan dan tanpa typo.
- Pengembang juga berperan sebagai klien: beri kritik desain dan saran inovasi (kekurangan, kritik, saran, penyelesaian) dengan bahasa tidak berlebihan.
- Jangan menempelkan nilai `.env` asli ke percakapan; sensor nilainya.