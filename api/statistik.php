<?php
/**
 * api/statistik.php — angka ringkas untuk kartu statistik dashboard
 * GET api/statistik.php
 */

require_once __DIR__ . '/../config/database.php';

try {
    $totalMenu    = (int) $pdo->query('SELECT COUNT(*) FROM menu WHERE aktif = 1')->fetchColumn();
    $totalPenjual = (int) $pdo->query('SELECT COUNT(*) FROM penjual WHERE aktif = 1')->fetchColumn();
    $totalPesanan = (int) $pdo->query('SELECT COUNT(*) FROM pesanan')->fetchColumn();

    $pendapatan = (float) $pdo->query(
        "SELECT COALESCE(SUM(total), 0) FROM pesanan WHERE status <> 'Dibatalkan'"
    )->fetchColumn();

    $hariIni = (float) $pdo->query(
        "SELECT COALESCE(SUM(total), 0) FROM pesanan
         WHERE DATE(tanggal) = CURDATE() AND status <> 'Dibatalkan'"
    )->fetchColumn();

    $perStatus = [];
    $rows = $pdo->query('SELECT status, COUNT(*) AS n FROM pesanan GROUP BY status')->fetchAll();
    foreach ($rows as $r) {
        $perStatus[$r['status']] = (int) $r['n'];
    }

    $terlaris = $pdo->query(
        'SELECT m.id_menu, m.nama_menu, m.foto,
                SUM(d.jumlah) AS terjual,
                SUM(d.subtotal) AS omzet
         FROM detail_pesanan d
         JOIN menu m ON m.id_menu = d.id_menu
         JOIN pesanan p ON p.id_pesanan = d.id_pesanan
         WHERE p.status <> "Dibatalkan"
         GROUP BY m.id_menu
         ORDER BY terjual DESC
         LIMIT 5'
    )->fetchAll();

    json_ok([
        'total_menu'    => $totalMenu,
        'total_penjual' => $totalPenjual,
        'total_pesanan' => $totalPesanan,
        'pendapatan'    => $pendapatan,
        'pendapatan_hari_ini' => $hariIni,
        'per_status'    => $perStatus,
        'terlaris'      => $terlaris,
    ]);

} catch (PDOException $e) {
    json_err('Terjadi kesalahan database: ' . $e->getMessage(), 500);
}
