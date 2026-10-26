/* =====================================================================
 * js/admin.js — Logika antarmuka panel admin Kantin Kampus
 * ---------------------------------------------------------------------
 * Tugas UTS Pemrograman Web — PWUTS_A07_25091397099
 * Rizky Mardianto / 25091397099 / Kelompok A07
 *
 * Isi berkas ini:
 *   1. Routing AJAX      — hyperlink sidebar memuat halaman tanpa reload
 *   2. Notifikasi        — toast pojok kanan atas
 *   3. Validasi form     — aturan jQuery sebelum data dikirim ke server
 *   4. Render Dashboard  — kartu statistik + panel interaktif  (butir 2.b)
 *   5. Render Kelola Menu
 *   6. Render Pesanan
 *   7. Render Transaksi  — form sesuai struktur database       (butir 2.c)
 * ===================================================================== */

(function ($) {
  'use strict';

  var esc     = Api.util.esc;
  var rupiah  = Api.util.rupiah;
  var tanggal = Api.util.tanggal;

  /* ==================================================================
   * 0. KONFIGURASI HALAMAN
   * ================================================================== */

  var PAGES = {
    dashboard: {
      file: 'pages/dashboard.html',
      title: 'Dashboard',
      eyebrow: 'RINGKASAN KANTIN',
      muat: muatDashboard
    },
    menu: {
      file: 'pages/kelola-menu.html',
      title: 'Kelola Menu',
      eyebrow: 'DATA MASTER',
      muat: muatKelolaMenu
    },
    pesanan: {
      file: 'pages/pesanan.html',
      title: 'Pesanan & Transaksi',
      eyebrow: 'TRANSAKSI',
      muat: muatPesanan
    },
    transaksi: {
      file: 'pages/transaksi.html',
      title: 'Transaksi Baru',
      eyebrow: 'FORM TRANSAKSI',
      muat: muatTransaksi
    }
  };

  /** Data yang dipakai bersama antar halaman. */
  var state = {
    menu: [],
    pesanan: [],
    users: [],
    kategori: [],
    penjual: [],
    cart: [],            // keranjang pada form transaksi
    filterStatusDash: '', // filter status pada dashboard
    halamanAwal: true
  };

  /* ==================================================================
   * 1. UTILITAS UMUM
   * ================================================================== */

  function loadingHtml() {
    return '<div class="loading-state"><span class="spinner"></span><p>Memuat halaman&hellip;</p></div>';
  }

  function badgeStatus(status) {
    var map = {
      'Menunggu':     'wait',
      'Diproses':     'process',
      'Siap diambil': 'ready',
      'Selesai':      'done',
      'Dibatalkan':   'cancel'
    };
    return '<span class="badge ' + (map[status] || 'wait') + '">' + esc(status) + '</span>';
  }

  /** Toast notifikasi. tipe: 'ok' | 'err' | 'info' */
  function toast(pesan, tipe) {
    var $stack = $('#toast-stack');
    var $t = $('<div class="toast ' + (tipe || 'ok') + '"></div>').text(pesan);
    $stack.append($t);

    // Maksimal 3 notifikasi sekaligus agar tidak menutupi isi halaman
    $stack.children('.toast').slice(0, -3).remove();

    window.setTimeout(function () {
      $t.addClass('out');
      window.setTimeout(function () { $t.remove(); }, 300);
    }, 3200);
  }

  /** Gambar menu dengan fallback bila file tidak ditemukan. */
  function thumbMenu(foto, nama) {
    if (foto) {
      return '<img class="menu-thumbnail" src="' + esc(encodeURI(foto)) + '" alt="' +
             esc(nama) + '" loading="lazy" onerror="this.style.display=\'none\'">';
    }
    return '<span class="menu-thumbnail placeholder">' + esc((nama || '?').charAt(0)) + '</span>';
  }

  /* ==================================================================
   * 2. ROUTING AJAX
   * ================================================================== */

  function pageDariHash() {
    var m = String(window.location.hash || '').match(/^#\/([a-z-]+)/);
    return m ? m[1] : 'dashboard';
  }

  function setHeader(cfg) {
    $('#page-title').text(cfg.title);
    $('#page-eyebrow').text(cfg.eyebrow);
    document.title = cfg.title + ' | Kantin Kampus';
  }

  function setActiveNav(page) {
    $('.nav-link').removeClass('active').removeAttr('aria-current');
    $('.nav-link[data-page="' + page + '"]').addClass('active').attr('aria-current', 'page');
  }

  /**
   * Muat halaman ke dalam layout utama memakai AJAX.
   * Inilah penerapan "hyperlink dengan teknik AJAX" pada butir 2.a:
   * tautan tetap berupa <a href="pages/....html">, tetapi klik-nya
   * dicegat jQuery sehingga isi layout diganti tanpa reload halaman.
   */
  function navigate(page, push) {
    var cfg = PAGES[page];
    if (!cfg) {
      page = 'dashboard';
      cfg = PAGES.dashboard;
    }

    if (push) {
      var hash = '#/' + page;
      if (window.location.hash !== hash) {
        if (state.halamanAwal) {
          window.history.replaceState({ page: page }, '', hash);
        } else {
          window.history.pushState({ page: page }, '', hash);
        }
      }
    }
    state.halamanAwal = false;

    setHeader(cfg);
    setActiveNav(page);
    tutupSidebar();

    var $c = $('#page-content');
    $c.attr('aria-busy', 'true').html(loadingHtml());

    // $.ajax dengan dataType 'html' — inti teknik AJAX pada tugas ini
    $.ajax({
      url: cfg.file,
      dataType: 'html',
      cache: false
    }).done(function (html) {
      $c.html(html).attr('aria-busy', 'false');
      if (typeof cfg.muat === 'function') {
        cfg.muat();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }).fail(function (xhr) {
      $c.attr('aria-busy', 'false').html(
        '<div class="notice danger">' +
        '<strong>Halaman gagal dimuat.</strong> ' +
        'Pastikan berkas <code>' + esc(cfg.file) + '</code> ada di folder proyek. ' +
        '(status ' + xhr.status + ')' +
        '</div>'
      );
    });
  }

  /* ==================================================================
   * 3. SIDEBAR MODE PONSEL
   * ================================================================== */

  function bukaSidebar() {
    $('#sidebar').addClass('terbuka');
    $('#sidebar-overlay').addClass('tampil');
    $('#menu-toggle').attr('aria-expanded', 'true');
  }

  function tutupSidebar() {
    $('#sidebar').removeClass('terbuka');
    $('#sidebar-overlay').removeClass('tampil');
    $('#menu-toggle').attr('aria-expanded', 'false');
  }

  /* ==================================================================
   * 4. VALIDASI FORM (jQuery)
   * ------------------------------------------------------------------
   * Aturan dideklarasikan sebagai objek, lalu diperiksa satu per satu.
   * Semua validasi berjalan SEBELUM data dikirim ke server HTTP.
   * ================================================================== */

  /**
   * @param {jQuery} $form  form yang diperiksa
   * @param {object} aturan { namaField: { label, wajib, min, maks, angka, minAngka, maksAngka, pola, pesanPola } }
   * @returns {object} kumpulan pesan kesalahan; kosong berarti valid
   */
  function validasi($form, aturan) {
    var err = {};

    $.each(aturan, function (nama, r) {
      var $el  = $form.find('[name="' + nama + '"]');
      var val  = $.trim(String($el.val() === null || $el.val() === undefined ? '' : $el.val()));
      var label = r.label || nama;

      if (r.wajib && val === '') {
        err[nama] = label + ' wajib diisi.';
        return;
      }
      if (val === '') { return; }   // field opsional yang kosong dilewati

      if (r.min && val.length < r.min) {
        err[nama] = label + ' minimal ' + r.min + ' karakter.';
        return;
      }
      if (r.maks && val.length > r.maks) {
        err[nama] = label + ' maksimal ' + r.maks + ' karakter (sekarang ' + val.length + ').';
        return;
      }
      if (r.angka && !/^-?\d+$/.test(val)) {
        err[nama] = label + ' harus berupa angka bulat.';
        return;
      }
      if (r.minAngka !== undefined && Number(val) < r.minAngka) {
        err[nama] = label + ' minimal ' + r.minAngka + '.';
        return;
      }
      if (r.maksAngka !== undefined && Number(val) > r.maksAngka) {
        err[nama] = label + ' maksimal ' + r.maksAngka + '.';
        return;
      }
      if (r.pola && !r.pola.test(val)) {
        err[nama] = r.pesanPola || (label + ' formatnya tidak sesuai.');
        return;
      }
    });

    return err;
  }

  /** Bersihkan semua tanda kesalahan pada form. */
  function bersihkanPesan($form) {
    $form.find('.msg').text('');
    $form.find('.invalid').removeClass('invalid');
  }

  /** Tampilkan pesan kesalahan di bawah field terkait. */
  function tampilkanPesan($form, err) {
    var pertama = null;

    $.each(err, function (nama, pesan) {
      var $msg = $form.find('[data-msg-for="' + nama + '"]');
      if ($msg.length) {
        $msg.text(pesan);
      } else {
        toast(pesan, 'err');
      }

      var $el = $form.find('[name="' + nama + '"]');
      if ($el.length) {
        $el.addClass('invalid');
        if (!pertama) { pertama = $el; }
      }
    });

    if (pertama) {
      pertama.trigger('focus');
      $('html, body').animate({
        scrollTop: Math.max(0, pertama.offset().top - 140)
      }, 260);
    }
  }

  /* ==================================================================
   * 5. HALAMAN: DASHBOARD  (butir 2.b — halaman interaktif)
   * ================================================================== */

  function animasiAngka($el, target, uang) {
    var akhir = Number(target) || 0;
    var obj = { v: 0 };

    $el.text(uang ? rupiah(0) : '0');

    $(obj).animate({ v: akhir }, {
      duration: 650,
      step: function (now) {
        $el.text(uang ? rupiah(now) : String(Math.round(now)));
      },
      complete: function () {
        $el.text(uang ? rupiah(akhir) : String(akhir));
      }
    });

    // Jaring pengaman: pastikan angka akhir selalu tampil
    window.setTimeout(function () {
      $el.text(uang ? rupiah(akhir) : String(akhir));
    }, 1100);
  }

  function muatDashboard() {
    var $c = $('#page-content');
    if (!$c.length) { return; }

    $('#dash-orders').html('<tr><td colspan="4" class="empty-note">Memuat data&hellip;</td></tr>');

    $.when(Api.statistik(), Api.pesanan()).done(function (stat, pesanan) {
      state.pesanan = pesanan || [];

      // --- kartu statistik ---
      $('[data-stat="total_menu"]').each(function () {
        animasiAngka($(this), stat.total_menu, false);
      });
      $('[data-stat="total_pesanan"]').each(function () {
        animasiAngka($(this), stat.total_pesanan, false);
      });
      $('[data-stat="pendapatan"]').each(function () {
        animasiAngka($(this), stat.pendapatan, true);
      });
      $('[data-stat="total_penjual"]').each(function () {
        animasiAngka($(this), stat.total_penjual, false);
      });

      gambarTabelDashboard(state.pesanan);
      gambarMenuTerlaris(stat.terlaris || []);
      gambarChipStatus(stat.per_status || {}, state.pesanan.length);

    }).fail(function (xhr) {
      var pesan = (xhr && xhr.error) ? xhr.error : 'Gagal memuat statistik.';
      $('#dash-orders').html('<tr><td colspan="4" class="empty-note">' + esc(pesan) + '</td></tr>');
      toast(pesan, 'err');
    });
  }

  function gambarTabelDashboard(daftar) {
    var filter = state.filterStatusDash;
    var tampil = filter
      ? $.grep(daftar, function (p) { return p.status === filter; })
      : daftar;

    tampil = tampil.slice(0, 6);

    if (!tampil.length) {
      $('#dash-orders').html(
        '<tr><td colspan="4" class="empty-note">' +
        (filter ? 'Tidak ada pesanan berstatus "' + esc(filter) + '".' : 'Belum ada pesanan.') +
        '</td></tr>'
      );
      return;
    }

    var html = '';
    $.each(tampil, function (i, p) {
      html += '<tr class="klik-baris" data-id="' + p.id_pesanan + '" tabindex="0">' +
                '<td class="mono">#' + p.id_pesanan + '</td>' +
                '<td>' + esc(p.nama) + '</td>' +
                '<td class="num">' + rupiah(p.total) + '</td>' +
                '<td>' + badgeStatus(p.status) + '</td>' +
              '</tr>';
    });

    $('#dash-orders').html(html);
  }

  function gambarMenuTerlaris(daftar) {
    if (!daftar.length) {
      $('#dash-populer').html('<p class="empty-note">Belum ada penjualan.</p>');
      return;
    }

    var max = 1;
    $.each(daftar, function (i, d) { max = Math.max(max, Number(d.terjual)); });

    var html = '';
    $.each(daftar, function (i, d) {
      var persen = Math.round((Number(d.terjual) / max) * 100);
      html += '<div class="quick-item">' +
                '<span class="quick-symbol">' + (i + 1) + '</span>' +
                '<div class="quick-body">' +
                  '<div class="quick-line">' +
                    '<strong>' + esc(d.nama_menu) + '</strong>' +
                    '<span>' + d.terjual + ' terjual</span>' +
                  '</div>' +
                  '<div class="bar"><i style="width:' + persen + '%"></i></div>' +
                  '<small class="subtext">Omzet ' + rupiah(d.omzet) + '</small>' +
                '</div>' +
              '</div>';
    });

    $('#dash-populer').html(html);
  }

  function gambarChipStatus(perStatus, total) {
    var urutan = ['Menunggu', 'Diproses', 'Siap diambil', 'Selesai', 'Dibatalkan'];
    var html = '';

    $.each(urutan, function (i, s) {
      var n = perStatus[s] || 0;
      var aktif = state.filterStatusDash === s ? ' aktif' : '';
      html += '<button type="button" class="chip' + aktif + '" data-status="' + esc(s) + '">' +
                badgeStatus(s) + '<strong>' + n + '</strong>' +
              '</button>';
    });

    html += '<button type="button" class="chip' +
            (state.filterStatusDash === '' ? ' aktif' : '') +
            '" data-status="">Semua<strong>' + total + '</strong></button>';

    $('#dash-status').html(html);
  }

  /* ==================================================================
   * 6. HALAMAN: KELOLA MENU
   * ================================================================== */

  function muatKelolaMenu() {
    $('#menu-rows').html('<tr><td colspan="6" class="empty-note">Memuat data&hellip;</td></tr>');

    $.when(Api.menu(), Api.kategori(), Api.penjual())
      .done(function (menu, kategori, penjual) {
        state.menu     = menu || [];
        state.kategori = kategori || [];
        state.penjual  = penjual || [];

        isiSelectKategori();
        isiSelectPenjual();
        gambarTabelMenu();
      })
      .fail(function (xhr) {
        var pesan = (xhr && xhr.error) ? xhr.error : 'Gagal memuat data menu.';
        $('#menu-rows').html('<tr><td colspan="6" class="empty-note">' + esc(pesan) + '</td></tr>');
        toast(pesan, 'err');
      });
  }

  function isiSelectKategori() {
    var $f = $('#filter-kategori');
    var $m = $('#f-kategori');

    var opsiFilter = '<option value="">Semua kategori</option>';
    var opsiForm   = '<option value="">Pilih kategori</option>';

    $.each(state.kategori, function (i, k) {
      opsiFilter += '<option value="' + k.id_kategori + '">' + esc(k.nama_kategori) + '</option>';
      opsiForm   += '<option value="' + k.id_kategori + '">' + esc(k.nama_kategori) + '</option>';
    });

    $f.html(opsiFilter);
    $m.html(opsiForm);
  }

  function isiSelectPenjual() {
    var opsi = '<option value="">Tanpa stan</option>';
    $.each(state.penjual, function (i, p) {
      opsi += '<option value="' + p.id_penjual + '">' +
              esc(p.nama_penjual) + (p.lokasi ? ' — ' + esc(p.lokasi) : '') +
              '</option>';
    });
    $('#f-penjual').html(opsi);
  }

  function menuTersaring() {
    var kata = $.trim(String($('#menu-search').val() || '')).toLowerCase();
    var kat  = $('#filter-kategori').val();

    return $.grep(state.menu, function (m) {
      if (kat && String(m.id_kategori) !== String(kat)) { return false; }
      if (kata) {
        var teks = (m.nama_menu + ' ' + (m.nama_kategori || '') + ' ' + (m.nama_penjual || '')).toLowerCase();
        if (teks.indexOf(kata) === -1) { return false; }
      }
      return true;
    });
  }

  function gambarTabelMenu() {
    var daftar = menuTersaring();
    $('#menu-count').text(daftar.length + ' menu');

    if (!daftar.length) {
      $('#menu-rows').html(
        '<tr><td colspan="6" class="empty-note">Tidak ada menu yang cocok dengan pencarian.</td></tr>'
      );
      return;
    }

    var html = '';
    $.each(daftar, function (i, m) {
      var stok = Number(m.stok);
      var kelasStok = stok === 0 ? 'badge cancel' : (stok <= 5 ? 'badge wait' : 'badge done');

      html += '<tr>' +
        '<td>' +
          '<div class="menu-cell">' +
            thumbMenu(m.foto, m.nama_menu) +
            '<div class="menu-info">' +
              '<p class="menu-name">' + esc(m.nama_menu) +
                (Number(m.populer) ? ' <span class="tag-populer">populer</span>' : '') +
              '</p>' +
              '<p class="subtext">' + esc(m.deskripsi || 'Tanpa deskripsi') + '</p>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td>' + esc(m.nama_kategori || '-') + '</td>' +
        '<td>' + esc(m.nama_penjual || '-') + '</td>' +
        '<td class="num">' + rupiah(m.harga) + '</td>' +
        '<td class="num"><span class="' + kelasStok + '">' + stok + '</span></td>' +
        '<td>' +
          '<div class="action-row">' +
            '<button type="button" class="btn secondary small" data-ubah-menu="' + m.id_menu + '">Ubah</button>' +
            '<button type="button" class="btn danger small" data-hapus-menu="' + m.id_menu + '">Hapus</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    });

    $('#menu-rows').html(html);
  }

  function bukaModalMenu(idMenu) {
    var $form = $('#form-menu');
    if (!$form.length) { return; }

    bersihkanPesan($form);
    $form[0].reset();
    $form.find('[name="id_menu"]').val('');

    if (idMenu) {
      var m = null;
      $.each(state.menu, function (i, x) {
        if (Number(x.id_menu) === Number(idMenu)) { m = x; return false; }
      });
      if (!m) { toast('Menu tidak ditemukan.', 'err'); return; }

      $('#modal-menu-title').text('Ubah Menu');
      $form.find('[name="id_menu"]').val(m.id_menu);
      $form.find('[name="nama_menu"]').val(m.nama_menu);
      $form.find('[name="id_kategori"]').val(String(m.id_kategori));
      $form.find('[name="id_penjual"]').val(m.id_penjual ? String(m.id_penjual) : '');
      $form.find('[name="harga"]').val(Math.round(Number(m.harga)));
      $form.find('[name="stok"]').val(m.stok);
      $form.find('[name="deskripsi"]').val(m.deskripsi || '');
      $form.find('[name="foto"]').val(m.foto || '');
      $form.find('[name="populer"]').prop('checked', Number(m.populer) === 1);
    } else {
      $('#modal-menu-title').text('Tambah Menu');
    }

    $('#modal-menu').prop('hidden', false);
    window.setTimeout(function () { $('#f-nama-menu').trigger('focus'); }, 60);
  }

  function tutupModal(sel) {
    $(sel).prop('hidden', true);
  }

  /** Aturan validasi form menu — dipakai sebelum dikirim ke server. */
  var ATURAN_MENU = {
    nama_menu:   { label: 'Nama menu', wajib: true, min: 3, maks: 100 },
    id_kategori: { label: 'Kategori',  wajib: true },
    harga:       { label: 'Harga',     wajib: true, angka: true, minAngka: 500, maksAngka: 10000000 },
    stok:        { label: 'Stok',      wajib: true, angka: true, minAngka: 0, maksAngka: 100000 },
    deskripsi:   { label: 'Deskripsi', maks: 500 },
    foto:        {
      label: 'Foto',
      maks: 255,
      pola: /^[A-Za-z0-9_\-./ ]*\.(jpg|jpeg|png|webp|gif)$/i,
      pesanPola: 'Nama file foto harus berekstensi .jpg, .jpeg, .png, .webp, atau .gif.'
    }
  };

  function simpanMenuDariForm($form) {
    bersihkanPesan($form);

    // ---- LANGKAH 1: validasi di browser ----
    var err = validasi($form, ATURAN_MENU);
    if (!$.isEmptyObject(err)) {
      tampilkanPesan($form, err);
      toast('Periksa kembali data menu.', 'err');
      return;
    }

    // ---- LANGKAH 2: kirim ke server ----
    var data = {
      id_menu:     Number($form.find('[name="id_menu"]').val()) || 0,
      nama_menu:   $.trim($form.find('[name="nama_menu"]').val()),
      id_kategori: Number($form.find('[name="id_kategori"]').val()),
      id_penjual:  Number($form.find('[name="id_penjual"]').val()) || 0,
      harga:       Number($form.find('[name="harga"]').val()),
      stok:        Number($form.find('[name="stok"]').val()),
      deskripsi:   $.trim($form.find('[name="deskripsi"]').val()),
      foto:        $.trim($form.find('[name="foto"]').val()),
      populer:     $form.find('[name="populer"]').is(':checked') ? 1 : 0
    };

    var $btn = $('#btn-simpan-menu').prop('disabled', true).text('Menyimpan…');

    Api.simpanMenu(data).done(function () {
      tutupModal('#modal-menu');
      toast(data.id_menu ? 'Menu berhasil diperbarui.' : 'Menu berhasil ditambahkan.', 'ok');
      muatKelolaMenu();
    }).fail(function (res) {
      var pesan = (res && res.error) ? res.error : 'Gagal menyimpan menu.';
      if (res && res.fields) {
        tampilkanPesan($form, res.fields);
      }
      toast(pesan, 'err');
    }).always(function () {
      $btn.prop('disabled', false).text('Simpan Menu');
    });
  }

  function hapusMenu(idMenu) {
    var m = null;
    $.each(state.menu, function (i, x) {
      if (Number(x.id_menu) === Number(idMenu)) { m = x; return false; }
    });
    if (!m) { return; }

    if (!window.confirm('Hapus menu "' + m.nama_menu + '"?\nTindakan ini tidak bisa dibatalkan.')) {
      return;
    }

    Api.hapusMenu(idMenu).done(function () {
      toast('Menu "' + m.nama_menu + '" dihapus.', 'ok');
      muatKelolaMenu();
    }).fail(function (res) {
      toast((res && res.error) ? res.error : 'Gagal menghapus menu.', 'err');
    });
  }

  /* ==================================================================
   * 7. HALAMAN: PESANAN
   * ================================================================== */

  function muatPesanan() {
    $('#pesanan-rows').html('<tr><td colspan="7" class="empty-note">Memuat data&hellip;</td></tr>');

    Api.pesanan().done(function (daftar) {
      state.pesanan = daftar || [];
      gambarTabelPesanan();
    }).fail(function (xhr) {
      var pesan = (xhr && xhr.error) ? xhr.error : 'Gagal memuat pesanan.';
      $('#pesanan-rows').html('<tr><td colspan="7" class="empty-note">' + esc(pesan) + '</td></tr>');
      toast(pesan, 'err');
    });
  }

  function pesananTersaring() {
    var kata   = $.trim(String($('#pesanan-search').val() || '')).toLowerCase();
    var status = $('#filter-status').val();

    return $.grep(state.pesanan, function (p) {
      if (status && p.status !== status) { return false; }
      if (kata) {
        var teks = (String(p.id_pesanan) + ' ' + (p.nama || '') + ' ' + (p.username || '')).toLowerCase();
        if (teks.indexOf(kata) === -1) { return false; }
      }
      return true;
    });
  }

  var PILIHAN_STATUS = ['Menunggu', 'Diproses', 'Siap diambil', 'Selesai', 'Dibatalkan'];

  function gambarTabelPesanan() {
    var daftar = pesananTersaring();
    $('#pesanan-count').text(daftar.length + ' pesanan');

    if (!daftar.length) {
      $('#pesanan-rows').html('<tr><td colspan="7" class="empty-note">Tidak ada pesanan yang cocok.</td></tr>');
      return;
    }

    var html = '';
    $.each(daftar, function (i, p) {
      var opsi = '';
      $.each(PILIHAN_STATUS, function (j, s) {
        opsi += '<option value="' + esc(s) + '"' + (p.status === s ? ' selected' : '') + '>' +
                esc(s) + '</option>';
      });

      html += '<tr>' +
        '<td class="mono">#' + p.id_pesanan + '</td>' +
        '<td>' +
          '<p class="menu-name">' + esc(p.nama) + '</p>' +
          '<p class="subtext">@' + esc(p.username || '-') + '</p>' +
        '</td>' +
        '<td class="subtext">' + esc(tanggal(p.tanggal)) + '</td>' +
        '<td class="num">' + (p.jumlah_item || 0) + '</td>' +
        '<td class="num">' + rupiah(p.total) + '</td>' +
        '<td><select class="status-select" data-id="' + p.id_pesanan + '">' + opsi + '</select></td>' +
        '<td>' +
          '<div class="action-row">' +
            '<button type="button" class="btn secondary small" data-detail="' + p.id_pesanan + '">Rincian</button>' +
            '<button type="button" class="btn danger small" data-hapus-pesanan="' + p.id_pesanan + '">Hapus</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    });

    $('#pesanan-rows').html(html);
  }

  function bukaDetailPesanan(id) {
    var p = null;
    $.each(state.pesanan, function (i, x) {
      if (Number(x.id_pesanan) === Number(id)) { p = x; return false; }
    });
    if (!p) { return; }

    var isi = '';
    if (p.items && p.items.length) {
      var baris = '';
      $.each(p.items, function (i, d) {
        baris += '<tr>' +
          '<td>' + esc(d.nama_menu || ('Menu #' + d.id_menu)) + '</td>' +
          '<td class="num">' + d.jumlah + ' &times; ' + rupiah(d.harga_satuan) + '</td>' +
          '<td class="num">' + rupiah(d.subtotal) + '</td>' +
        '</tr>';
      });

      isi += '<div class="table-wrap"><table class="data-table">' +
             '<thead><tr><th>Menu</th><th class="num">Jumlah</th><th class="num">Subtotal</th></tr></thead>' +
             '<tbody>' + baris + '</tbody></table></div>';
    } else {
      isi += '<p class="empty-note">Rincian item tidak tersedia pada daftar ini.</p>';
    }

    isi += '<dl class="ringkas-list">' +
             '<div><dt>Pemesan</dt><dd>' + esc(p.nama) + '</dd></div>' +
             '<div><dt>Tanggal</dt><dd>' + esc(tanggal(p.tanggal)) + '</dd></div>' +
             '<div><dt>Status</dt><dd>' + badgeStatus(p.status) + '</dd></div>' +
             '<div><dt>Catatan</dt><dd>' + (p.catatan ? esc(p.catatan) : '&mdash;') + '</dd></div>' +
             '<div class="ringkas-total"><dt>Total</dt><dd>' + rupiah(p.total) + '</dd></div>' +
           '</dl>';

    $('#modal-detail-title').text('Pesanan #' + p.id_pesanan);
    $('#modal-detail-body').html(isi);
    $('#modal-detail').prop('hidden', false);
  }

  function ubahStatus(id, status, $select) {
    $select.prop('disabled', true);

    Api.ubahStatusPesanan(id, status).done(function () {
      $.each(state.pesanan, function (i, p) {
        if (Number(p.id_pesanan) === Number(id)) { state.pesanan[i].status = status; return false; }
      });
      toast('Pesanan #' + id + ' → ' + status, 'ok');
    }).fail(function (res) {
      toast((res && res.error) ? res.error : 'Gagal mengubah status.', 'err');
    }).always(function () {
      $select.prop('disabled', false);
    });
  }

  function hapusPesanan(id) {
    if (!window.confirm('Hapus pesanan #' + id + '?\nStok menu akan dikembalikan.')) { return; }

    Api.hapusPesanan(id).done(function () {
      toast('Pesanan #' + id + ' dihapus.', 'ok');
      muatPesanan();
    }).fail(function (res) {
      toast((res && res.error) ? res.error : 'Gagal menghapus pesanan.', 'err');
    });
  }

  /* ==================================================================
   * 8. HALAMAN: TRANSAKSI BARU  (butir 2.c)
   * ------------------------------------------------------------------
   * Form ini mengikuti struktur database pada proposal:
   *   users.id_user            -> dropdown nama pemesan
   *   detail_pesanan.id_menu   -> pilihan menu
   *   detail_pesanan.jumlah    -> input jumlah
   *   detail_pesanan.subtotal  -> dihitung otomatis
   *   pesanan.total            -> dihitung otomatis
   *   pesanan.catatan          -> textarea
   * ================================================================== */

  function muatTransaksi() {
    state.cart = [];
    $('#hasil-panel').prop('hidden', true);

    $.when(Api.users(), Api.menu()).done(function (users, menu) {
      state.users = users || [];
      state.menu  = $.grep(menu || [], function (m) {
        return Number(m.aktif) === 1 && Number(m.stok) > 0;
      });

      isiSelectPemesan();
      isiSelectMenu();
      gambarKeranjang();

    }).fail(function (xhr) {
      toast((xhr && xhr.error) ? xhr.error : 'Gagal memuat data form.', 'err');
    });
  }

  function isiSelectPemesan() {
    var opsi = '<option value="">-- Pilih mahasiswa --</option>';
    $.each(state.users, function (i, u) {
      opsi += '<option value="' + u.id_user + '">' + esc(u.nama) +
              ' (' + esc(u.username) + ')</option>';
    });
    $('#f-pemesan').html(opsi);
  }

  function isiSelectMenu() {
    var opsi = '<option value="">-- Pilih menu --</option>';
    $.each(state.menu, function (i, m) {
      opsi += '<option value="' + m.id_menu + '">' +
              esc(m.nama_menu) + ' — ' + rupiah(m.harga) +
              ' (stok ' + m.stok + ')</option>';
    });
    $('#f-menu').html(opsi);
  }

  function menuById(id) {
    var hasil = null;
    $.each(state.menu, function (i, m) {
      if (Number(m.id_menu) === Number(id)) { hasil = m; return false; }
    });
    return hasil;
  }

  function tambahKeKeranjang() {
    var $form = $('#form-transaksi');
    bersihkanPesan($form);

    var idMenu = $('#f-menu').val();
    var jumlah = $('#f-jumlah').val();

    // --- validasi pilihan menu sebelum masuk keranjang ---
    var err = {};
    if (!idMenu) {
      err.pilih_menu = 'Pilih menu terlebih dahulu.';
    }
    if (!/^\d+$/.test(String(jumlah)) || Number(jumlah) < 1) {
      err.jumlah = 'Jumlah minimal 1 dan harus bilangan bulat.';
    }

    var m = idMenu ? menuById(idMenu) : null;
    if (m) {
      var sudah = 0;
      $.each(state.cart, function (i, c) {
        if (Number(c.id_menu) === Number(m.id_menu)) { sudah = Number(c.jumlah); return false; }
      });
      if (Number(jumlah) + sudah > Number(m.stok)) {
        err.jumlah = 'Stok "' + m.nama_menu + '" tinggal ' + m.stok +
                     ' (sudah ' + sudah + ' di keranjang).';
      }
    }

    if (!$.isEmptyObject(err)) {
      tampilkanPesan($form, err);
      return;
    }

    var ada = false;
    $.each(state.cart, function (i, c) {
      if (Number(c.id_menu) === Number(m.id_menu)) {
        state.cart[i].jumlah = Number(c.jumlah) + Number(jumlah);
        ada = true;
        return false;
      }
    });

    if (!ada) {
      state.cart.push({
        id_menu:      Number(m.id_menu),
        nama_menu:    m.nama_menu,
        harga_satuan: Number(m.harga),
        jumlah:       Number(jumlah),
        stok:         Number(m.stok),
        foto:         m.foto || ''
      });
    }

    $('#f-menu').val('');
    $('#f-jumlah').val(1);
    gambarKeranjang();
  }

  function gambarKeranjang() {
    var $rows = $('#cart-rows');
    if (!$rows.length) { return; }

    if (!state.cart.length) {
      $rows.html('<tr><td colspan="5" class="empty-note">Belum ada menu dipilih.</td></tr>');
      perbaruiRingkasan();
      return;
    }

    var html = '';
    $.each(state.cart, function (i, c) {
      var sub = Number(c.harga_satuan) * Number(c.jumlah);
      html += '<tr>' +
        '<td>' +
          '<div class="menu-cell">' +
            thumbMenu(c.foto, c.nama_menu) +
            '<div class="menu-info"><p class="menu-name">' + esc(c.nama_menu) + '</p>' +
            '<p class="subtext">stok tersedia ' + c.stok + '</p></div>' +
          '</div>' +
        '</td>' +
        '<td class="num">' + rupiah(c.harga_satuan) + '</td>' +
        '<td class="num">' +
          '<div class="qty-group">' +
            '<button type="button" class="counter-btn" data-cart-step="-1" data-idx="' + i + '">&minus;</button>' +
            '<input type="number" class="qty-input" data-idx="' + i + '" value="' + c.jumlah + '" min="1" max="' + c.stok + '">' +
            '<button type="button" class="counter-btn" data-cart-step="1" data-idx="' + i + '">+</button>' +
          '</div>' +
        '</td>' +
        '<td class="num">' + rupiah(sub) + '</td>' +
        '<td><button type="button" class="btn danger small" data-hapus-item="' + i + '">Hapus</button></td>' +
      '</tr>';
    });

    $rows.html(html);
    perbaruiRingkasan();
  }

  function perbaruiRingkasan() {
    var jumlahItem = 0;
    var total = 0;

    $.each(state.cart, function (i, c) {
      jumlahItem += Number(c.jumlah);
      total += Number(c.harga_satuan) * Number(c.jumlah);
    });

    $('#ringkas-item').text(jumlahItem);
    $('#ringkas-jenis').text(state.cart.length);
    $('#ringkas-total').text(rupiah(total));

    var namaPemesan = $('#f-pemesan option:selected').text();
    $('#ringkas-pemesan').text($('#f-pemesan').val() ? namaPemesan : '—');
  }

  /** Aturan validasi form transaksi (butir 2.c). */
  var ATURAN_TRANSAKSI = {
    id_user: { label: 'Nama pemesan', wajib: true },
    catatan: { label: 'Catatan', maks: 500 }
  };

  function simpanPesanan() {
    var $form = $('#form-transaksi');
    bersihkanPesan($form);

    // ---- LANGKAH 1: validasi jQuery di browser ----
    var err = validasi($form, ATURAN_TRANSAKSI);

    if (!state.cart.length) {
      err.items = 'Tambahkan minimal satu menu ke pesanan.';
    }

    // Periksa ulang stok terakhir
    $.each(state.cart, function (i, c) {
      var m = menuById(c.id_menu);
      if (m && Number(c.jumlah) > Number(m.stok)) {
        err.items = 'Stok "' + c.nama_menu + '" tinggal ' + m.stok + '.';
      }
    });

    if (!$.isEmptyObject(err)) {
      tampilkanPesan($form, err);
      toast('Form belum lengkap.', 'err');
      return;
    }

    // ---- LANGKAH 2: kirim ke server HTTP lewat AJAX ----
    var payload = {
      id_user: Number($('#f-pemesan').val()),
      catatan: $.trim(String($('#f-catatan').val() || '')),
      items: $.map(state.cart, function (c) {
        return { id_menu: c.id_menu, jumlah: Number(c.jumlah) };
      })
    };

    var $btn = $('#btn-simpan-pesanan').prop('disabled', true).text('Menyimpan…');

    Api.buatPesanan(payload).done(function (hasil) {
      toast('Pesanan #' + hasil.id_pesanan + ' tersimpan.', 'ok');
      tampilkanHasil(hasil);
      resetFormTransaksi();
      // segarkan stok pada dropdown
      Api.menu().done(function (menu) {
        state.menu = $.grep(menu || [], function (m) {
          return Number(m.aktif) === 1 && Number(m.stok) > 0;
        });
        isiSelectMenu();
      });
    }).fail(function (res) {
      var pesan = (res && res.error) ? res.error : 'Gagal menyimpan pesanan.';
      if (res && res.fields) {
        tampilkanPesan($form, res.fields);
      }
      toast(pesan, 'err');
    }).always(function () {
      $btn.prop('disabled', false).text('Simpan Pesanan');
    });
  }

  function tampilkanHasil(hasil) {
    var baris = '';
    $.each(hasil.items || [], function (i, d) {
      baris += '<tr><td>' + esc(d.nama_menu) + '</td>' +
               '<td class="num">' + d.jumlah + '</td>' +
               '<td class="num">' + rupiah(d.subtotal) + '</td></tr>';
    });

    $('#hasil-keterangan').text('Tersimpan pada database.');
    $('#hasil-body').html(
      '<dl class="ringkas-list">' +
        '<div><dt>No. pesanan</dt><dd>#' + hasil.id_pesanan + '</dd></div>' +
        '<div><dt>Status</dt><dd>' + badgeStatus(hasil.status || 'Menunggu') + '</dd></div>' +
      '</dl>' +
      '<div class="table-wrap"><table class="data-table">' +
        '<thead><tr><th>Menu</th><th class="num">Jumlah</th><th class="num">Subtotal</th></tr></thead>' +
        '<tbody>' + baris + '</tbody></table></div>' +
      '<p class="ringkas-total-line">Total: <strong>' + rupiah(hasil.total) + '</strong></p>'
    );
    $('#hasil-panel').prop('hidden', false);
  }

  function resetFormTransaksi() {
    var $form = $('#form-transaksi');
    if ($form.length) {
      $form[0].reset();
      bersihkanPesan($form);
    }
    state.cart = [];
    gambarKeranjang();
    $('#f-jumlah').val(1);
    $('#catatan-sisa').text('500');
  }

  /* ==================================================================
   * 9. PENANDA MODE (php / json) DI SIDEBAR
   * ================================================================== */

  function tandaiMode(mode) {
    if (mode === 'php') {
      $('#mode-dot').addClass('hidup');
      $('#mode-text').text('Terhubung ke MySQL');
      $('#mode-note').text('Data tersimpan permanen di database.');
    } else if (mode === 'file') {
      $('#mode-dot').addClass('demo');
      $('#mode-text').text('Perlu server lokal');
      $('#mode-note').text('Buka lewat Live Server, jangan klik ganda index.html.');
    } else {
      $('#mode-dot').addClass('demo');
      $('#mode-text').text('Mode demo (data JSON)');
      $('#mode-note').text('PHP tidak aktif. Perubahan disimpan di browser.');
    }
  }

  /* ==================================================================
   * 10. PEMASANGAN EVENT (delegasi, karena konten diganti AJAX)
   * ================================================================== */

  function pasangEvent() {

    /* ---------- navigasi ---------- */
    $(document).on('click', 'a[data-page]', function (e) {
      e.preventDefault();
      navigate($(this).data('page'), true);
    });

    $('#menu-toggle').on('click', function () {
      if ($('#sidebar').hasClass('terbuka')) { tutupSidebar(); } else { bukaSidebar(); }
    });

    $('#sidebar-overlay').on('click', tutupSidebar);

    $(window).on('popstate', function (e) {
      var page = (e.originalEvent && e.originalEvent.state && e.originalEvent.state.page)
        ? e.originalEvent.state.page
        : pageDariHash();
      navigate(page, false);
    });

    /* ---------- dashboard ---------- */
    $(document).on('click', '#btn-refresh-dash', function () {
      muatDashboard();
      toast('Data dashboard dimuat ulang.', 'info');
    });

    $(document).on('click', '#dash-orders tr.klik-baris', function () {
      var id = $(this).data('id');
      var p = null;
      $.each(state.pesanan, function (i, x) {
        if (Number(x.id_pesanan) === Number(id)) { p = x; return false; }
      });
      if (!p) { return; }

      var isi = '<div class="detail-head"><strong>Pesanan #' + p.id_pesanan + '</strong>' +
                badgeStatus(p.status) + '</div>';

      if (p.items && p.items.length) {
        isi += '<ul class="detail-list">';
        $.each(p.items, function (i, d) {
          isi += '<li><span>' + esc(d.nama_menu || ('Menu #' + d.id_menu)) + ' &times; ' + d.jumlah +
                 '</span><span>' + rupiah(d.subtotal) + '</span></li>';
        });
        isi += '</ul>';
      } else {
        isi += '<p class="subtext">Rincian item tidak tersedia.</p>';
      }

      isi += '<p class="detail-total">Total <strong>' + rupiah(p.total) + '</strong></p>' +
             (p.catatan ? '<p class="subtext">Catatan: ' + esc(p.catatan) + '</p>' : '');

      $('#dash-detail').html(isi).prop('hidden', false);
    });

    $(document).on('click', '#dash-status .chip', function () {
      state.filterStatusDash = $(this).data('status') || '';
      gambarTabelDashboard(state.pesanan);
      $('#dash-status .chip').removeClass('aktif');
      $(this).addClass('aktif');
      $('#dash-detail').prop('hidden', true);
    });

    /* ---------- kelola menu ---------- */
    $(document).on('input', '#menu-search', gambarTabelMenu);
    $(document).on('change', '#filter-kategori', gambarTabelMenu);

    $(document).on('click', '#btn-tambah-menu', function () {
      bukaModalMenu(null);
    });

    $(document).on('click', '[data-ubah-menu]', function () {
      bukaModalMenu($(this).data('ubah-menu'));
    });

    $(document).on('click', '[data-hapus-menu]', function () {
      hapusMenu($(this).data('hapus-menu'));
    });

    $(document).on('click', '[data-tutup-modal]', function () {
      $(this).closest('.modal-backdrop').prop('hidden', true);
    });

    $(document).on('click', '.modal-backdrop', function (e) {
      if (e.target === this) { $(this).prop('hidden', true); }
    });

    $(document).on('keydown', function (e) {
      if (e.key === 'Escape') {
        $('.modal-backdrop').prop('hidden', true);
      }
    });

    $(document).on('submit', '#form-menu', function (e) {
      e.preventDefault();
      simpanMenuDariForm($(this));
    });

    /* ---------- pesanan ---------- */
    $(document).on('input', '#pesanan-search', gambarTabelPesanan);
    $(document).on('change', '#filter-status', gambarTabelPesanan);

    $(document).on('change', '.status-select', function () {
      ubahStatus($(this).data('id'), $(this).val(), $(this));
    });

    $(document).on('click', '[data-detail]', function () {
      bukaDetailPesanan($(this).data('detail'));
    });

    $(document).on('click', '[data-hapus-pesanan]', function () {
      hapusPesanan($(this).data('hapus-pesanan'));
    });

    /* ---------- transaksi ---------- */
    $(document).on('click', '#btn-tambah-item', function (e) {
      e.preventDefault();
      tambahKeKeranjang();
    });

    $(document).on('change', '#f-pemesan', function () {
      $('#form-transaksi').find('[data-msg-for="id_user"]').text('');
      $(this).removeClass('invalid');
      perbaruiRingkasan();
    });

    $(document).on('click', '.counter-btn[data-step]', function () {
      var $inp = $('#f-jumlah');
      var n = Number($inp.val()) || 1;
      n += Number($(this).data('step'));
      $inp.val(Math.max(1, n));
    });

    $(document).on('input', '#f-catatan', function () {
      var sisa = 500 - String($(this).val() || '').length;
      $('#catatan-sisa').text(Math.max(0, sisa));
      if (sisa < 0) {
        $(this).addClass('invalid');
        $('#form-transaksi').find('[data-msg-for="catatan"]')
          .text('Catatan maksimal 500 karakter (kelebihan ' + Math.abs(sisa) + ').');
      } else {
        $(this).removeClass('invalid');
        $('#form-transaksi').find('[data-msg-for="catatan"]').text('');
      }
    });

    $(document).on('click', '[data-cart-step]', function () {
      var idx = Number($(this).data('idx'));
      var step = Number($(this).data('cart-step'));
      var c = state.cart[idx];
      if (!c) { return; }

      var baru = Number(c.jumlah) + step;
      if (baru < 1) { baru = 1; }
      if (baru > Number(c.stok)) {
        toast('Stok "' + c.nama_menu + '" tinggal ' + c.stok + '.', 'err');
        baru = Number(c.stok);
      }
      state.cart[idx].jumlah = baru;
      gambarKeranjang();
    });

    $(document).on('change', '.qty-input', function () {
      var idx = Number($(this).data('idx'));
      var c = state.cart[idx];
      if (!c) { return; }

      var v = Number($(this).val());
      if (!/^\d+$/.test(String($(this).val())) || v < 1) { v = 1; }
      if (v > Number(c.stok)) {
        toast('Stok "' + c.nama_menu + '" tinggal ' + c.stok + '.', 'err');
        v = Number(c.stok);
      }
      state.cart[idx].jumlah = v;
      gambarKeranjang();
    });

    $(document).on('click', '[data-hapus-item]', function () {
      var idx = Number($(this).data('hapus-item'));
      state.cart.splice(idx, 1);
      gambarKeranjang();
    });

    $(document).on('click', '#btn-reset-form', function () {
      resetFormTransaksi();
      $('#hasil-panel').prop('hidden', true);
      toast('Form dikosongkan.', 'info');
    });

    $(document).on('submit', '#form-transaksi', function (e) {
      e.preventDefault();
      simpanPesanan();
    });

    /* ---------- tombol Enter pada input jumlah ---------- */
    $(document).on('keydown', '#f-jumlah', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        tambahKeKeranjang();
      }
    });
  }

  /* ==================================================================
   * 11. MULAI APLIKASI
   * ================================================================== */

  $(function () {
    pasangEvent();

    // Deteksi apakah backend PHP aktif, lalu mulai routing.
    Api.init().done(function (mode) {
      tandaiMode(mode);

      // Dibuka dengan klik ganda: AJAX ke berkas lokal diblokir browser.
      if (mode === 'file') {
        setHeader(PAGES.dashboard);
        $('#page-content').attr('aria-busy', 'false').html(
          '<div class="notice danger">' +
            '<strong>Halaman ini dibuka langsung dari berkas (file://).</strong>' +
            '<p>Browser memblokir permintaan AJAX ke berkas lokal, sehingga data tidak ' +
            'bisa dimuat. Jalankan website dengan salah satu cara berikut:</p>' +
            '<ol>' +
              '<li><strong>Live Server</strong> — klik kanan <code>index.html</code> di VS Code, ' +
                  'lalu pilih <em>Open with Live Server</em>.</li>' +
              '<li><strong>XAMPP</strong> — salin folder proyek ke ' +
                  '<code>C:\\xampp\\htdocs\\</code>, nyalakan Apache &amp; MySQL, lalu buka ' +
                  '<code>http://localhost/kantin-kampus-admin/</code>.</li>' +
            '</ol>' +
          '</div>'
        );
        return;
      }

      var awal = pageDariHash();
      if (!PAGES[awal]) { awal = 'dashboard'; }
      navigate(awal, true);

      if (mode === 'json') {
        toast('PHP tidak aktif — aplikasi berjalan dalam mode demo.', 'info');
      }
    });
  });

})(jQuery);
