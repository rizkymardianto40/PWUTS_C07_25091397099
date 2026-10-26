<?php
/**
 * auth/login.php — login admin (session + password_verify)
 * ------------------------------------------------------------------
 * GET  auth/login.php   -> cek status login (dipakai AJAX)
 * POST auth/login.php   -> proses login {username, password}
 * ------------------------------------------------------------------
 */

require_once __DIR__ . '/../config/database.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ---- Cek status login ----
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' && field('cek') !== '') {
    json_ok([
        'login' => !empty($_SESSION['user']),
        'user'  => $_SESSION['user'] ?? null,
    ]);
}

if (method() !== 'POST') {
    json_err('Gunakan POST untuk login.', 405);
}

$username = field('username');
$password = (string) (input()['password'] ?? '');

$err = [];
if ($username === '') {
    $err['username'] = 'Username wajib diisi.';
}
if ($password === '') {
    $err['password'] = 'Password wajib diisi.';
}
if ($err) {
    json_out(['ok' => false, 'error' => 'Data belum valid.', 'fields' => $err], 422);
}

try {
    $stmt = $pdo->prepare(
        'SELECT id_user, nama, username, password, role
         FROM users WHERE username = ? LIMIT 1'
    );
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        // Pesan sengaja digabung agar tidak membocorkan username mana yang ada.
        json_err('Username atau password salah.', 401);
    }

    if ($user['role'] !== 'admin') {
        json_err('Akun ini bukan admin, tidak bisa membuka panel.', 403);
    }

    session_regenerate_id(true);
    $_SESSION['user'] = [
        'id_user'  => (int) $user['id_user'],
        'nama'     => $user['nama'],
        'username' => $user['username'],
        'role'     => $user['role'],
    ];

    json_ok($_SESSION['user'], 'Login berhasil.');

} catch (PDOException $e) {
    json_err('Terjadi kesalahan database: ' . $e->getMessage(), 500);
}
