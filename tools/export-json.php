<?php
/**
 * tools/export-json.php
 * Menyalin isi database kantin_kampus ke file data/*.json.
 * File JSON ini dipakai sebagai sumber data cadangan saat website dibuka
 * dengan Live Server (tanpa PHP), sehingga tampilan tetap berjalan.
 *
 * Jalankan: C:\xampp\php\php.exe tools/export-json.php
 */

require_once __DIR__ . '/../config/database.php';

$tabel = [
    'users'          => 'SELECT id_user, nama, username, role FROM users ORDER BY id_user',
    'kategori'       => 'SELECT id_kategori, nama_kategori FROM kategori ORDER BY id_kategori',
    'penjual'        => 'SELECT id_penjual, nama_penjual, lokasi, jam_operasional, deskripsi, aktif FROM penjual ORDER BY id_penjual',
    'menu'           => 'SELECT m.id_menu, m.id_kategori, m.id_penjual, m.nama_menu, m.harga, m.stok,
                                m.deskripsi, m.foto, m.populer, m.aktif,
                                k.nama_kategori, p.nama_penjual, p.lokasi
                         FROM menu m
                         LEFT JOIN kategori k ON k.id_kategori = m.id_kategori
                         LEFT JOIN penjual  p ON p.id_penjual  = m.id_penjual
                         ORDER BY m.id_menu',
    'pesanan'        => 'SELECT p.id_pesanan, p.id_user, u.nama, p.tanggal, p.total, p.status, p.catatan
                         FROM pesanan p JOIN users u ON u.id_user = p.id_user
                         ORDER BY p.tanggal DESC, p.id_pesanan DESC',
    'detail_pesanan' => 'SELECT id_detail, id_pesanan, id_menu, jumlah, harga_satuan, subtotal
                         FROM detail_pesanan ORDER BY id_detail',
];

$dir = __DIR__ . '/../data';
if (!is_dir($dir)) {
    mkdir($dir, 0777, true);
}

foreach ($tabel as $nama => $sql) {
    $rows = $pdo->query($sql)->fetchAll();
    // Angka dikonversi agar JSON bersih (tanpa string "15000.00")
    foreach ($rows as &$r) {
        foreach ($r as $k => $v) {
            if (in_array($k, ['harga', 'total', 'harga_satuan', 'subtotal'], true)) {
                $r[$k] = (float) $v;
            } elseif (in_array($k, ['id_user', 'id_kategori', 'id_penjual', 'id_menu',
                                    'id_pesanan', 'id_detail', 'jumlah', 'stok',
                                    'populer', 'aktif'], true)) {
                $r[$k] = (int) $v;
            }
        }
    }
    unset($r);

    $file = $dir . '/' . $nama . '.json';
    file_put_contents(
        $file,
        json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    );
    echo "OK  data/{$nama}.json  (" . count($rows) . " baris)\n";
}

echo "\nSelesai.\n";
