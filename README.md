# Backend SPMB v11 (NestJS + Prisma + Supabase)

Backend pendaftaran siswa baru SMK TI Bali Global Badung.
Folder proyek: `D:\backup_website\client_backend_all\backend_spmbv11`

Terakhir diperbarui: 2 November 2026

---

## 1. Status Singkat

| Modul | Status |
|---|---|
| Koneksi database (Supabase Session pooler) | Selesai, server pernah berhasil start |
| Auth (register, OTP, login, reset password) | Selesai ditulis, **belum dites ulang setelah penguatan keamanan** |
| Pendaftaran siswa (biodata, unggah berkas, ajukan, pembayaran) | Selesai ditulis, **belum dites** |
| Panitia/admin (verifikasi, konfirmasi pembayaran, registrasi ulang, ekspor Excel) | Selesai ditulis, **belum dites** |
| Jurusan, gelombang, pengaturan (daftar untuk siswa, CRUD admin), avatar, jurusan cadangan, penempatan kuota | Selesai ditulis (tahap 1), **belum dites** |
| Notifikasi, aturan ekspor Excel, statistik dan kelola akun panitia, artikel | Belum dikerjakan |

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

- Uji modul pendaftaran (checklist bagian 11.6)
- Tahap 2: notifikasi (komentar manual, notifikasi siswa, pilih massal, single dan broadcast)
- Tahap 3: aturan ekspor (hanya siklus selesai) dan kolom Excel baru dengan avatar
- Tahap 4: statistik, kelola akun panitia
- Setelah itu: artikel, `GET /auth/me`, hal-hal di bagian 9.2

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

---

## 11. Modul Pendaftaran (1 November 2026)

### 11.1 File

Baru:

| File | Isi |
|---|---|
| `src/storage/storage.module.ts`, `storage.service.ts` | Unggah, hapus, dan tautan sementara (5 menit) ke bucket privat Supabase lewat S3 |
| `src/pendaftaran/panitia.controller.ts`, `panitia.service.ts` | Daftar, detail, verifikasi, konfirmasi pembayaran, registrasi ulang, ekspor Excel |
| `src/pendaftaran/dto/verifikasi.dto.ts`, `konfirmasi-pembayaran.dto.ts`, `daftar-ulang.dto.ts`, `query-panitia.dto.ts` | Validasi input panitia dan filter |
| `src/pendaftaran/utils/berkas.config.ts` | Daftar jenis berkas, batas ukuran, format, wajib atau opsional |
| `src/pendaftaran/utils/file.util.ts` | Cek isi file (jpg, png, pdf), slug nama folder, validasi unggahan |
| `src/pendaftaran/utils/kelengkapan.util.ts` | Daftar data dan berkas yang masih kurang |

Ditulis ulang:

| File | Perubahan |
|---|---|
| `src/pendaftaran/pendaftaran.controller.ts` | Hanya role SISWA, memakai `@GetUser('id')` (sebelumnya `req.user.userId` yang tidak ada), unggah file nyata |
| `src/pendaftaran/pendaftaran.service.ts` | Aturan kunci edit, ajukan, jumlah bayar dari server, tanpa penyalinan body mentah |
| `src/pendaftaran/pendaftaran.module.ts` | Tambah `StorageModule` dan `PanitiaController`, `PanitiaService` |
| `src/pendaftaran/dto/biodata.dto.ts` | Format NIK 16 digit, NISN 10 digit, nomor HP, pilihan agama dan jenis kelamin |
| `src/pendaftaran/dto/pembayaran.dto.ts` | Hanya `metode`. Jumlah dan bukti tidak lagi dikirim klien |
| `prisma/schema.prisma` | Tambah `BiodataSiswa.diajukanPada` dan `BerkasSiswa.folderPath` |

### 11.2 Endpoint

Siswa (Bearer token, role SISWA):

| Method | Path | Fungsi |
|---|---|---|
| GET | `/pendaftaran/me` | Status lengkap, kekurangan, akses tiap tahap, catatan panitia, tautan berkas |
| POST | `/pendaftaran/biodata` | Simpan biodata (draft), ditolak jika sedang diverifikasi atau sudah valid |
| POST | `/pendaftaran/berkas/:jenis` | Unggah satu berkas (multipart, field `file`). Jenis: `pasfoto`, `kk`, `akta`, `skl`, `kia`, `kip` |
| POST | `/pendaftaran/ajukan` | Kirim formulir dan berkas ke panitia (wajib lengkap) |
| POST | `/pendaftaran/pembayaran` | Pilih `metode` OFFLINE atau ONLINE (multipart, ONLINE wajib field `bukti`) |

Panitia dan admin (Bearer token):

| Method | Path | Fungsi |
|---|---|---|
| GET | `/pendaftaran/panitia/all` | Daftar siswa, halaman dan filter (`page`, `limit`, `search`, `jurusanId`, `statusFormulir`, `statusBerkas`, `statusPembayaran`, `statusDaftarUlang`, `diajukan`) |
| GET | `/pendaftaran/panitia/export` | Unduh Excel (filter sama, maksimal 5 permintaan per menit) |
| GET | `/pendaftaran/panitia/:userId` | Detail siswa, tautan berkas, riwayat catatan |
| PATCH | `/pendaftaran/panitia/:userId/verifikasi` | `statusFormulir` dan/atau `statusBerkas` (REVISI atau VALID), `catatanFormulir`, `catatanAdmin` |
| PATCH | `/pendaftaran/panitia/:userId/pembayaran` | `status` LUNAS atau REVISI, `catatan` |
| PATCH | `/pendaftaran/panitia/:userId/daftar-ulang` | `statusDaftarUlang`, `catatanDaftarUlang` |

### 11.3 Aturan alur

- Siswa bisa mengedit biodata dan berkas selama belum diajukan, atau saat statusnya REVISI. Setelah diajukan atau VALID, terkunci.
- `ajukan` hanya berhasil jika semua data wajib dan berkas wajib (pas foto, KK, akta, SKL, KIA/KTP anak) lengkap. KIP opsional.
- Panitia hanya bisa memverifikasi siswa yang sudah mengajukan. VALID ditolak jika data belum lengkap. REVISI wajib disertai catatan.
- Pembayaran terbuka jika formulir dan berkas sama-sama VALID. Jumlah bayar diambil dari `Jurusan.biayaPendaftaran`.
- OFFLINE tidak memerlukan bukti, ONLINE wajib unggah bukti. Pembayaran LUNAS tidak bisa ditimpa siswa.
- Panitia mengonfirmasi LUNAS. Panitia biasa tidak bisa mengubah pembayaran yang sudah LUNAS (hanya admin). Konfirmasi LUNAS dicek terhadap kuota jurusan.
- Registrasi ulang hanya bisa diproses jika pembayaran LUNAS. Status ADA_KEKURANGAN wajib disertai catatan.
- Setiap keputusan panitia dicatat di `KomentarPanitia` (kolom `panitiaId` berisi id akun pencatat) dan tampil sebagai riwayat untuk siswa.

### 11.4 Penyimpanan berkas

- Bucket privat `spmb-berkas` (AWS_BUCKET). Bucket harus dibuat dan diatur **privat** di Supabase.
- Struktur: `siswa/{slug-nama}-{8 karakter id}/{jenis}.{ext}`, contoh `siswa/anggun-putri-1a2b3c4d/kk.pdf`. Bukti bayar: `bukti-pembayaran.{ext}`.
- Folder ditetapkan sekali (`BerkasSiswa.folderPath`), tidak berubah walau nama diedit.
- Hanya jpg, png, pdf. Isi file dicek (bukan hanya ekstensi). Pas foto maksimal 2 MB, dokumen 5 MB, bukti bayar 2 MB.
- Basis data menyimpan path file, bukan tautan. Tautan unduhan dibuat saat diminta dan berlaku 5 menit.
- Kolom `Pembayaran.buktiUrl` sekarang berisi path file di bucket (nama kolom tidak diubah).

### 11.5 Paket dan migrasi

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner exceljs
npm install -D @types/multer
npx prisma migrate dev --name pendaftaran_alur
npx prisma generate
```

### 11.6 Checklist tes (belum dijalankan)

- [ ] Server start tanpa error
- [ ] Siswa: simpan biodata, unggah semua berkas wajib, `GET /pendaftaran/me` menampilkan tautan dan akses yang benar
- [ ] `ajukan` sebelum lengkap ditolak dengan daftar kekurangan
- [ ] Setelah diajukan, biodata dan berkas tidak bisa diubah
- [ ] Panitia memberi REVISI tanpa catatan ditolak, dengan catatan berhasil, siswa bisa mengedit lagi dan `ajukan` ulang
- [ ] Pembayaran terkunci sebelum formulir dan berkas VALID
- [ ] Pembayaran ONLINE tanpa bukti ditolak, jumlah mengikuti biaya jurusan walau klien mengirim jumlah lain (field tambahan ditolak 400)
- [ ] Panitia konfirmasi LUNAS, siswa tidak bisa mengirim ulang pembayaran
- [ ] Registrasi ulang sebelum LUNAS ditolak, ADA_KEKURANGAN tanpa catatan ditolak
- [ ] Ekspor Excel terbuka di Excel dengan NIK dan nomor HP tetap utuh
- [ ] Akun PANITIA memanggil endpoint siswa mendapat 403, akun SISWA memanggil endpoint panitia mendapat 403
- [ ] `/pendaftaran/panitia/all` tidak menampilkan password atau OTP

### 11.7 Catatan dan kekurangan

- Endpoint daftar jurusan sudah ada sejak tahap 1 (bagian 12).
- Format respons `GET /pendaftaran/me` berubah menjadi `{ status, data: {...} }`.
- Field di luar DTO ditolak 400.
- Kuota jurusan sekarang dikunci di basis data saat penempatan (bagian 12.3).
- Riwayat ekspor hanya tercatat di log server, belum di basis data.

---

## 12. Tahap 1: Avatar, Jurusan Cadangan, Gelombang, Pengaturan (2 November 2026)

### 12.1 Yang diperbaiki dari file kiriman

Di `pendaftaran.service.ts` dan `panitia.service.ts`, `diajukanPada` diganti `userId` di tiga tempat (kemungkinan karena kolom `diajukanPada` belum ada di skema). Akibatnya `bisaMengajukan` tidak pernah benar untuk pengajuan pertama, panitia bisa memverifikasi siswa yang belum mengajukan, dan filter `diajukan` selalu lolos. Semuanya dikembalikan, dan kolomnya sekarang ada di skema.

### 12.2 File

Baru:

| File | Isi |
|---|---|
| `src/konfigurasi/` (module, service, controller, jurusan.controller, dto/jurusan, gelombang, pengaturan) | Daftar jurusan untuk semua pengguna, CRUD jurusan dan gelombang untuk admin, pengaturan rekening dan instruksi |
| `src/pendaftaran/utils/avatar.util.ts` | Memperkecil foto (512 x 512, JPEG), memutar sesuai EXIF, menghapus metadata |

Diperbarui:

| File | Perubahan |
|---|---|
| `prisma/schema.prisma` | `Jurusan` (tanpa kolom gelombang, tambah `aktif`, tiga relasi), model `GelombangPendaftaran` dan `Pengaturan`, `BiodataSiswa` (`avatarUrl`, `nis`, `jurusanCadanganId`, `jurusanDiterimaId`, `gelombangId`, `diajukanPada`), `BerkasSiswa` (hapus `filePasfoto`, tambah `folderPath`) |
| `src/storage/storage.service.ts` | Dua bucket: `berkas` dan `avatar` (`AWS_BUCKET_AVATAR`, bila kosong memakai bucket berkas) |
| `src/pendaftaran/pendaftaran.service.ts`, `pendaftaran.controller.ts`, `pendaftaran.module.ts` | Avatar, jurusan cadangan, NIS, gelombang saat mengajukan, biaya dari jurusan yang diterima, info rekening dan instruksi |
| `src/pendaftaran/panitia.service.ts` | Penempatan jurusan saat VALID, avatar dan kolom baru di daftar dan detail, filter jurusan dan gelombang |
| `src/pendaftaran/dto/biodata.dto.ts`, `query-panitia.dto.ts` | `nis`, `jurusanCadanganId`, `gelombangId` |
| `src/pendaftaran/utils/berkas.config.ts`, `kelengkapan.util.ts` | Pas foto keluar dari berkas (menjadi avatar), foto profil dan jurusan cadangan wajib untuk mengajukan |
| `src/app.module.ts` | Menambah `KonfigurasiModule` |

### 12.3 Aturan baru

- Foto profil (avatar) diunggah lewat `POST /pendaftaran/avatar`, wajib untuk mengajukan, dikunci setelah diajukan atau VALID. Disimpan di `avatar/{userId}.jpg`.
- Siswa memilih jurusan utama dan jurusan cadangan (tidak boleh sama, harus aktif). NIS opsional.
- Saat mengajukan, siswa otomatis masuk gelombang yang sedang berjalan. Jika belum ada gelombang sama sekali, tidak ada pembatasan. Jika ada gelombang tetapi tidak ada yang aktif pada tanggal itu, pengajuan ditolak ("Pendaftaran belum dibuka atau sudah ditutup").
- Penempatan jurusan terjadi saat formulir dan berkas sama-sama VALID: jurusan utama jika masih ada kuota, jika penuh pindah ke jurusan cadangan, jika keduanya penuh verifikasi ditolak dan panitia diminta memberi REVISI. Kuota dikunci di basis data (`SELECT ... FOR UPDATE`) agar tidak tembus. Kursi dilepas jika status kembali REVISI.
- Biaya pembayaran memakai jurusan yang diterima. Pembayaran terkunci jika penempatan belum ada.
- Setelah pembayaran terbuka, `GET /pendaftaran/me` menyertakan info rekening dan instruksi offline. Setelah LUNAS, menyertakan instruksi registrasi ulang. Isinya diatur admin.
- `GET /pendaftaran/panitia/all` kini mengirim avatar, jurusan utama, cadangan, diterima, dan gelombang.

### 12.4 Endpoint baru

| Method | Path | Akses |
|---|---|---|
| POST | `/pendaftaran/avatar` | Siswa, multipart field `file` (jpg atau png, maks 3 MB) |
| GET | `/jurusan` | Semua pengguna yang login (hanya jurusan aktif, dengan sisa kuota) |
| GET | `/konfigurasi/jurusan` | Admin dan panitia (semua jurusan) |
| POST, PATCH `:id`, DELETE `:id` | `/konfigurasi/jurusan` | Admin |
| GET | `/konfigurasi/gelombang` | Admin dan panitia |
| POST, PATCH `:id`, DELETE `:id` | `/konfigurasi/gelombang` | Admin |
| GET | `/konfigurasi/pengaturan` | Admin dan panitia |
| PUT | `/konfigurasi/pengaturan` | Admin (`bankNama`, `bankNomorRekening`, `bankAtasNama`, `instruksiPembayaranOffline`, `instruksiRegistrasiUlang`) |

### 12.5 Paket dan migrasi

```bash
npm install sharp
npx prisma migrate dev --name tahap1_jurusan_gelombang_avatar
npx prisma generate
```

Prisma akan memperingatkan penghapusan kolom `jurusans.gelombang` dan `berkas_siswa.filePasfoto`. Jika belum ada data penting, jawab ya.

Tambahkan di `.env` (opsional, bila ingin bucket avatar terpisah, buat bucket privat dengan nama itu di Supabase):

```
AWS_BUCKET_AVATAR=spmb-avatars
```

### 12.6 Isi data awal lewat API (login sebagai admin)

1. `POST /konfigurasi/jurusan` untuk tiap jurusan: `{ "namaJurusan": "...", "kuota": 36, "biayaPendaftaran": 250000 }`
2. `POST /konfigurasi/gelombang`: `{ "nama": "Gelombang 1", "tanggalMulai": "2026-11-01", "tanggalSelesai": "2026-12-15" }` (tanggal tanpa jam dibaca zona WITA)
3. `PUT /konfigurasi/pengaturan`: rekening Bank BPD dan teks instruksi

### 12.7 Checklist tes tahap 1 (belum dijalankan)

- [ ] Server start tanpa error setelah migrasi
- [ ] `GET /jurusan` menampilkan jurusan aktif dengan `sisaKuota`
- [ ] Siswa menyimpan biodata dengan jurusan utama dan cadangan. Dua jurusan sama ditolak
- [ ] Unggah avatar JPG dan PNG berhasil, file palsu (ekstensi diganti) ditolak, hasil di bucket berukuran kecil
- [ ] `ajukan` tanpa foto profil atau jurusan cadangan ditolak dengan daftar kekurangan
- [ ] `ajukan` masuk gelombang yang benar, di luar tanggal gelombang ditolak
- [ ] Panitia memberi VALID pada formulir dan berkas: siswa mendapat `jurusanDiterimaId`
- [ ] Kuota jurusan utama diset 1: siswa kedua otomatis ke jurusan cadangan, riwayat mencatatnya
- [ ] Kuota utama dan cadangan penuh: verifikasi VALID ditolak 409
- [ ] REVISI melepas kursi, jumlah `terisi` berkurang
- [ ] Pembayaran memakai biaya jurusan yang diterima, `infoPembayaran` tampil di `GET me`
- [ ] Setelah LUNAS, `instruksiRegistrasiUlang` tampil
- [ ] Panitia tidak bisa memanggil `/konfigurasi` untuk menulis (403), admin bisa
- [ ] Daftar panitia menampilkan avatar, jurusan cadangan, dan gelombang