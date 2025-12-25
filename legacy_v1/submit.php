<?php
require_once 'functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.php');
    exit;
}

// 1. Spam Check
$state = getTransactionState();
$currentTime = time();
if ($currentTime - $state['last_transaction_time'] < 5) {
    // Trigger Alert
    $alertMsg = "⚠️ *SPAM ALERT* ⚠️\nSuspicious activity detected (Transaction too fast).";
    sendTelegramMessage($alertMsg);

    // Update time anyway to prevent rapid retry
    $state['last_transaction_time'] = $currentTime;
    saveTransactionState($state);

    // Optional: Stop or just warn? Requirement says "Trigger Alert", doesn't explicitly say block user.
    // But usually we want to block. Let's block for safety.
    header("Location: index.php?error=spam");
    exit;
}

// Update last transaction time
$state['last_transaction_time'] = $currentTime;
saveTransactionState($state);

// 2. Data Collection
$type = $_POST['type'] ?? '';
$invoice = 'RA-' . date('ym') . rand(10000, 99999);
$id_game = $_POST['id_game'] ?? '';
$nickname = $_POST['nickname'] ?? '';

// 3. Queue Check
$queue = getQueue();
foreach ($queue as $item) {
    if ($item['id_game'] === $id_game && $item['status'] === 'PENDING') {
        header("Location: index.php?error=pending");
        exit;
    }
}

// Get User IP & Location
$ip_address = $_SERVER['REMOTE_ADDR'];
$location = getLocation($ip_address);

// 4. Construct Message
$message = "";
if ($type === 'topup') {
    $wa = $_POST['wa'] ?? '';
    // Sanitize: Remove dots from input (e.g. "10.000" -> "10000")
    $raw_nominal = str_replace('.', '', $_POST['nominal']);
    $nominal = number_format((int) $raw_nominal, 0, ',', '.'); // Format for display
    $bank = $_POST['admin_bank'];
    $sender_name = $_POST['sender_name'] ?? '-';

    $message = "👑 *NEW TOP UP* 👑\n\n";
    $message .= "Invoice: `$invoice`\n";
    $message .= "WA: `$wa`\n";
    $message .= "ID Game: `$id_game`\n";
    $message .= "Nickname: `$nickname`\n";
    $message .= "Nominal: *Rp $nominal*\n";
    $message .= "Payment: `$bank`\n";
    $message .= "Sender Name: `$sender_name`\n";
    $message .= "IP: `$ip_address`\n";
    $message .= "Lokasi: `$location`\n";
} else {

    // Withdraw
    $wd_b = $_POST['wd_b'] ?? 0;
    $wd_m = $_POST['wd_m'] ?? 0;

    $amount = "";
    if ($wd_b > 0)
        $amount .= $wd_b . "B ";
    if ($wd_m > 0)
        $amount .= $wd_m . "M";
    $amount = trim($amount);

    $user_bank = $_POST['user_bank'];
    $acc_num = $_POST['account_number'];
    $acc_name = $_POST['account_name'];

    $message = "💸 *NEW WITHDRAW* 💸\n\n";
    $message .= "Invoice: `$invoice`\n";
    $message .= "ID Game: `$id_game`\n";
    $message .= "Nickname: `$nickname`\n";
    $message .= "Amount: `$amount`\n";
    $message .= "Bank: `$user_bank`\n";
    $message .= "No. Rek: `$acc_num`\n";
    $message .= "A.N: `$acc_name`\n";
    $message .= "IP: `$ip_address`\n";
    $message .= "Lokasi: `$location`\n";
}

// Add Process Links
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
$domain = $_SERVER['HTTP_HOST'];
$baseUrl = "$protocol://$domain";

// NOTE: Ensure this path matches where you upload the file. 
// If uploaded to public_html/royal, it might need to be "$baseUrl/royal/process.php"
// For now we assume root directory.
$approveLink = "$baseUrl/process.php?action=done&code=$invoice";
$rejectLink = "$baseUrl/process.php?action=reject&code=$invoice";

// Create Inline Keyboard or Text Link
// Telegram BLOCKS localhost URLs in buttons. We must handle this.
if (strpos($approveLink, 'localhost') !== false || strpos($approveLink, '127.0.0.1') !== false) {
    // Localhost: Use Text Link (Markdown) - Raw links for reliability
    $message .= "\n\n👇 *LINK PROSES (COPY-PASTE JIKA TIDAK BISA KLIK)* 👇";
    $message .= "\n\n✅ *TERIMA (DONE)*:\n`$approveLink`";
    $message .= "\n\n❌ *TOLAK (REJECT)*:\n`$rejectLink`";
    $keyboard = null;
} else {
    // Live Server: Use Cool Button
    $keyboard = [
        'inline_keyboard' => [
            [
                ['text' => '✅ TERIMA', 'url' => $approveLink],
                ['text' => '❌ TOLAK', 'url' => $rejectLink]
            ]
        ]
    ];
}

// 5. Send to Telegram
sendTelegramMessage($message, null, $keyboard);

// 6. Add to Queue
$queueItem = [
    'invoice' => $invoice,
    'id_game' => $id_game,
    'nickname' => $nickname,
    'status' => 'PENDING',
    'timestamp' => time(),
    'type' => $type,
    'ip' => $ip_address,
    'location' => $location
];

if ($type === 'topup') {
    $queueItem['nominal'] = $raw_nominal; // Save RAW number
    $queueItem['sender_name'] = $sender_name;
    $queueItem['payment_method'] = $bank;
    $queueItem['wa'] = $wa;
} else {
    $queueItem['nominal'] = $amount;
    $queueItem['bank_name'] = $user_bank;
    $queueItem['account_number'] = $acc_num;
    $queueItem['account_name'] = $acc_name;
}

$queue[] = $queueItem;
saveQueue($queue);

// 7. Redirect
header('Location: thanks.php');
exit;
?>