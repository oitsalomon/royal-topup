<?php
require_once 'functions.php';

header('Content-Type: application/json');

$last_check = isset($_GET['last_check']) ? (int) $$_GET['last_check'] : 0;
$queue = getQueue();

$new_transactions = [];
// $latest_timestamp = $last_check; // Removed as per instruction

foreach ($queue as $item) {
    // Return ALL PENDING transactions for the frontend to handle reminders
    if ($item['status'] === 'PENDING') {
        $new_transactions[] = [
            'invoice' => $item['invoice'],
            'type' => $item['type'],
            'nickname' => $item['nickname'] ?? 'Unknown',
            'nominal' => $item['nominal'] ?? 0,
            'timestamp' => $item['timestamp']
        ];

        // if ($item['timestamp'] > $latest_timestamp) { // Removed as per instruction
        //     $latest_timestamp = $item['timestamp']; // Removed as per instruction
        // }
    }
}

echo json_encode([
    'status' => 'success',
    'pending_transactions' => $new_transactions // Renamed key for clarity
    // 'latest_timestamp' => $latest_timestamp // Removed as per instruction
]);
