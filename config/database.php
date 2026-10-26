<?php
/**
 * config/database.php
 * ------------------------------------------------------------------
 * Koneksi PDO ke MySQL + helper umum untuk seluruh endpoint di /api.
 * Tugas UTS Pemrograman Web — PWUTS_A07_25091397099
 * ------------------------------------------------------------------
 */

// Jangan tampilkan error mentah ke browser (bisa membocorkan kredensial).
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Zona waktu konsisten dengan XAMPP lokal.
date_default_timezone_set('Asia/Jakarta');

$DB_HOST = 'localhost';
$DB_NAME = 'kantin_kampus';
$DB_USER = 'root';
$DB_PASS = ''; // Default XAMPP. Ganti jika MySQL Anda memakai password.

try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok'    => false,
        'error' => 'Koneksi database gagal. Pastikan MySQL berjalan dan database '
                   . $DB_NAME . ' sudah diimport.',
    ]);
    exit;
}

/* ==================================================================
 * HELPER
 * ================================================================== */

/** Kirim respons JSON lalu berhenti. */
function json_out($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Kirim respons sukses standar. */
function json_ok($data = null, string $message = 'OK'): void
{
    json_out(['ok' => true, 'message' => $message, 'data' => $data]);
}

/** Kirim respons gagal standar. */
function json_err(string $message, int $code = 400): void
{
    json_out(['ok' => false, 'error' => $message], $code);
}

/**
 * Ambil seluruh input request (JSON body, form-urlencoded, atau query string).
 * Mendukung method spoofing lewat field `_method` karena PHP hanya
 * mem-parsing body untuk POST.
 */
function input(): array
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }

    $data = array_merge($_GET, $_POST);

    $raw = file_get_contents('php://input');
    if ($raw !== false && $raw !== '') {
        $json = json_decode($raw, true);
        if (is_array($json)) {
            $data = array_merge($data, $json);
        } elseif (strpos($raw, '=') !== false) {
            parse_str($raw, $parsed);
            if (is_array($parsed)) {
                $data = array_merge($data, $parsed);
            }
        }
    }

    return $cache = $data;
}

/** Method HTTP efektif (mendukung _method=PUT/DELETE dari AJAX). */
function method(): string
{
    $m = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $override = strtoupper((string) (input()['_method'] ?? ''));
    if ($m === 'POST' && in_array($override, ['PUT', 'PATCH', 'DELETE'], true)) {
        return $override;
    }
    return $m;
}

/** Ambil nilai input sebagai string yang sudah di-trim. */
function field(string $key, string $default = ''): string
{
    $v = input()[$key] ?? $default;
    return is_scalar($v) ? trim((string) $v) : $default;
}

/** Ambil nilai input sebagai int. */
function field_int(string $key, int $default = 0): int
{
    $v = input()[$key] ?? null;
    return ($v === null || $v === '') ? $default : (int) $v;
}

/** Ambil nilai input sebagai float. */
function field_num(string $key, float $default = 0): float
{
    $v = input()[$key] ?? null;
    if ($v === null || $v === '') {
        return $default;
    }
    // Terima "15.000" maupun "15000"
    $clean = preg_replace('/[^0-9.\-]/', '', (string) $v);
    return (float) $clean;
}

/** Pastikan user sudah login; kalau belum kirim 401. */
function require_login(): array
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    if (empty($_SESSION['user'])) {
        json_err('Anda belum login. Silakan login terlebih dahulu.', 401);
    }
    return $_SESSION['user'];
}

/** Pastikan user ber-role admin; kalau bukan kirim 403. */
function require_admin(): array
{
    $user = require_login();
    if (($user['role'] ?? '') !== 'admin') {
        json_err('Akses ditolak. Halaman ini hanya untuk admin.', 403);
    }
    return $user;
}
