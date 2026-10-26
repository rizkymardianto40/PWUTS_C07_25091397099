<?php
/**
 * api/pesanan.php — CRUD transaksi pesanan + detail_pesanan
 * ------------------------------------------------------------------
 * GET  api/pesanan.php                 -> daftar pesanan (+ jumlah item)
 * GET  api/pesanan.php?id=1            -> 1 pesanan + rincian item
 * POST api/pesanan.php                 -> buat pesanan baru (header + detail, dalam 1 transaksi)
 * POST api/pesanan.php (_method=PUT)   -> ubah status pesanan
 * POST api/pesanan.php (_method=DELETE)-> hapus pesanan
 * ------------------------------------------------------------------
 *
 * Format body untuk CREATE (dipakai oleh form 2.c):
 * {
 *   "id_user": 1,
 *   "catatan": "tanpa sambal",
 *   "items": [ { "id_menu": 1, "jumlah": 2 }, { "id_menu": 3, "jumlah": 1 } ]
 * }
 * Total & subtotal dihitung di server dari harga di tabel menu,
 * jadi angka dari browser tidak bisa dimanipulasi.
 * ------------------------------------------------------------------
 */

require_once __DIR__ . '/../config/database.php';

$method = method();

try {
    switch ($method) {

        /* ------------------------------ READ ------------------------------ */
        case 'GET':
            $id = field_int('id');

            if ($id > 0) {
                $stmt = $pdo->prepare(
                    'SELECT p.id_pesanan, p.id_user, u.nama, u.username,
                            p.tanggal, p.total, p.status, p.catatan
                     FROM pesanan p
                     JOIN users u ON u.id_user = p.id_user
                     WHERE p.id_pesanan = ?
                     LIMIT 1'
                );
                $stmt->execute([$id]);
                $pesanan = $stmt->fetch();
                if (!$pesanan) {
                    json_err('Pesanan tidak ditemukan.', 404);
                }

                $d = $pdo->prepare(
                    'SELECT d.id_detail, d.id_menu, m.nama_menu, m.foto,
                            d.jumlah, d.harga_satuan, d.subtotal
                     FROM detail_pesanan d
                     JOIN menu m ON m.id_menu = d.id_menu
                     WHERE d.id_pesanan = ?
                     ORDER BY d.id_detail ASC'
                );
                $d->execute([$id]);
                $pesanan['items'] = $d->fetchAll();

                json_ok($pesanan);
            }

            // Daftar pesanan + agregat jumlah item
            $sql = 'SELECT p.id_pesanan, p.id_user, u.nama, u.username,
                           p.tanggal, p.total, p.status, p.catatan,
                           COALESCE(SUM(d.jumlah), 0) AS jumlah_item
                    FROM pesanan p
                    JOIN users u ON u.id_user = p.id_user
                    LEFT JOIN detail_pesanan d ON d.id_pesanan = p.id_pesanan';

            $where  = [];
            $params = [];

            if (($status = field('status')) !== '') {
                $where[]  = 'p.status = ?';
                $params[] = $status;
            }
            if (($uid = field_int('id_user')) > 0) {
                $where[]  = 'p.id_user = ?';
                $params[] = $uid;
            }
            if ($where) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }

            $sql .= ' GROUP BY p.id_pesanan
                      ORDER BY p.tanggal DESC, p.id_pesanan DESC';

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            json_ok($stmt->fetchAll());

        /* ----------------------------- CREATE ----------------------------- */
        case 'POST':
            $id_user = field_int('id_user');
            $items   = input()['items'] ?? [];

            // --- Validasi lapis kedua (jQuery sudah memvalidasi di browser) ---
            $err = [];

            if ($id_user <= 0) {
                $err['id_user'] = 'Nama pemesan wajib dipilih.';
            } else {
                $cek = $pdo->prepare('SELECT COUNT(*) FROM users WHERE id_user = ?');
                $cek->execute([$id_user]);
                if ((int) $cek->fetchColumn() === 0) {
                    $err['id_user'] = 'Pemesan tidak terdaftar.';
                }
            }

            if (!is_array($items) || count($items) === 0) {
                $err['items'] = 'Pilih minimal satu menu.';
            }

            if ($err) {
                json_out(['ok' => false, 'error' => 'Data belum valid.', 'fields' => $err], 422);
            }

            // Normalisasi item -> hanya id_menu & jumlah
            $bersih = [];
            foreach ($items as $it) {
                $mid = (int) ($it['id_menu'] ?? 0);
                $jml = (int) ($it['jumlah'] ?? 0);
                if ($mid <= 0 || $jml <= 0) {
                    json_out([
                        'ok'     => false,
                        'error'  => 'Data belum valid.',
                        'fields' => ['items' => 'Setiap item harus punya menu dan jumlah minimal 1.'],
                    ], 422);
                }
                // Gabungkan bila menu sama dipilih dua kali
                if (isset($bersih[$mid])) {
                    $bersih[$mid] += $jml;
                } else {
                    $bersih[$mid] = $jml;
                }
            }

            $pdo->beginTransaction();
            try {
                $total   = 0.0;
                $rincian = [];

                $stmtMenu = $pdo->prepare(
                    'SELECT id_menu, nama_menu, harga, stok, aktif FROM menu WHERE id_menu = ? LIMIT 1'
                );

                foreach ($bersih as $mid => $jml) {
                    $stmtMenu->execute([$mid]);
                    $m = $stmtMenu->fetch();

                    if (!$m) {
                        throw new RuntimeException("Menu dengan ID {$mid} tidak ditemukan.");
                    }
                    if ((int) $m['aktif'] !== 1) {
                        throw new RuntimeException("Menu \"{$m['nama_menu']}\" sedang tidak tersedia.");
                    }
                    if ($jml > (int) $m['stok']) {
                        throw new RuntimeException(
                            "Stok \"{$m['nama_menu']}\" tinggal {$m['stok']}, tidak cukup untuk {$jml}."
                        );
                    }

                    $harga    = (float) $m['harga'];
                    $subtotal = $harga * $jml;
                    $total   += $subtotal;

                    $rincian[] = [
                        'id_menu'      => (int) $m['id_menu'],
                        'nama_menu'    => $m['nama_menu'],
                        'jumlah'       => $jml,
                        'harga_satuan' => $harga,
                        'subtotal'     => $subtotal,
                    ];
                }

                // 1) header pesanan
                $ins = $pdo->prepare(
                    'INSERT INTO pesanan (id_user, tanggal, total, status, catatan)
                     VALUES (?, NOW(), ?, ?, ?)'
                );
                $ins->execute([
                    $id_user,
                    $total,
                    'Menunggu',
                    mb_substr(field('catatan'), 0, 500),
                ]);
                $idPesanan = (int) $pdo->lastInsertId();

                // 2) rincian + potong stok
                $insDetail = $pdo->prepare(
                    'INSERT INTO detail_pesanan (id_pesanan, id_menu, jumlah, harga_satuan, subtotal)
                     VALUES (?, ?, ?, ?, ?)'
                );
                $updStok = $pdo->prepare(
                    'UPDATE menu SET stok = stok - ? WHERE id_menu = ? AND stok >= ?'
                );

                foreach ($rincian as $r) {
                    $insDetail->execute([
                        $idPesanan, $r['id_menu'], $r['jumlah'], $r['harga_satuan'], $r['subtotal'],
                    ]);
                    $updStok->execute([$r['jumlah'], $r['id_menu'], $r['jumlah']]);
                    if ($updStok->rowCount() === 0) {
                        throw new RuntimeException("Stok \"{$r['nama_menu']}\" berubah, silakan ulangi.");
                    }
                }

                $pdo->commit();

                json_ok([
                    'id_pesanan' => $idPesanan,
                    'total'      => $total,
                    'status'     => 'Menunggu',
                    'items'      => $rincian,
                ], 'Pesanan berhasil disimpan.');

            } catch (RuntimeException $e) {
                $pdo->rollBack();
                json_err($e->getMessage(), 422);
            } catch (Throwable $e) {
                $pdo->rollBack();
                throw $e;
            }

        /* ----------------------------- UPDATE ----------------------------- */
        case 'PUT':
        case 'PATCH':
            $id     = field_int('id_pesanan') ?: field_int('id');
            $status = field('status');

            if ($id <= 0) {
                json_err('ID pesanan tidak dikirim.', 422);
            }

            $boleh = ['Menunggu', 'Diproses', 'Siap diambil', 'Selesai', 'Dibatalkan'];
            if (!in_array($status, $boleh, true)) {
                json_out([
                    'ok'     => false,
                    'error'  => 'Data belum valid.',
                    'fields' => ['status' => 'Status tidak dikenali.'],
                ], 422);
            }

            $stmt = $pdo->prepare('SELECT status FROM pesanan WHERE id_pesanan = ? LIMIT 1');
            $stmt->execute([$id]);
            $lama = $stmt->fetchColumn();
            if ($lama === false) {
                json_err('Pesanan tidak ditemukan.', 404);
            }

            $upd = $pdo->prepare('UPDATE pesanan SET status = ? WHERE id_pesanan = ?');
            $upd->execute([$status, $id]);

            json_ok(['id_pesanan' => $id, 'status' => $status], 'Status pesanan diperbarui.');

        /* ----------------------------- DELETE ----------------------------- */
        case 'DELETE':
            $id = field_int('id_pesanan') ?: field_int('id');
            if ($id <= 0) {
                json_err('ID pesanan tidak dikirim.', 422);
            }

            // Kembalikan stok sebelum menghapus (detail ikut terhapus via ON DELETE CASCADE)
            $pdo->beginTransaction();
            try {
                $d = $pdo->prepare('SELECT id_menu, jumlah FROM detail_pesanan WHERE id_pesanan = ?');
                $d->execute([$id]);
                $rows = $d->fetchAll();

                $balik = $pdo->prepare('UPDATE menu SET stok = stok + ? WHERE id_menu = ?');
                foreach ($rows as $r) {
                    $balik->execute([(int) $r['jumlah'], (int) $r['id_menu']]);
                }

                $del = $pdo->prepare('DELETE FROM pesanan WHERE id_pesanan = ?');
                $del->execute([$id]);

                if ($del->rowCount() === 0) {
                    $pdo->rollBack();
                    json_err('Pesanan tidak ditemukan.', 404);
                }

                $pdo->commit();
                json_ok(['id_pesanan' => $id], 'Pesanan dihapus dan stok dikembalikan.');

            } catch (Throwable $e) {
                $pdo->rollBack();
                throw $e;
            }

        default:
            json_err('Method tidak didukung.', 405);
    }
} catch (PDOException $e) {
    json_err('Terjadi kesalahan database: ' . $e->getMessage(), 500);
}
