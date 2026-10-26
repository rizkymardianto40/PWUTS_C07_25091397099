<?php
/**
 * api/penjual.php — daftar stan / penjual kantin
 * GET api/penjual.php        -> semua penjual
 * GET api/penjual.php?id=1   -> satu penjual + daftar menunya
 */

require_once __DIR__ . '/../config/database.php';

$method = method();

try {
    if ($method !== 'GET') {
        json_err('Endpoint penjual hanya mendukung GET.', 405);
    }

    $id = field_int('id');

    if ($id > 0) {
        $stmt = $pdo->prepare(
            'SELECT id_penjual, nama_penjual, lokasi, jam_operasional, deskripsi, aktif
             FROM penjual WHERE id_penjual = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            json_err('Penjual tidak ditemukan.', 404);
        }

        $m = $pdo->prepare(
            'SELECT id_menu, nama_menu, harga, stok, foto, populer
             FROM menu WHERE id_penjual = ? AND aktif = 1
             ORDER BY id_menu ASC'
        );
        $m->execute([$id]);
        $row['menu'] = $m->fetchAll();

        json_ok($row);
    }

    $stmt = $pdo->query(
        'SELECT p.id_penjual, p.nama_penjual, p.lokasi, p.jam_operasional,
                p.deskripsi, p.aktif,
                COUNT(m.id_menu) AS jumlah_menu
         FROM penjual p
         LEFT JOIN menu m ON m.id_penjual = p.id_penjual AND m.aktif = 1
         GROUP BY p.id_penjual
         ORDER BY p.id_penjual ASC'
    );

    json_ok($stmt->fetchAll());

} catch (PDOException $e) {
    json_err('Terjadi kesalahan database: ' . $e->getMessage(), 500);
}
