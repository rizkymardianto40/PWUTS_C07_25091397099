<?php
/**
 * api/kategori.php — daftar kategori menu
 * GET api/kategori.php -> [{id_kategori, nama_kategori, jumlah_menu}]
 */

require_once __DIR__ . '/../config/database.php';

try {
    $stmt = $pdo->query(
        'SELECT k.id_kategori, k.nama_kategori,
                COUNT(m.id_menu) AS jumlah_menu
         FROM kategori k
         LEFT JOIN menu m ON m.id_kategori = k.id_kategori AND m.aktif = 1
         GROUP BY k.id_kategori
         ORDER BY k.id_kategori ASC'
    );
    json_ok($stmt->fetchAll());
} catch (PDOException $e) {
    json_err('Terjadi kesalahan database: ' . $e->getMessage(), 500);
}
