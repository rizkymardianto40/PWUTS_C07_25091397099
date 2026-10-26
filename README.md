# Website Kantin Kampus — Panel Admin

**Tugas UTS Pemrograman Web**

| | |
|---|---|
| Nama | Rizky Mardianto |
| NIM | 25091397099 |
| Kelompok | C07 |
| Topik | Website Kantin Kampus |
| Repositori | https://github.com/rizkymardianto40/PWUTS_C07_25091397099 |

Aplikasi web pengelolaan kantin kampus: menampilkan menu, mencatat transaksi
pesanan, dan memantau status pesanan.

Dibangun dengan **HTML, CSS, JavaScript/jQuery**, dan **AJAX**. Aplikasi berjalan
**tanpa database dan tanpa PHP** — cukup dibuka dengan **Live Server**.

---

## 1. Pemenuhan Ketentuan Soal UTS

Ringkasan cepat — semua butir soal dan tempat pemenuhannya:

| Butir | Ketentuan soal | Dipenuhi oleh |
|---|---|---|
| 1.a | UTS bersifat pribadi | Dikerjakan sendiri |
| 1.b | Topik sesuai proposal | Website Kantin Kampus |
| 2.a | `index.html` layout utama, responsif, HTML/CSS/JS, hyperlink menu ke 2.b & 2.c dengan **AJAX**, gambar | `index.html`, `css/style.css`, `js/admin.js` |
| 2.b | Min. 1 halaman HTML berisi konten topik + interaktif jQuery, bagian dari layout utama | `pages/dashboard.html` |
| 2.c | Min. 1 halaman HTML berisi **form transaksi sesuai struktur database proposal** + validasi JS/jQuery sebelum submit, bagian dari layout utama | `pages/transaksi.html` + `js/admin.js` |
| 2.d | Tidak boleh sama dengan anggota kelompok | Rancangan sendiri |
| 2.e | Catatan pengerjaan (README.md) | Berkas ini |
| 3.a | Semua file diunggah ke akun GitHub | Seluruh berkas ada di repositori (lihat tabel identitas di atas) |
| 3.b | Repositori bernama `PWUTS_C07_25091397099` | Nama repositori sudah sesuai |
| 3.c | URL harus bisa diakses | Repositori bersifat **Public** |

### Butir 2.a — Layout utama, responsif, hyperlink dengan AJAX

| Ketentuan | Implementasi |
|---|---|
| `index.html` sebagai layout utama | Sidebar + topbar + wadah `<section id="page-content">` |
| Responsive web design | CSS Grid + Flexbox, media query 1100 / 1050 / 1024 / 860 / 640 / 520 / 420 px |
| HTML, CSS, JavaScript/jQuery | `index.html`, `css/style.css`, `js/admin.js`, `js/api.js` |
| **Hyperlink** menuju halaman 2.b dan 2.c | Sidebar berisi `<a href="pages/dashboard.html">` dan `<a href="pages/transaksi.html">` — tautan asli, bukan tombol |
| Memakai **teknik AJAX** | Klik tautan dicegat jQuery, isi `#page-content` diganti lewat `$.ajax()` tanpa reload; URL diperbarui `history.pushState()` |
| Gambar untuk layout/konten | Foto menu di `assets/*.jpg` tampil pada tabel menu, keranjang, dan panel menu terlaris |

Bukti AJAX: saat berpindah menu, halaman **tidak** reload penuh — hanya area
konten yang dimuat ulang, dan judul tab serta URL ikut berubah.

### Butir 2.b — Halaman dengan interaktivitas JavaScript/jQuery

Halaman: **`pages/dashboard.html`** (dimuat ke dalam layout utama).

Interaksi yang tersedia:

1. **Kartu statistik beranimasi** — total menu, pesanan, pendapatan, dan stan
   dianimasikan dengan `$(objek).animate()`.
2. **Klik baris pesanan** → panel rincian item muncul di bawah tabel.
3. **Chip distribusi status** → mengklik salah satu status menyaring tabel
   pesanan terbaru secara langsung.
4. **Menu terlaris** → bar kemajuan yang lebarnya dihitung dari jumlah item terjual.
5. **Tombol "Muat ulang"** → mengambil ulang data lewat AJAX.

### Butir 2.c — Form transaksi sesuai struktur database + validasi

Halaman: **`pages/transaksi.html`**.

Form mengikuti struktur tabel pada proposal:

| Kolom pada rancangan database | Elemen form |
|---|---|
| `users.id_user` | dropdown **Nama pemesan** (diisi dari `data/users.json`) |
| `detail_pesanan.id_menu` | dropdown **Menu** (diisi dari `data/menu.json`) |
| `detail_pesanan.jumlah` | input **Jumlah** dengan tombol − / + |
| `detail_pesanan.harga_satuan` | diambil dari `menu.harga` |
| `detail_pesanan.subtotal` | dihitung otomatis: `harga_satuan × jumlah` |
| `pesanan.total` | dihitung otomatis dari seluruh item |
| `pesanan.catatan` | textarea, maksimal 500 karakter |
| `pesanan.status` | otomatis `Menunggu` saat dibuat |

**Validasi JavaScript/jQuery dijalankan lebih dulu, sebelum data diproses.**
Aturan validasi ada di `ATURAN_TRANSAKSI` pada `js/admin.js`:

- Nama pemesan **wajib** dipilih.
- Catatan **maksimal 500 karakter** (ada penghitung sisa karakter langsung).
- Minimal **satu menu** harus ada di keranjang.
- Jumlah harus **bilangan bulat ≥ 1** dan **tidak melebihi stok**.
- Menu yang sama ditambahkan dua kali akan digabung jumlahnya.

Bila tidak valid: field diberi bingkai merah, pesan kesalahan muncul di bawah
field, fokus berpindah ke field pertama yang salah, dan **data tidak diproses
sama sekali**.

Bila valid, data diteruskan ke `Api.buatPesanan()` di `js/api.js`, yang
menghitung ulang total dari harga menu (bukan dari angka yang dikirim browser),
memeriksa stok, lalu menyimpan hasilnya.

> Karena demo ini berjalan tanpa server, penyimpanan dilakukan di **localStorage
> browser**. Fungsi `Api.buatPesanan()` adalah satu-satunya tempat yang perlu
> diubah bila nanti ingin disambungkan ke server (ganti isinya dengan `$.ajax`
> POST ke endpoint).

### Butir 2.d — Berbeda dari anggota kelompok

Topik, rancangan database, dan desain antarmuka disusun sendiri sesuai proposal.

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
│   ├── api.js               Sumber data: baca JSON + simpan ke browser
│   └── admin.js             Routing AJAX, render halaman, validasi form
├── pages/
│   ├── dashboard.html       Butir 2.b — halaman interaktif
│   ├── kelola-menu.html     Tabel menu + form tambah/ubah (modal)
│   ├── pesanan.html         Daftar pesanan + ubah status
│   └── transaksi.html       Butir 2.c — form transaksi + validasi
├── data/                    Data aplikasi (berkas JSON)
│   ├── users.json
│   ├── kategori.json
│   ├── penjual.json
│   ├── menu.json
│   ├── pesanan.json
│   └── detail_pesanan.json
├── database/
│   └── kantin_kampus.sql    Rancangan tabel dari proposal (dokumen acuan)
└── assets/                  Foto menu (.jpg)
```

Catatan: `database/kantin_kampus.sql` **tidak perlu dijalankan**. Berkas itu
disertakan sebagai bukti rancangan tabel yang menjadi acuan form pada butir 2.c.

---

## 3. Rancangan Tabel (acuan form)

Struktur ini yang dipakai sebagai dasar penyusunan form transaksi.

| Tabel | Kolom penting |
|---|---|
| `users` | `id_user`, `nama`, `username`, `password`, `role` |
| `kategori` | `id_kategori`, `nama_kategori` |
| `penjual` | `id_penjual`, `nama_penjual`, `lokasi`, `jam_operasional`, `deskripsi`, `aktif` |
| `menu` | `id_menu`, `id_kategori`, `id_penjual`, `nama_menu`, `harga`, `stok`, `deskripsi`, `foto`, `populer`, `aktif` |
| `pesanan` | `id_pesanan`, `id_user`, `tanggal`, `total`, `status`, `catatan` |
| `detail_pesanan` | `id_detail`, `id_pesanan`, `id_menu`, `jumlah`, `harga_satuan`, `subtotal` |

Relasi: `menu` → `kategori`, `menu` → `penjual`, `pesanan` → `users`,
`detail_pesanan` → `pesanan` dan → `menu`.

Status pesanan: `Menunggu` → `Diproses` → `Siap diambil` → `Selesai`
(atau `Dibatalkan`).

---

## 4. Cara Menjalankan

Tidak perlu memasang database, tidak perlu XAMPP. Cukup **Live Server**.

1. Buka folder proyek di VS Code.
2. Klik kanan `index.html` di panel Explorer → **Open with Live Server**.
   (Bisa juga klik tulisan **Go Live** di pojok kanan bawah VS Code.)
3. Browser terbuka di `http://127.0.0.1:5500/index.html` — perhatikan awalnya
   `http://`, bukan `file://`.
4. Selesai. Semua fitur bisa dipakai.

> **Penting:** jangan membuka `index.html` dengan klik ganda. Protokol `file://`
> membuat browser memblokir AJAX ke berkas lokal, sehingga data tidak bisa
> dimuat. Aplikasi akan menampilkan petunjuk bila hal itu terjadi.

### Mengembalikan data ke kondisi awal

Perubahan data (tambah menu, transaksi baru, ubah status) tersimpan di browser.
Untuk mengembalikannya ke data awal, buka **Console** browser (F12) lalu:

```js
localStorage.removeItem('kk_demo_db_v1');
location.reload();
```

---

## 5. Cara Kerja AJAX dan Penyimpanan Data

1. **Navigasi halaman** — `js/admin.js` → `navigate()`:
   klik `<a data-page>` → `preventDefault()` → `$.ajax({ url: 'pages/xxx.html' })`
   → isi `#page-content` diganti → `history.pushState()`.
   Tombol Back/Forward browser ditangani lewat event `popstate`.
2. **Pengambilan data** — semua lewat `js/api.js`. Fungsi `Api.menu()`,
   `Api.pesanan()`, `Api.statistik()` membaca `data/*.json` dengan `$.getJSON`
   dan mengembalikan jQuery Promise.
3. **Penyimpanan** — `Api.simpanMenu()`, `Api.buatPesanan()`,
   `Api.ubahStatusPesanan()`, dan `Api.hapusPesanan()` menulis ke `localStorage`
   dengan kunci `kk_demo_db_v1`.
4. **Pemuatan awal** — `Api.init()` membaca seluruh berkas JSON, lalu menempelkan
   perubahan yang tersimpan di browser di atasnya.

---

## 6. Teknologi

- HTML5
- CSS3 (Grid, Flexbox, media query)
- JavaScript + **jQuery 3.7.1** — `$.ajax`, `$.getJSON`, `$.when`, `$.Deferred`,
  `$.animate`, event delegation
- JSON sebagai sumber data (`data/*.json`)
- `localStorage` untuk menyimpan perubahan
