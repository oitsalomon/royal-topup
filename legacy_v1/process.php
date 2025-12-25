<?php
require_once 'functions.php';

$action = $_GET['action'] ?? '';
$code = $_GET['code'] ?? '';

if (empty($code)) {
    die("Error: No invoice code provided.");
}


$queue = getQueue();
$status = '';
$updated_status_text = '';

if ($action === 'done') {
    $status = 'DONE';
    $updated_status_text = '✅ TRANSAKSI BERHASIL';
} elseif ($action === 'reject') {
    $status = 'REJECTED';
    $updated_status_text = '❌ TRANSAKSI DITOLAK';
} else {
    die("Error: Invalid action.");
}

if (updateTransactionStatus($code, $status)) {
    echo "<h1>$updated_status_text</h1>";
    echo "<p>Invoice: $code</p>";
    echo "<p>Anda bisa menutup jendela ini.</p>";
} else {
    echo "<h1>Error</h1>";
    echo "<p>Invoice tidak ditemukan.</p>";
}
?>