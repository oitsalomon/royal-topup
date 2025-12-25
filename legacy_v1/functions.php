<?php

function getConfig()
{
    $configFile = __DIR__ . '/config.json';
    if (!file_exists($configFile)) {
        return [];
    }
    $json = file_get_contents($configFile);
    return json_decode($json, true);
}

function saveConfig($config)
{
    $configFile = __DIR__ . '/config.json';
    file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
}

function getTransactionState()
{
    $file = __DIR__ . '/transaction_state.json';
    if (!file_exists($file)) {
        return ["last_transaction_time" => 0];
    }
    return json_decode(file_get_contents($file), true);
}

function saveTransactionState($state)
{
    $file = __DIR__ . '/transaction_state.json';
    file_put_contents($file, json_encode($state, JSON_PRETTY_PRINT));
}

function getQueue()
{
    $file = __DIR__ . '/queue.json';
    if (!file_exists($file)) {
        return [];
    }
    return json_decode(file_get_contents($file), true);
}

function saveQueue($queue)
{
    $file = __DIR__ . '/queue.json';
    file_put_contents($file, json_encode($queue, JSON_PRETTY_PRINT));
}

function sendTelegramMessage($message, $chat_id = null, $keyboard = null)
{
    $config = getConfig();
    $token = $config['telegram_bot_token'];
    $chat_id = $chat_id ?? $config['telegram_chat_id'];

    if ($token === 'YOUR_BOT_TOKEN_HERE' || $chat_id === 'YOUR_CHAT_ID_HERE') {
        return false;
    }

    $url = "https://api.telegram.org/bot$token/sendMessage";

    $data = [
        'chat_id' => $chat_id,
        'text' => $message,
        'parse_mode' => 'Markdown'
    ];

    if ($keyboard) {
        $data['reply_markup'] = $keyboard; // Pass array directly, json_encode($data) handles it
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $result = curl_exec($ch);

    // Debug Logging
    if ($result === false) {
        file_put_contents('telegram_error.log', date('Y-m-d H:i:s') . " Curl Error: " . curl_error($ch) . "\n", FILE_APPEND);
    } else {
        $response = json_decode($result, true);
        if (!$response['ok']) {
            file_put_contents('telegram_error.log', date('Y-m-d H:i:s') . " API Error: " . $result . "\n", FILE_APPEND);
        }
    }

    curl_close($ch);

    return $result;
}

function getLocation($ip)
{
    if ($ip == '127.0.0.1' || $ip == '::1') {
        return "Localhost (Server Sendiri)";
    }

    // Use ip-api.com (Free, no key required for low usage)
    $url = "http://ip-api.com/json/$ip";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3); // Fast timeout
    $result = curl_exec($ch);
    curl_close($ch);

    if ($result) {
        $data = json_decode($result, true);
        if (isset($data['status']) && $data['status'] == 'success') {
            return $data['city'] . ", " . $data['country'];
        }
    }
    return "Unknown Location";
}

// --- User Management ---

function getUsers()
{
    $file = 'users.json';
    if (!file_exists($file)) {
        return [];
    }
    return json_decode(file_get_contents($file), true) ?? [];
}

function saveUsers($users)
{
    file_put_contents('users.json', json_encode($users, JSON_PRETTY_PRINT));
}

function logAttendance($username, $type, $details = null)
{
    $file = 'attendance.json';
    $logs = [];
    if (file_exists($file)) {
        $logs = json_decode(file_get_contents($file), true) ?? [];
    }

    $logEntry = [
        'username' => $username,
        'type' => $type, // 'login', 'logout', 'EDIT_DATA'
        'timestamp' => time(),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown'
    ];

    if ($details) {
        $logEntry['details'] = $details;
    }

    $logs[] = $logEntry;

    // Keep only last 1000 logs to prevent bloat
    if (count($logs) > 1000) {
        $logs = array_slice($logs, -1000);
    }

    file_put_contents($file, json_encode($logs, JSON_PRETTY_PRINT));
}



function getAttendance()
{
    $file = 'attendance.json';
    if (!file_exists($file))
        return [];
    $logs = json_decode(file_get_contents($file), true) ?? [];
    return array_reverse($logs); // Newest first
}

function loginUser($username, $password)
{
    $users = getUsers();
    foreach ($users as $user) {
        if ($user['username'] === $username && $user['password'] === $password) {
            // Check if locked
            if (isset($user['is_locked']) && $user['is_locked']) {
                return 'LOCKED';
            }

            // Log Attendance
            logAttendance($username, 'login');

            return $user;
        }
    }
    return false;
}

function updateTransactionStatus($invoice, $status, $reason = '', $admin = 'System')
{
    $queue = getQueue();
    $found = false;
    $updated_status_text = '';
    $item_details = [];

    foreach ($queue as &$item) {
        if ($item['invoice'] === $invoice) {
            $item['status'] = $status;
            $item['processed_by'] = $admin;
            $item['processed_at'] = time();

            if ($status === 'REJECTED') {
                $item['reject_reason'] = $reason;
                $updated_status_text = '❌ TRANSAKSI DITOLAK';
            } elseif ($status === 'DONE') {
                $updated_status_text = '✅ TRANSAKSI BERHASIL';
            }

            $item_details = $item;
            $found = true;
            break;
        }
    }

    if ($found) {
        saveQueue($queue);

        // Notify Telegram (DISABLED per user request)
        /*
        $message = "🔔 *STATUS UPDATE* 🔔\n\n";
        $message .= "Invoice: `$invoice`\n";
        $message .= "Status: *$updated_status_text*\n";

        if ($status === 'REJECTED' && !empty($reason)) {
            $message .= "Alasan: _$reason_\n";
        }

        $message .= "Processed by: _{$admin}_";

        sendTelegramMessage($message);
        */
        return true;
    }
    return false;
}

function editTransaction($invoice, $newData, $admin)
{
    $queue = getQueue();
    $found = false;
    $oldData = [];

    foreach ($queue as &$item) {
        if ($item['invoice'] === $invoice) {
            $oldData = $item;

            // Update fields
            if (isset($newData['nickname']))
                $item['nickname'] = $newData['nickname'];
            if (isset($newData['nominal']))
                $item['nominal'] = $newData['nominal'];

            // For WD specific fields
            if ($item['type'] === 'withdraw') {
                if (isset($newData['bank_name']))
                    $item['bank_name'] = $newData['bank_name'];
                if (isset($newData['account_number']))
                    $item['account_number'] = $newData['account_number'];
                if (isset($newData['account_name']))
                    $item['account_name'] = $newData['account_name'];
            }
            // For TopUp specific fields
            if ($item['type'] === 'topup') {
                if (isset($newData['sender_name']))
                    $item['sender_name'] = $newData['sender_name'];
            }

            $found = true;
            break;
        }
    }

    if ($found) {
        saveQueue($queue);

        // Log to Attendance
        logAttendance($admin, 'EDIT_DATA', "Edited Invoice: $invoice");

        // Notify Telegram
        $message = "✏️ *DATA UPDATED* ✏️\n\n";
        $message .= "Invoice: `$invoice`\n";
        $message .= "Admin: _{$admin}_\n\n";
        $message .= "Changes:\n";

        if ($oldData['nickname'] !== $newData['nickname'])
            $message .= "Nick: " . $oldData['nickname'] . " -> " . $newData['nickname'] . "\n";
        if ($oldData['nominal'] !== $newData['nominal'])
            $message .= "Nominal: " . $oldData['nominal'] . " -> " . $newData['nominal'] . "\n";

        sendTelegramMessage($message);
        return true;
    }
    return false;
}
function calculateChipAmount($rupiah)
{
    // Remove non-numeric chars just in case
    $rupiah = (int) preg_replace('/[^0-9]/', '', $rupiah);

    // Helper for flooring to 2 decimals
    $floor2 = function ($val) {
        return number_format(floor($val * 100) / 100, 2);
    };

    // Dynamic Tiers
    if ($rupiah >= 3150000) { // 50B+
        return $floor2($rupiah / 63000) . ' B';
    }
    if ($rupiah >= 1280000) { // 20B+
        return $floor2($rupiah / 64000) . ' B';
    }
    if ($rupiah >= 645000) { // 10B+
        return $floor2($rupiah / 64500) . ' B';
    }

    // Fixed Packages
    $map = [
        10000 => '120 M',
        15000 => '170 M',
        20000 => '250 M',
        25000 => '350 M',
        30000 => '400 M',
        32500 => '500 M',
        35000 => '530 M',
        40000 => '600 M',
        45000 => '650 M',
        50000 => '750 M',
        55000 => '800 M',
        60000 => '900 M',
        65000 => '1 B'
    ];

    if (isset($map[$rupiah])) {
        return $map[$rupiah];
    }

    // Default Normal Price (1B = 65.000) for unlisted amounts < 10B
    if ($rupiah > 0) {
        return $floor2($rupiah / 65000) . ' B';
    }

    return '';
}

function calculateWDAmount($nominalStr)
{
    $nominalStr = strtoupper($nominalStr);
    $b = 0;
    $m = 0;

    // Parse B
    if (preg_match('/(\d+(?:\.\d+)?)B/', $nominalStr, $matches)) {
        $b = (float) $matches[1];
    }
    // Parse M
    if (preg_match('/(\d+(?:\.\d+)?)M/', $nominalStr, $matches)) {
        $m = (float) $matches[1];
    }

    $totalB = $b + ($m / 1000);
    $rupiah = 0;

    if ($totalB < 1) {
        // Fixed Map for < 1B
        $totalM = ($b * 1000) + $m;
        $map = [
            100 => 5000,
            200 => 10000,
            300 => 15000,
            400 => 20000,
            500 => 25000,
            750 => 35000,
            900 => 45000
        ];

        if (isset($map[$totalM])) {
            $rupiah = $map[$totalM];
        } else {
            // Fallback 50k/B for unlisted small amounts
            $rupiah = $totalB * 50000;
        }
    } else {
        // >= 1B -> 60k/B
        $rupiah = $totalB * 60000;
    }

    return "Rp " . number_format($rupiah, 0, ',', '.');
}
?>