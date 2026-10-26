/* =====================================================================
 * js/api.js — Gerbang AJAX tunggal untuk seluruh aplikasi
 * ---------------------------------------------------------------------
 * Tugas UTS Pemrograman Web — PWUTS_A07_25091397099
 *
 * Semua permintaan data melewati objek `Api` ini. Tujuannya agar
 * halaman (HTML) tidak pernah tahu apakah datanya datang dari:
 *
 *   1. mode "php"  -> endpoint PHP + MySQL (butuh XAMPP/Apache)
 *   2. mode "json" -> file data/*.json + localStorage
 *                     (untuk dibuka lewat Live Server tanpa PHP)
 *
 * Mode dideteksi otomatis saat aplikasi pertama kali dijalankan,
 * sehingga website tetap bisa didemokan walau MySQL belum menyala.
 * ===================================================================== */

var Api = (function ($) {
  'use strict';

  var CONFIG = {
    phpBase: 'api/',
    jsonBase: 'data/',
    storageKey: 'kk_demo_db_v1',
    mode: null,          // 'php' | 'json'
    terdeteksi: false,
    latency: 180         // jeda buatan agar indikator loading terlihat
  };

  /* ------------------------------------------------------------------
   * 1. UTILITAS
   * ------------------------------------------------------------------ */

  /** Bungkus setTimeout sebagai jQuery Deferred. */
  function tunda(nilai, ms) {
    var d = $.Deferred();
    window.setTimeout(function () { d.resolve(nilai); }, ms || 0);
    return d.promise();
  }

  /** Escape HTML supaya data dari database tidak bisa menyuntik tag. */
  function esc(teks) {
    if (teks === null || teks === undefined) { return ''; }
    return String(teks)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Format angka menjadi Rupiah tanpa desimal. */
  function rupiah(angka) {
    var n = Math.round(Number(angka) || 0);
    return 'Rp' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /** Format tanggal MySQL "2025-10-20 09:15:00" -> "20 Okt 2025, 09.15". */
  function tanggal(teks) {
    if (!teks) { return '-'; }
    var bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    var m = String(teks).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (!m) { return String(teks); }
    return parseInt(m[3], 10) + ' ' + bulan[parseInt(m[2], 10) - 1] + ' ' + m[1] +
           ', ' + m[4] + '.' + m[5];
  }

  /* ------------------------------------------------------------------
   * 2. PENYIMPANAN DEMO (mode json)
   * ------------------------------------------------------------------ */

  var db = null;   // cache seluruh isi data/*.json + overlay localStorage

  function kunciOverlay() { return CONFIG.storageKey; }

  function bacaOverlay() {
    try {
      var raw = window.localStorage.getItem(kunciOverlay());
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function simpanOverlay() {
    try {
      window.localStorage.setItem(kunciOverlay(), JSON.stringify({
        menu: db.menu,
        pesanan: db.pesanan,
        detail_pesanan: db.detail_pesanan,
        users: db.users
      }));
      return true;
    } catch (e) {
      return false;
    }
  }

  function hapusOverlay() {
    try { window.localStorage.removeItem(kunciOverlay()); } catch (e) { /* abaikan */ }
  }

  /** Muat semua file JSON dasar lalu tempel overlay (kalau ada). */
  function muatDemoDb() {
    if (db) { return tunda(db); }

    if (CONFIG.fileMode) {
      var d0 = $.Deferred();
      d0.reject('Halaman dibuka dengan klik ganda (file://). Jalankan lewat Live Server atau Apache.');
      return d0.promise();
    }

    var berkas = ['users', 'kategori', 'penjual', 'menu', 'pesanan', 'detail_pesanan'];
    var permintaan = {};

    $.each(berkas, function (i, nama) {
      permintaan[nama] = $.getJSON(CONFIG.jsonBase + nama + '.json');
    });

    var d = $.Deferred();

    $.when.apply($, $.map(permintaan, function (p) { return p; }))
      .done(function () {
        var hasil = {};
        var args = arguments.length === 1 ? [arguments[0]] : Array.prototype.slice.call(arguments);

        $.each(berkas, function (i, nama) {
          hasil[nama] = (args[i] && args[i][0]) ? args[i][0] : [];
        });

        // Tempel perubahan yang tersimpan di browser
        var ov = bacaOverlay();
        if (ov) {
          $.each(['menu', 'pesanan', 'detail_pesanan', 'users'], function (i, k) {
            if ($.isArray(ov[k])) { hasil[k] = ov[k]; }
          });
        }

        db = hasil;
        d.resolve(db);
      })
      .fail(function () {
        d.reject('Gagal memuat file data/*.json. Pastikan folder data/ ada di samping index.html '
               + 'dan halaman dibuka lewat Live Server, bukan dengan klik ganda index.html.');
      });

    return d.promise();
  }

  /* ------------------------------------------------------------------
   * 3. DETEKSI MODE
   * ------------------------------------------------------------------ */

  /**
   * Coba satu permintaan ringan ke api/menu.php.
   * Kalau menjawab JSON yang benar -> mode php.
   * Kalau tidak (Live Server tidak menjalankan PHP) -> mode json.
   */
  function deteksiMode() {
    if (CONFIG.terdeteksi) { return tunda(CONFIG.mode); }

    // Dibuka dengan klik ganda (file://): browser memblokir AJAX ke berkas
    // lokal, jadi mode demo pun tidak bisa jalan. Beri tahu pengguna.
    if (window.location.protocol === 'file:') {
      CONFIG.mode = 'file';
      CONFIG.terdeteksi = true;
      CONFIG.fileMode = true;
      return tunda('file');
    }

    var d = $.Deferred();

    $.ajax({
      url: CONFIG.phpBase + 'menu.php',
      dataType: 'json',
      timeout: 3500,
      cache: false
    }).done(function (res) {
      if (res && res.ok === true && $.isArray(res.data)) {
        CONFIG.mode = 'php';
        CONFIG.terdeteksi = true;
        d.resolve('php');
      } else {
        CONFIG.mode = 'json';
        CONFIG.terdeteksi = true;
        d.resolve('json');
      }
    }).fail(function () {
      CONFIG.mode = 'json';
      CONFIG.terdeteksi = true;
      d.resolve('json');
    });

    return d.promise();
  }

  /* ------------------------------------------------------------------
   * 4. PEMBACAAN DATA (READ)
   * ------------------------------------------------------------------ */

  function ambilMenu() {
    if (CONFIG.mode === 'php') {
      return $.ajax({ url: CONFIG.phpBase + 'menu.php', dataType: 'json', cache: false })
        .then(function (res) { return res.data || []; });
    }
    return muatDemoDb().then(function () { return db.menu.slice(); });
  }

  function ambilKategori() {
    if (CONFIG.mode === 'php') {
      return $.ajax({ url: CONFIG.phpBase + 'kategori.php', dataType: 'json', cache: false })
        .then(function (res) { return res.data || []; });
    }
    return muatDemoDb().then(function () {
      return $.map(db.kategori, function (k) {
        var n = 0;
        $.each(db.menu, function (i, m) {
          if (Number(m.id_kategori) === Number(k.id_kategori) && Number(m.aktif) === 1) { n++; }
        });
        return { id_kategori: k.id_kategori, nama_kategori: k.nama_kategori, jumlah_menu: n };
      });
    });
  }

  function ambilPenjual() {
    if (CONFIG.mode === 'php') {
      return $.ajax({ url: CONFIG.phpBase + 'penjual.php', dataType: 'json', cache: false })
        .then(function (res) { return res.data || []; });
    }
    return muatDemoDb().then(function () {
      return $.map(db.penjual, function (p) {
        var n = 0;
        $.each(db.menu, function (i, m) {
          if (Number(m.id_penjual) === Number(p.id_penjual) && Number(m.aktif) === 1) { n++; }
        });
        return $.extend({}, p, { jumlah_menu: n });
      });
    });
  }

  function ambilUsers() {
    if (CONFIG.mode === 'php') {
      return $.ajax({ url: CONFIG.phpBase + 'users.php', dataType: 'json', cache: false })
        .then(function (res) { return res.data || []; });
    }
    return muatDemoDb().then(function () {
      return $.map(db.users, function (u) {
        return { id_user: u.id_user, nama: u.nama, username: u.username, role: u.role };
      });
    });
  }

  /** Daftar pesanan + rincian item (disusun di sisi klien untuk mode json). */
  function ambilPesanan() {
    if (CONFIG.mode === 'php') {
      return $.ajax({ url: CONFIG.phpBase + 'pesanan.php', dataType: 'json', cache: false })
        .then(function (res) { return res.data || []; });
    }
    return muatDemoDb().then(function () {
      var hasil = $.map(db.pesanan, function (p) {
        var item = $.grep(db.detail_pesanan, function (d) {
          return Number(d.id_pesanan) === Number(p.id_pesanan);
        });
        var jumlah = 0;
        $.each(item, function (i, d) { jumlah += Number(d.jumlah); });

        var user = null;
        $.each(db.users, function (i, u) {
          if (Number(u.id_user) === Number(p.id_user)) { user = u; return false; }
        });

        return $.extend({}, p, {
          nama: user ? user.nama : 'Tidak diketahui',
          username: user ? user.username : '-',
          jumlah_item: jumlah,
          items: item
        });
      });

      hasil.sort(function (a, b) {
        return String(b.tanggal).localeCompare(String(a.tanggal));
      });
      return hasil;
    });
  }

  /** Statistik ringkas untuk kartu dashboard. */
  function ambilStatistik() {
    if (CONFIG.mode === 'php') {
      return $.ajax({ url: CONFIG.phpBase + 'statistik.php', dataType: 'json', cache: false })
        .then(function (res) { return res.data; });
    }

    return $.when(ambilPesanan(), ambilMenu(), ambilPenjual()).then(function (pesanan, menu, penjual) {
      var pendapatan = 0;
      var perStatus = {};
      var hitungMenu = {};

      $.each(pesanan, function (i, p) {
        perStatus[p.status] = (perStatus[p.status] || 0) + 1;
        if (p.status !== 'Dibatalkan') {
          pendapatan += Number(p.total);
          $.each(p.items || [], function (j, d) {
            hitungMenu[d.id_menu] = hitungMenu[d.id_menu] || { terjual: 0, omzet: 0 };
            hitungMenu[d.id_menu].terjual += Number(d.jumlah);
            hitungMenu[d.id_menu].omzet += Number(d.subtotal);
          });
        }
      });

      var terlaris = [];
      $.each(hitungMenu, function (id, v) {
        var m = null;
        $.each(menu, function (i, x) {
          if (Number(x.id_menu) === Number(id)) { m = x; return false; }
        });
        if (m) {
          terlaris.push({
            id_menu: Number(id),
            nama_menu: m.nama_menu,
            foto: m.foto,
            terjual: v.terjual,
            omzet: v.omzet
          });
        }
      });
      terlaris.sort(function (a, b) { return b.terjual - a.terjual; });

      var aktifMenu = 0;
      $.each(menu, function (i, m) { if (Number(m.aktif) === 1) { aktifMenu++; } });

      return {
        total_menu: aktifMenu,
        total_penjual: penjual.length,
        total_pesanan: pesanan.length,
        pendapatan: pendapatan,
        pendapatan_hari_ini: 0,
        per_status: perStatus,
        terlaris: terlaris.slice(0, 5)
      };
    });
  }

  /* ------------------------------------------------------------------
   * 5. PENULISAN DATA (CREATE / UPDATE / DELETE)
   * ------------------------------------------------------------------ */

  /** Simpan menu: tanpa id_menu -> tambah, dengan id_menu -> ubah. */
  function simpanMenu(data) {
    if (CONFIG.mode === 'php') {
      var ubah = Number(data.id_menu) > 0;
      var payload = $.extend({}, data);
      if (ubah) { payload._method = 'PUT'; }

      return $.ajax({
        url: CONFIG.phpBase + 'menu.php',
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) { return $.Deferred().reject(res).promise(); }
        return res.data;
      }, function (xhr) {
        var res = xhr.responseJSON || { error: 'Gagal menyimpan menu.' };
        return $.Deferred().reject(res).promise();
      });
    }

    // ---- mode json ----
    return muatDemoDb().then(function () {
      var d = $.Deferred();
      var ubah = Number(data.id_menu) > 0;

      if (ubah) {
        var ketemu = false;
        $.each(db.menu, function (i, m) {
          if (Number(m.id_menu) === Number(data.id_menu)) {
            db.menu[i] = $.extend({}, m, data, {
              id_menu: Number(m.id_menu),
              harga: Number(data.harga),
              stok: Number(data.stok),
              id_kategori: Number(data.id_kategori),
              populer: Number(data.populer) ? 1 : 0,
              aktif: data.aktif === 0 || data.aktif === '0' ? 0 : 1
            });
            ketemu = true;
            return false;
          }
        });
        if (!ketemu) {
          return d.reject({ error: 'Menu tidak ditemukan.' }).promise();
        }
      } else {
        var baru = $.extend({}, data, {
          id_menu: db.menu.length ? Math.max.apply(null, $.map(db.menu, function (m) {
            return Number(m.id_menu);
          })) + 1 : 1,
          harga: Number(data.harga),
          stok: Number(data.stok),
          id_kategori: Number(data.id_kategori),
          populer: Number(data.populer) ? 1 : 0,
          aktif: 1
        });
        db.menu.push(baru);
      }

      simpanOverlay();
      return tunda(data.id_menu ? { id_menu: data.id_menu } : { id_menu: db.menu[db.menu.length - 1].id_menu });
    });
  }

  /** Hapus menu berdasarkan id. */
  function hapusMenu(id) {
    if (CONFIG.mode === 'php') {
      return $.ajax({
        url: CONFIG.phpBase + 'menu.php',
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({ _method: 'DELETE', id_menu: id })
      }).then(function (res) {
        if (!res.ok) { return $.Deferred().reject(res).promise(); }
        return res.data;
      }, function (xhr) {
        return $.Deferred().reject(xhr.responseJSON || { error: 'Gagal menghapus menu.' }).promise();
      });
    }

    return muatDemoDb().then(function () {
      var dipakai = $.grep(db.detail_pesanan, function (d) {
        return Number(d.id_menu) === Number(id);
      });
      if (dipakai.length > 0) {
        return $.Deferred().reject({
          error: 'Menu ini sudah dipakai pada transaksi, jadi tidak bisa dihapus.'
        }).promise();
      }
      db.menu = $.grep(db.menu, function (m) { return Number(m.id_menu) !== Number(id); });
      simpanOverlay();
      return tunda({ id_menu: Number(id) });
    });
  }

  /**
   * Buat pesanan baru (form 2.c).
   * payload = { id_user, catatan, items:[{id_menu, jumlah}] }
   */
  function buatPesanan(payload) {
    if (CONFIG.mode === 'php') {
      return $.ajax({
        url: CONFIG.phpBase + 'pesanan.php',
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) { return $.Deferred().reject(res).promise(); }
        return res.data;
      }, function (xhr) {
        return $.Deferred().reject(xhr.responseJSON || { error: 'Gagal menyimpan pesanan.' }).promise();
      });
    }

    // ---- mode json: tiru logika transaksi PHP ----
    return muatDemoDb().then(function () {
      var d = $.Deferred();

      if (!payload.id_user) {
        return d.reject({ error: 'Data belum valid.', fields: { id_user: 'Nama pemesan wajib dipilih.' } }).promise();
      }
      if (!payload.items || !payload.items.length) {
        return d.reject({ error: 'Data belum valid.', fields: { items: 'Pilih minimal satu menu.' } }).promise();
      }

      var total = 0;
      var rincian = [];

      for (var i = 0; i < payload.items.length; i++) {
        var it = payload.items[i];
        var menu = null;
        for (var j = 0; j < db.menu.length; j++) {
          if (Number(db.menu[j].id_menu) === Number(it.id_menu)) { menu = db.menu[j]; break; }
        }
        if (!menu) {
          return d.reject({ error: 'Menu dengan ID ' + it.id_menu + ' tidak ditemukan.' }).promise();
        }
        if (Number(menu.aktif) !== 1) {
          return d.reject({ error: 'Menu "' + menu.nama_menu + '" sedang tidak tersedia.' }).promise();
        }
        if (Number(it.jumlah) > Number(menu.stok)) {
          return d.reject({
            error: 'Stok "' + menu.nama_menu + '" tinggal ' + menu.stok + ', tidak cukup untuk ' + it.jumlah + '.'
          }).promise();
        }
        var sub = Number(menu.harga) * Number(it.jumlah);
        total += sub;
        rincian.push({
          id_menu: Number(menu.id_menu),
          nama_menu: menu.nama_menu,
          jumlah: Number(it.jumlah),
          harga_satuan: Number(menu.harga),
          subtotal: sub
        });
      }

      var idBaru = db.pesanan.length ? Math.max.apply(null, $.map(db.pesanan, function (p) {
        return Number(p.id_pesanan);
      })) + 1 : 1;

      var sekarang = new Date();
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      var waktu = sekarang.getFullYear() + '-' + pad(sekarang.getMonth() + 1) + '-' + pad(sekarang.getDate()) +
                  ' ' + pad(sekarang.getHours()) + ':' + pad(sekarang.getMinutes()) + ':00';

      db.pesanan.push({
        id_pesanan: idBaru,
        id_user: Number(payload.id_user),
        tanggal: waktu,
        total: total,
        status: 'Menunggu',
        catatan: payload.catatan || ''
      });

      var idDetail = db.detail_pesanan.length ? Math.max.apply(null, $.map(db.detail_pesanan, function (x) {
        return Number(x.id_detail);
      })) + 1 : 1;

      $.each(rincian, function (k, r) {
        db.detail_pesanan.push({
          id_detail: idDetail++,
          id_pesanan: idBaru,
          id_menu: r.id_menu,
          jumlah: r.jumlah,
          harga_satuan: r.harga_satuan,
          subtotal: r.subtotal
        });

        $.each(db.menu, function (m, mm) {
          if (Number(mm.id_menu) === Number(r.id_menu)) {
            db.menu[m].stok = Number(mm.stok) - r.jumlah;
            return false;
          }
        });
      });

      simpanOverlay();
      return tunda({ id_pesanan: idBaru, total: total, status: 'Menunggu', items: rincian });
    });
  }

  /** Ubah status pesanan. */
  function ubahStatusPesanan(id, status) {
    if (CONFIG.mode === 'php') {
      return $.ajax({
        url: CONFIG.phpBase + 'pesanan.php',
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({ _method: 'PUT', id_pesanan: id, status: status })
      }).then(function (res) {
        if (!res.ok) { return $.Deferred().reject(res).promise(); }
        return res.data;
      }, function (xhr) {
        return $.Deferred().reject(xhr.responseJSON || { error: 'Gagal mengubah status.' }).promise();
      });
    }

    return muatDemoDb().then(function () {
      var ketemu = false;
      $.each(db.pesanan, function (i, p) {
        if (Number(p.id_pesanan) === Number(id)) {
          db.pesanan[i].status = status;
          ketemu = true;
          return false;
        }
      });
      if (!ketemu) {
        return $.Deferred().reject({ error: 'Pesanan tidak ditemukan.' }).promise();
      }
      simpanOverlay();
      return tunda({ id_pesanan: Number(id), status: status });
    });
  }

  /** Hapus pesanan + kembalikan stok. */
  function hapusPesanan(id) {
    if (CONFIG.mode === 'php') {
      return $.ajax({
        url: CONFIG.phpBase + 'pesanan.php',
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({ _method: 'DELETE', id_pesanan: id })
      }).then(function (res) {
        if (!res.ok) { return $.Deferred().reject(res).promise(); }
        return res.data;
      }, function (xhr) {
        return $.Deferred().reject(xhr.responseJSON || { error: 'Gagal menghapus pesanan.' }).promise();
      });
    }

    return muatDemoDb().then(function () {
      var rincian = $.grep(db.detail_pesanan, function (d) {
        return Number(d.id_pesanan) === Number(id);
      });

      $.each(rincian, function (i, r) {
        $.each(db.menu, function (m, mm) {
          if (Number(mm.id_menu) === Number(r.id_menu)) {
            db.menu[m].stok = Number(mm.stok) + Number(r.jumlah);
            return false;
          }
        });
      });

      db.pesanan = $.grep(db.pesanan, function (p) { return Number(p.id_pesanan) !== Number(id); });
      db.detail_pesanan = $.grep(db.detail_pesanan, function (d) {
        return Number(d.id_pesanan) !== Number(id);
      });

      simpanOverlay();
      return tunda({ id_pesanan: Number(id) });
    });
  }

  /** Kembalikan seluruh data demo ke kondisi awal. */
  function resetDemo() {
    hapusOverlay();
    db = null;
    return muatDemoDb();
  }

  /* ------------------------------------------------------------------
   * 6. LOGIN (hanya tersedia di mode php)
   * ------------------------------------------------------------------ */

  function login(username, password) {
    return $.ajax({
      url: 'auth/login.php',
      method: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({ username: username, password: password })
    }).then(function (res) {
      if (!res.ok) { return $.Deferred().reject(res).promise(); }
      return res.data;
    }, function (xhr) {
      return $.Deferred().reject(xhr.responseJSON || { error: 'Gagal login.' }).promise();
    });
  }

  function logout() {
    return $.ajax({ url: 'auth/logout.php', dataType: 'json', cache: false });
  }

  function cekLogin() {
    return $.ajax({
      url: 'auth/login.php',
      data: { cek: 1 },
      dataType: 'json',
      cache: false
    }).then(function (res) { return res.data || { login: false }; });
  }

  /* ------------------------------------------------------------------
   * 7. ANTARMUKA PUBLIK
   * ------------------------------------------------------------------ */

  return {
    config: CONFIG,
    init: deteksiMode,
    mode: function () { return CONFIG.mode; },
    setMode: function (m) { CONFIG.mode = m; CONFIG.terdeteksi = true; },

    menu: ambilMenu,
    kategori: ambilKategori,
    penjual: ambilPenjual,
    users: ambilUsers,
    pesanan: ambilPesanan,
    statistik: ambilStatistik,

    simpanMenu: simpanMenu,
    hapusMenu: hapusMenu,
    buatPesanan: buatPesanan,
    ubahStatusPesanan: ubahStatusPesanan,
    hapusPesanan: hapusPesanan,
    resetDemo: resetDemo,

    login: login,
    logout: logout,
    cekLogin: cekLogin,

    util: { esc: esc, rupiah: rupiah, tanggal: tanggal }
  };

})(jQuery);
