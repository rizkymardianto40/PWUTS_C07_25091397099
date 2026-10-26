<?php
/**
 * api/menu.php — CRUD data menu
 * ------------------------------------------------------------------
 * GET    api/menu.php              -> daftar semua menu (JOIN kategori & penjual)
 * GET    api/menu.php?id=1         -> satu menu
 * POST   api/menu.php              -> tambah menu
 * POST   api/menu.php (_method=PUT)    -> ubah menu (id di body)
 * POST   api/menu.php (_method=DELETE) -> hapus menu (id di body)
 * ------------------------------------------------------------------
 */

require_once __DIR__ . '/../config/database.php';

$method = method();

try {
    switch ($method) {

        /* ------------------------------ READ ------------------------------ */
        case 'GET':
            $id = field_int('id');

            $sql = 'SELECT m.id_menu, m.id_kategori, m.id_penjual, m.nama_menu,
                           m.harga, m.stok, m.deskripsi, m.foto, m.populer, m.aktif,
                           k.nama_kategori, p.nama_penjual, p.lokasi
                    FROM menu m
                    LEFT JOIN kategori k ON k.id_kategori = m.id_kategori
                    LEFT JOIN penjual  p ON p.id_penjual  = m.id_penjual';

            if ($id > 0) {
                $stmt = $pdo->prepare($sql . ' WHERE m.id_menu = ? LIMIT 1');
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                if (!$row) {
                    json_err('Menu tidak ditemukan.', 404);
                }
                json_ok($row);
            }

            // Filter opsional: ?kategori=1  ?populer=1  ?aktif=1
            $where  = [];
            $params = [];
            if (($k = field_int('kategori')) > 0) {
                $where[]  = 'm.id_kategori = ?';
                $params[] = $k;
            }
            if (field('populer') !== '') {
                $where[]  = 'm.populer = 1';
            }
            if (field('aktif') !== '') {
                $where[]  = 'm.aktif = 1';
            }
            if ($where) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }
            $sql .= ' ORDER BY m.id_menu ASC';

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            json_ok($stmt->fetchAll());

        /* ----------------------------- CREATE ----------------------------- */
        case 'POST':
            $nama  = field('nama_menu');
            $harga = field_num('harga');
            $stok  = field_int('stok');
            $kat   = field_int('id_kategori');

            // --- Validasi server (lapis kedua setelah validasi jQuery) ---
            $err = [];
            if ($nama === '') {
                $err['nama_menu'] = 'Nama menu wajib diisi.';
            } elseif (mb_strlen($nama) < 3) {
                $err['nama_menu'] = 'Nama menu minimal 3 karakter.';
            }
            if ($harga <= 0) {
                $err['harga'] = 'Harga harus lebih besar dari 0.';
            }
            if ($stok < 0) {
                $err['stok'] = 'Stok tidak boleh negatif.';
            }
            if ($kat <= 0) {
                $err['id_kategori'] = 'Kategori wajib dipilih.';
            }
            if ($err) {
                json_out(['ok' => false, 'error' => 'Data belum valid.', 'fields' => $err], 422);
            }

            $stmt = $pdo->prepare(
                'INSERT INTO menu (id_kategori, id_penjual, nama_menu, harga, stok, deskripsi, foto, populer, aktif)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $kat,
                field_int('id_penjual') ?: null,
                $nama,
                $harga,
                $stok,
                field('deskripsi'),
                field('foto'),
                field_int('populer') ? 1 : 0,
                field('aktif') === '0' ? 0 : 1,
            ]);

            json_ok(['id_menu' => (int) $pdo->lastInsertId()], 'Menu berhasil ditambahkan.');

        /* ----------------------------- UPDATE ----------------------------- */
        case 'PUT':
        case 'PATCH':
            $id = field_int('id_menu') ?: field_int('id');
            if ($id <= 0) {
                json_err('ID menu tidak dikirim.', 422);
            }

            $stmt = $pdo->prepare('SELECT * FROM menu WHERE id_menu = ? LIMIT 1');
            $stmt->execute([$id]);
            $lama = $stmt->fetch();
            if (!$lama) {
                json_err('Menu tidak ditemukan.', 404);
            }

            $nama  = field('nama_menu', $lama['nama_menu']);
            $harga = field('harga') !== '' ? field_num('harga') : (float) $lama['harga'];
            $stok  = field('stok')  !== '' ? field_int('stok')  : (int) $lama['stok'];
            $kat   = field_int('id_kategori') ?: (int) $lama['id_kategori'];

            $err = [];
            if ($nama === '' || mb_strlen($nama) < 3) {
                $err['nama_menu'] = 'Nama menu minimal 3 karakter.';
            }
            if ($harga <= 0) {
                $err['harga'] = 'Harga harus lebih besar dari 0.';
            }
            if ($stok < 0) {
                $err['stok'] = 'Stok tidak boleh negatif.';
            }
            if ($err) {
                json_out(['ok' => false, 'error' => 'Data belum valid.', 'fields' => $err], 422);
            }

            $stmt = $pdo->prepare(
                'UPDATE menu
                 SET id_kategori = ?, id_penjual = ?, nama_menu = ?, harga = ?,
                     stok = ?, deskripsi = ?, foto = ?, populer = ?, aktif = ?
                 WHERE id_menu = ?'
            );
            $stmt->execute([
                $kat,
                field_int('id_penjual') ?: null,
                $nama,
                $harga,
                $stok,
                field('deskripsi', (string) $lama['deskripsi']),
                field('foto', (string) $lama['foto']),
                field('populer') !== '' ? (field_int('populer') ? 1 : 0) : (int) $lama['populer'],
                field('aktif')   !== '' ? (field_int('aktif')   ? 1 : 0) : (int) $lama['aktif'],
                $id,
            ]);

            json_ok(['id_menu' => $id], 'Menu berhasil diperbarui.');

        /* ----------------------------- DELETE ----------------------------- */
        case 'DELETE':
            $id = field_int('id_menu') ?: field_int('id');
            if ($id <= 0) {
                json_err('ID menu tidak dikirim.', 422);
            }

            // Cegah hapus menu yang sudah dipakai di detail_pesanan.
            $cek = $pdo->prepare('SELECT COUNT(*) FROM detail_pesanan WHERE id_menu = ?');
            $cek->execute([$id]);
            if ((int) $cek->fetchColumn() > 0) {
                json_err('Menu ini sudah dipakai pada transaksi, jadi tidak bisa dihapus. '
                       . 'Nonaktifkan saja lewat tombol Ubah.', 409);
            }

            $stmt = $pdo->prepare('DELETE FROM menu WHERE id_menu = ?');
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                json_err('Menu tidak ditemukan.', 404);
            }
            json_ok(['id_menu' => $id], 'Menu berhasil dihapus.');

        default:
            json_err('Method tidak didukung.', 405);
    }
} catch (PDOException $e) {
    json_err('Terjadi kesalahan database: ' . $e->getMessage(), 500);
}
