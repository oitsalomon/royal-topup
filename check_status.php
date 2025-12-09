<?php
require_once 'functions.php';

header('Content-Type: application/json');

$id_game = trim($_GET['id_game'] ?? '');

if (empty($id_game)) {
    echo json_encode(['status' => 'error', 'message' => 'ID Game required']);
    exit;
}

$queue = getQueue();
$history = [];

// Search for all transactions matching ID
foreach ($queue as $item) {
    // Use loose comparison for ID to handle string/int differences and trim
    if (isset($item['id_game']) && trim($item['id_game']) == $id_game) {
        $history[] = [
            'invoice' => $item['invoice'],
            'type' => $item['type'],
            'nominal' => $item['nominal'],
            'status' => $item['status'],
            'timestamp' => date('d M H:i', $item['timestamp']),
            'reject_reason' => $item['reject_reason'] ?? ''
        ];
    }
}

// Sort by newest first (queue is oldest first, so reverse)
$history = array_reverse($history);

// Limit to last 5
$history = array_slice($history, 0, 5);

if (!empty($history)) {
    echo json_encode(['status' => 'found', 'data' => $history]);
} else {
    echo json_encode(['status' => 'not_found', 'message' => 'Transaction not found']);
}
?>