# Website Kantin Kampus — Panel Admin

**Tugas UTS Pemrograman Web**

| | |
|---|---|
| Nama | Rizky Mardianto |
| NIM | 25091397099 |
| Kelompok | A07 |
| Topik | Website Kantin Kampus |
| Repositori | `https://github.com/<username>/PWUTS_A07_25091397099` |

Aplikasi web pengelolaan kantin kampus: menampilkan menu, mencatat transaksi
pesanan, dan memantau status pesanan. Dibangun dengan **HTML, CSS, JavaScript
(jQuery), PHP, dan MySQL**, serta memakai **AJAX** untuk berpindah halaman dan
mengambil data tanpa memuat ulang (reload) halaman.

---

## 1. Pemenuhan Ketentuan Soal UTS

Ringkasan cepat — semua butir soal dan tempat pemenuhannya:

| Butir | Ketentuan soal | Dipenuhi oleh |
|---|---|---|
| 1.a | UTS bersifat pribadi | Dikerjakan sendiri |
| 1.b | Topik sesuai proposal | Website Kantin Kampus |
| 2.a | `index.html` layout utama, responsif, HTML/CSS/JS, hyperlink menu ke 2.b & 2.c dengan **AJAX**, gambar | `index.html`, `css/style.css`, `js/admin.js` |
| 2.b | Min. 1 halaman HTML berisi konten topik + interaktif jQuery, bagian dari layout utama | `pages/dashboard.html` |
| 2.c | Min. 1 halaman HTML berisi **form transaksi sesuai struktur database proposal** + validasi JS/jQuery sebelum submit ke server HTTP, bagian dari layout utama | `pages/transaksi.html` + `js/admin.js` |
| 2.d | Tidak boleh sama dengan anggota kelompok | Rancangan sendiri |
| 2.e | Catatan pengerjaan (README.md) | Berkas ini |
| 3.a | Semua file diunggah ke akun GitHub | Langkah di bagian 7 |
| 3.b | Repositori bernama `PWUTS_A07_25091397099` | Nama repo saat membuat di GitHub |
| 3.c | URL harus bisa diakses | `https://github.com/<username>/PWUTS_A07_25091397099` |

Penjelasan tiap butir di bawah ini.

### Butir 2.a — Halaman utama sebagai layout, responsif, hyperlink dengan AJAX

| Ketentuan | Implementasi |
|---|---|
| `index.html` sebagai layout utama | `index.html` memuat sidebar, topbar, dan wadah `<section id="page-content">` |
| Tampilan responsif | CSS Grid + Flexbox, media query pada 1100 / 1050 / 1024 / 860 / 640 / 520 / 420 px |
| HTML + CSS + JS/jQuery | `index.html`, `css/style.css`, `js/api.js`, `js/admin.js` |
| **Hyperlink** menuju halaman 2.b dan 2.c | Sidebar berisi `<a href="pages/dashboard.html">` dan `<a href="pages/transaksi.html">` — tautan asli, bukan tombol |
| Memakai **teknik AJAX** | Klik tautan dicegat jQuery, isi `#page-content` diganti lewat `$.ajax()` tanpa reload; URL diperbarui dengan `history.pushState()` |
| Gambar untuk layout | Foto menu di `assets/*.jpg` ditampilkan pada tabel dan keranjang |

Bukti AJAX: saat berpindah menu, halaman **tidak** melakukan reload penuh —
hanya area konten yang dimuat ulang, dan judul tab serta URL ikut berubah.

### Butir 2.b — Halaman HTML dengan interaktivitas JavaScript/jQuery

Halaman: **`pages/dashboard.html`** (menjadi bagian dari layout utama).

Interaksi yang tersedia:

1. **Kartu statistik beranimasi** — angka total menu, pesanan, pendapatan, dan
   stan dianimasikan dengan `$(objek).animate()`.
2. **Klik baris pesanan** → panel rincian item muncul di bawah tabel.
3. **Chip distribusi status** → mengklik salah satu status menyaring tabel
   pesanan terbaru secara langsung.
4. **Menu terlaris** → bar kemajuan (progress bar) yang lebarnya dihitung dari
   jumlah item terjual.
5. **Tombol "Muat ulang"** → mengambil ulang data dari server lewat AJAX.

### Butir 2.c — Halaman form transaksi sesuai struktur database + validasi

Halaman: **`pages/transaksi.html`**.

Form mengikuti struktur tabel pada proposal:

| Kolom database | Elemen form |
|---|---|
| `users.id_user` | dropdown **Nama pemesan** (diisi dari tabel `users`) |
| `detail_pesanan.id_menu` | dropdown **Menu** (diisi dari tabel `menu`) |
| `detail_pesanan.jumlah` | input **Jumlah** dengan tombol − / + |
| `detail_pesanan.harga_satuan` | diambil dari `menu.harga` di server |
| `detail_pesanan.subtotal` | dihitung otomatis: `harga_satuan × jumlah` |
| `pesanan.total` | dihitung otomatis dari seluruh item |
| `pesanan.catatan` | textarea, maksimal 500 karakter |
| `pesanan.status` | otomatis `Menunggu` saat dibuat |

**Validasi JavaScript/jQuery dijalankan SEBELUM data dikirim ke server HTTP.**

Aturan validasi (`ATURAN_TRANSAKSI` pada `js/admin.js`):

- Nama pemesan **wajib** dipilih.
- Catatan **maksimal 500 karakter** (ada penghitung sisa karakter langsung).
- Minimal **satu menu** harus ada di keranjang.
- Jumlah harus **bilangan bulat ≥ 1** dan **tidak melebihi stok**.
- Menu yang sama ditambahkan dua kali akan digabung jumlahnya.

Bila tidak valid: field diberi bingkai merah, pesan kesalahan muncul di bawah
field, fokus berpindah ke field pertama yang salah, dan **tidak ada permintaan
HTTP yang dikirim**. Setelah valid, data baru dikirim lewat `$.ajax()` ke
`api/pesanan.php`.

Validasi juga diulang di sisi server (lapis kedua) supaya data tidak bisa
diakali dengan mematikan JavaScript.

### Butir 2.d — Berbeda dari anggota kelompok

Topik, struktur database, dan desain antarmuka disusun sendiri sesuai proposal.

### Butir 2.e — Penjelasan pekerjaan

Berkas ini (`README.md`).

---

## 2. Struktur Folder

```
kantin-kampus-admin/
├── index.html               Layout utama + sidebar + wadah konten AJAX
├── README.md                Penjelasan pekerjaan (berkas ini)
├── css/
│   └── style.css            Seluruh tampilan dan media query responsif
├── js/
│   ├── api.js               Gerbang AJAX tunggal (mode PHP / mode JSON)
│   └── admin.js             Routing AJAX, render halaman, validasi form
├── pages/
│   ├── dashboard.html       Butir 2.b — halaman interaktif
│   ├── kelola-menu.html     CRUD menu (tabel + modal form)
│   ├── pesanan.html         Daftar pesanan + ubah status
│   └── transaksi.html       Butir 2.c — form transaksi + validasi
├── api/
│   ├── menu.php             CRUD menu (GET/POST/PUT/DELETE)
│   ├── pesanan.php          CRUD pesanan + detail_pesanan (transaksi SQL)
│   ├── kategori.php         Daftar kategori
│   ├── penjual.php          Daftar stan penjual
│   ├── users.php            Daftar user untuk dropdown pemesan
│   └── statistik.php        Angka ringkas dashboard
├── auth/
│   ├── login.php            Login admin (session + password_verify)
│   └── logout.php           Hapus session
├── config/
│   └── database.php         Koneksi PDO + helper (json_out, validasi, dll.)
├── database/
│   └── kantin_kampus.sql    Skema + data contoh (siap import)
├── data/                    Salinan data JSON (untuk mode demo tanpa PHP)
│   ├── users.json
│   ├── kategori.json
│   ├── penjual.json
│   ├── menu.json
│   ├── pesanan.json
│   └── detail_pesanan.json
├── tools/
│   └── export-json.php      Menyalin isi database ke folder data/
└── assets/                  Foto menu (.jpg)
```

---

## 3. Struktur Database

Nama database: **`kantin_kampus`** (6 tabel, `InnoDB`, `utf8mb4`).

| Tabel | Kolom penting |
|---|---|
| `users` | `id_user`, `nama`, `username`, `password`, `role` (`mahasiswa`/`admin`) |
| `kategori` | `id_kategori`, `nama_kategori` |
| `penjual` | `id_penjual`, `nama_penjual`, `lokasi`, `jam_operasional`, `deskripsi`, `aktif` |
| `menu` | `id_menu`, `id_kategori`, `id_penjual`, `nama_menu`, `harga`, `stok`, `deskripsi`, `foto`, `populer`, `aktif` |
| `pesanan` | `id_pesanan`, `id_user`, `tanggal`, `total`, `status`, `catatan` |
| `detail_pesanan` | `id_detail`, `id_pesanan`, `id_menu`, `jumlah`, `harga_satuan`, `subtotal` |

Relasi: `menu` → `kategori`, `menu` → `penjual`, `pesanan` → `users`,
`detail_pesanan` → `pesanan` (CASCADE) dan → `menu`.

Status pesanan: `Menunggu` → `Diproses` → `Siap diambil` → `Selesai`
(atau `Dibatalkan`).

---

## 4. Cara Menjalankan

Aplikasi bisa dijalankan **tanpa database sama sekali**. Cukup Live Server —
seluruh fitur (kelola menu, transaksi, ubah status, validasi form) tetap berfungsi
penuh. MySQL hanya **opsional**, gunanya untuk menyimpan data secara permanen.

| Mode | Syarat | Penyimpanan data | Untuk apa |
|---|---|---|---|
| **Demo (JSON)** — default | Live Server / server statis | `localStorage` browser | Demo & pengumpulan tugas |
| **PHP + MySQL** — opsional | Apache & MySQL XAMPP | Permanen di database | Menunjukkan backend bekerja |

Penanda mode terlihat di kiri bawah sidebar: **"Mode demo (data JSON)"** (kuning)
atau **"Terhubung ke MySQL"** (hijau).

> **Penting:** jangan membuka `index.html` dengan klik ganda. Protokol `file://`
> membuat browser memblokir AJAX ke berkas lokal, sehingga data tidak bisa
> dimuat. Aplikasi akan menampilkan petunjuk bila hal ini terjadi. Gunakan
> **Live Server**.

### A. Cara utama — Live Server (tanpa database)

1. Buka folder proyek di VS Code.
2. Klik kanan `index.html` di panel Explorer → **Open with Live Server**.
   (Bisa juga klik tulisan **Go Live** di pojok kanan bawah VS Code.)
3. Browser terbuka di `http://127.0.0.1:5500/index.html` — perhatikan awalnya
   `http://`, bukan `file://`.
4. Semua fitur bisa dicoba. Perubahan tersimpan di browser, jadi tetap ada
   setelah halaman dimuat ulang.
5. Untuk mengembalikan data demo ke kondisi awal, buka Console browser lalu:
   ```js
   localStorage.removeItem('kk_demo_db_v1');
   location.reload();
   ```

### B. Opsional — memakai MySQL

Tidak wajib. Lakukan ini hanya kalau ingin menunjukkan data benar-benar
tersimpan di database.

1. Buka **XAMPP Control Panel**, nyalakan **Apache** dan **MySQL**.
2. Import database:
   - Buka `http://localhost/phpmyadmin`
   - Tab **Import** → pilih `database/kantin_kampus.sql` → **Go**
   - Atau lewat terminal:
     ```
     C:\xampp\mysql\bin\mysql.exe -u root < database/kantin_kampus.sql
     ```
3. Salin folder proyek ke `C:\xampp\htdocs\` (misalnya jadi
   `C:\xampp\htdocs\kantin-kampus-admin`).
4. Buka `http://localhost/kantin-kampus-admin/`

> PHP harus dijalankan lewat Apache. **Live Server tidak bisa menjalankan PHP** —
> kalau memakai Live Server, aplikasi otomatis masuk mode demo.

### Kenapa file database tetap disertakan?

Karena butir 2.c meminta form transaksi yang **sesuai struktur database pada
proposal**. Skema di `database/kantin_kampus.sql` menjadi bukti bahwa kolom pada
form (`id_user`, `id_menu`, `jumlah`, `subtotal`, `total`, `catatan`) memang
mengikuti rancangan tabel — bukan dikarang. File `api/*.php` juga disertakan
sebagai bukti kesiapan backend, meskipun tidak wajib dijalankan.

### Akun demo

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | admin |
| `rizky` | `admin123` | mahasiswa |
| `nadia` | `admin123` | mahasiswa |
| `bagas` | `admin123` | mahasiswa |

Password disimpan sebagai hash bcrypt (`password_hash()`), bukan teks biasa.

---

## 5. Daftar Endpoint API

Semua endpoint mengembalikan JSON dengan bentuk
`{ ok: true, message: "...", data: ... }` atau `{ ok: false, error: "..." }`.

| Endpoint | Method | Fungsi |
|---|---|---|
| `api/menu.php` | GET | Daftar menu (bisa `?id=`, `?kategori=`, `?populer=`) |
| `api/menu.php` | POST | Tambah menu |
| `api/menu.php` | POST `_method=PUT` | Ubah menu |
| `api/menu.php` | POST `_method=DELETE` | Hapus menu |
| `api/pesanan.php` | GET | Daftar pesanan (`?id=` untuk rincian) |
| `api/pesanan.php` | POST | Buat pesanan + detail (satu transaksi SQL) |
| `api/pesanan.php` | POST `_method=PUT` | Ubah status pesanan |
| `api/pesanan.php` | POST `_method=DELETE` | Hapus pesanan (stok dikembalikan) |
| `api/kategori.php` | GET | Daftar kategori |
| `api/penjual.php` | GET | Daftar stan penjual |
| `api/users.php` | GET | Daftar user |
| `api/statistik.php` | GET | Angka ringkas dashboard |
| `auth/login.php` | POST | Login (`{username, password}`) |
| `auth/logout.php` | GET | Logout |

Catatan teknis:

- PHP hanya mem-parsing body untuk method `POST`, sehingga ubah/hapus memakai
  **method spoofing** lewat field `_method`.
- Semua query memakai **prepared statement** (PDO) untuk mencegah SQL injection.
- Total dan subtotal **dihitung ulang di server** dari `menu.harga`, jadi angka
  yang dikirim dari browser tidak bisa dimanipulasi.
- Pembuatan pesanan berjalan dalam satu transaksi SQL: bila satu item gagal
  (misalnya stok habis), seluruh pesanan dibatalkan (`rollBack()`).
- Stok menu otomatis berkurang saat pesanan dibuat dan kembali saat dihapus.

---

## 6. Cara Kerja AJAX

1. **Navigasi halaman** — `js/admin.js` → `navigate()`:
   klik `<a data-page>` → `preventDefault()` → `$.ajax({ url: 'pages/xxx.html' })`
   → isi `#page-content` diganti → `history.pushState()`.
   Tombol Back/Forward browser ditangani lewat event `popstate`.
2. **Pengambilan data** — semua lewat `js/api.js`. Fungsi seperti
   `Api.menu()`, `Api.pesanan()`, `Api.statistik()` mengembalikan jQuery Promise.
3. **Pengiriman data** — `Api.buatPesanan()`, `Api.simpanMenu()`, dan
   `Api.ubahStatusPesanan()` mengirim JSON ke endpoint PHP.
4. **Penanda mode** — saat aplikasi dibuka, `Api.init()` mencoba memanggil
   `api/menu.php`. Kalau menjawab JSON → mode PHP. Kalau gagal (Live Server) →
   mode demo yang membaca `data/*.json` lewat `$.getJSON()`.

---

## 7. Langkah Mengunggah ke GitHub

> Ketentuan soal: folder/repositori harus bernama
> **`PWUTS_<kode_kelompok>_<nim>`** → `PWUTS_A07_25091397099`, dan harus bisa
> diakses di `https://github.com/<username>/PWUTS_A07_25091397099`.

### Langkah 0 — Persiapan

1. Buat akun GitHub di <https://github.com> (kalau belum punya).
2. Pasang **Git** di <https://git-scm.com/download/win> (Windows), lalu cek:
   ```bash
   git --version
   ```
3. Di VS Code, buka **Source Control** (ikon cabang di kiri) untuk memastikan
   Git terdeteksi.

### Langkah 1 — Buat repositori di GitHub

1. Klik tombol **+** di kanan atas GitHub → **New repository**.
2. Isi **Repository name**: `PWUTS_A07_25091397099`
   (harus persis, huruf besar/kecil berpengaruh).
3. Pilih **Public** (wajib, agar bisa diperiksa).
4. **Jangan** centang "Add a README file" (README sudah ada di folder).
5. Klik **Create repository**.

> **Hati-hati:** kalau nanti memakai menu VS Code, nama yang terisi otomatis
> adalah nama folder lokal (`kantin-kampus-admin`). **Ganti** menjadi
> `PWUTS_A07_25091397099`. Ini kesalahan paling sering dan berakibat URL tidak
> sesuai ketentuan butir 3.c.

### Langkah 2 — Riwayat Git (sudah selesai)

Folder ini **sudah** dijalankan `git init`, `git add`, dan `git commit`.
Tidak perlu diulang. Cek dengan:

```bash
git log --oneline
```

Harus muncul minimal satu baris commit.

Kalau nanti Anda mengubah file lagi, simpan perubahannya dengan:

```bash
git add .
git commit -m "keterangan perubahan"
```

### Langkah 3 — Hubungkan ke repositori GitHub

Ganti `<username>` dengan username GitHub Anda:

```bash
git remote add origin https://github.com/<username>/PWUTS_A07_25091397099.git
git push -u origin main
```

Saat menjalankan `git push` pertama kali, akan muncul **jendela login GitHub di
browser**. Klik **"Sign in with your browser"**, lalu setujui permintaannya.
Setelah itu Git menyimpan izinnya, jadi push berikutnya tidak perlu login lagi.

Bila jendela browser tidak muncul, gunakan **Personal Access Token** sebagai
password (bukan password akun). Buat token di:
**GitHub → Settings → Developer settings → Personal access tokens → Tokens
(classic) → Generate new token**, centang scope **`repo`**.

> Jika muncul error **"Please tell me who you are"**, atur identitas Git sekali
> saja (ganti email dengan email akun GitHub Anda):
>
> ```bash
> git config --global user.name "Rizky Mardianto"
> git config --global user.email "email-anda@gmail.com"
> ```

### Langkah 4 — Verifikasi

1. Buka `https://github.com/<username>/PWUTS_A07_25091397099`
2. Pastikan **semua file** terlihat: `index.html`, `css/`, `js/`, `pages/`,
   `api/`, `database/`, `assets/`, `README.md`.
3. Pastikan README tampil di halaman utama repositori.

> Soal menyebut: URL yang salah atau tidak dapat diakses dianggap **tidak
> mengumpulkan**. Periksa kembali ejaan nama repositori dan pastikan statusnya
> **Public**.

### Yang dikumpulkan

Yang perlu diserahkan **hanya URL repositori**:

```
https://github.com/<username>/PWUTS_A07_25091397099
```

Kirimkan lewat tempat yang ditentukan dosen (LMS / Google Form / email).

**Cara memastikan repo benar-benar bisa diakses dosen:** buka URL tersebut di
jendela **incognito / private** (Ctrl+Shift+N). Kalau tetap terbuka dan file
terlihat, berarti repo sudah Public dan aman. Kalau diminta login, berarti masih
Private — ubah di **Settings → General → Danger Zone → Change visibility**.

### Cara lewat VS Code (tanpa terminal)

Kalau lebih nyaman tanpa mengetik perintah:

1. Buka panel **Source Control** (ikon cabang) di sidebar kiri VS Code.
2. Klik tombol **Publish Branch**.
3. VS Code minta izin ke GitHub → klik **Allow** / **Sign in**, lalu login di
   browser yang terbuka.
4. Muncul kotak memilih **Public** atau **Private** → pilih **Public**.
5. VS Code menyarankan nama repositori dari nama folder
   (`kantin-kampus-admin`) → **ganti** menjadi `PWUTS_A07_25091397099`.
6. Klik **Publish** dan tunggu proses unggah selesai.

---

## 8. Pemecahan Masalah

| Gejala | Penyebab & solusi |
|---|---|
| Sidebar menulis "Mode demo (data JSON)" padahal ingin pakai MySQL | Apache belum menyala, atau proyek dibuka lewat Live Server. Nyalakan Apache dan akses lewat `http://localhost/...` |
| Sidebar menulis "Perlu server lokal" | `index.html` dibuka dengan klik ganda. Jalankan lewat Live Server atau Apache |
| Muncul pesan "Koneksi database gagal" | Database belum diimport, atau MySQL mati. Import `database/kantin_kampus.sql` |
| Halaman konten kosong / "Halaman gagal dimuat" | Folder `pages/` tidak ikut tersalin. Pastikan seluruh folder terunggah |
| Foto menu tidak tampil | Nama file di kolom `foto` harus sama persis dengan file di `assets/` (termasuk spasi dan huruf besar/kecil) |
| Login gagal terus | Jalankan ulang import SQL, atau buat hash baru: `php -r "echo password_hash('admin123', PASSWORD_DEFAULT);"` lalu `UPDATE users SET password='...' WHERE username='admin';` |
| Perubahan hilang setelah reload (mode demo) | Normal — mode demo menyimpan di browser. Jalankan mode PHP untuk penyimpanan permanen |
| Data demo ingin dikembalikan | `localStorage.removeItem('kk_demo_db_v1'); location.reload();` |

---

## 9. Teknologi

- HTML5, CSS3 (Grid, Flexbox, media query)
- JavaScript + **jQuery 3.7.1** (`$.ajax`, `$.getJSON`, `$.when`, `$.Deferred`,
  `$.animate`, event delegation)
- PHP 8.2 (PDO, prepared statement, session, `password_hash`)
- MySQL / MariaDB
