<?php
/**
 * api/users.php — daftar user untuk dropdown "Nama Pemesan" pada form transaksi
 * GET api/users.php -> [{id_user, nama, username, role}]
 */

require_once __DIR__ . '/../config/database.php';

try {
    $stmt = $pdo->query(
        'SELECT id_user, nama, username, role
         FROM users
         ORDER BY role ASC, nama ASC'
    );
    json_ok($stmt->fetchAll());
} catch (PDOException $e) {
    json_err('Terjadi kesalahan database: ' . $e->getMessage(), 500);
}
