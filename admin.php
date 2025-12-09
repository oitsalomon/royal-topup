<?php
session_start();
require_once 'functions.php';

// --- Handle Logout ---
if (isset($_GET['logout'])) {
    // Log Logout
    if (isset($_SESSION['admin_username'])) {
        logAttendance($_SESSION['admin_username'], 'logout');
    }
    session_destroy();
    header("Location: admin.php");
    exit;
}

// --- Handle Login ---
$login_error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $username = $_POST['username'];
    $password = $_POST['password'];

    $user = loginUser($username, $password);

    if ($user === 'LOCKED') {
        $login_error = "Akun Anda terkunci! Hubungi Super Admin.";
    } elseif ($user) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_username'] = $user['username'];
        $_SESSION['admin_role'] = $user['role'];
        $_SESSION['admin_permissions'] = $user['permissions'] ?? []; // Array of allowed sections
        header("Location: admin.php");
        exit;
    } else {
        $login_error = "Username atau Password salah!";
    }
}

// --- Require Login ---
if (!isset($_SESSION['admin_logged_in'])) {
    ?>
    <!DOCTYPE html>
    <html lang="id">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Login - Royal Aqua</title>
        <link rel="stylesheet" href="style.css">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            body {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }

            .login-card {
                width: 100%;
                max-width: 400px;
            }
        </style>
    </head>

    <body>
        <div class="glass-panel login-card">
            <h2><i class="fas fa-lock"></i> Admin Login</h2>
            <?php if ($login_error): ?>
                <div class="status-result status-rejected" style="margin-bottom: 15px;"><?= $login_error ?></div>
            <?php endif; ?>
            <form method="POST">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" name="username" required placeholder="admin">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" name="password" required placeholder="password">
                </div>
                <button type="submit" name="login" class="submit-btn">Login</button>
            </form>
        </div>
    </body>

    </html>
    <?php
    exit;
}

// --- Permission Helper ---
function hasPermission($section)
{
    // Superadmin has all permissions
    if (isset($_SESSION['admin_role']) && $_SESSION['admin_role'] === 'superadmin')
        return true;

    // Check if section is in permissions array
    return in_array($section, $_SESSION['admin_permissions'] ?? []);
}

// --- Handle Form Submissions (Authenticated) ---
$config = getConfig();
$users = getUsers();
$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Update General Settings
    if (isset($_POST['update_settings']) && hasPermission('settings')) {
        $config['telegram_bot_token'] = $_POST['bot_token'];
        $config['telegram_chat_id'] = $_POST['chat_id'];
        $config['qris_image_url'] = $_POST['qris_url'];
        saveConfig($config);
        $message = "Settings updated!";
    }

    // 2. Manage Banks
    if (isset($_POST['add_bank']) && hasPermission('banks')) {
        $newBank = [
            'id' => time(),
            'name' => $_POST['bank_name'],
            'number' => $_POST['bank_number'],
            'holder' => $_POST['bank_holder'],
            'is_active' => true
        ];
        $config['banks'][] = $newBank;
        saveConfig($config);
        $message = "Bank added!";
    }
    if (isset($_POST['toggle_bank']) && hasPermission('banks')) {
        foreach ($config['banks'] as &$bank) {
            if ($bank['id'] == $_POST['bank_id']) {
                $bank['is_active'] = !$bank['is_active'];
                break;
            }
        }
        saveConfig($config);
    }
    if (isset($_POST['delete_bank']) && hasPermission('banks')) {
        $config['banks'] = array_filter($config['banks'], function ($b) {
            return $b['id'] != $_POST['bank_id'];
        });
        saveConfig($config);
        $message = "Bank deleted!";
    }

    // 3. Manage ID WD
    if (isset($_POST['update_id_wd']) && hasPermission('idwd')) {
        $config['id_wd']['value'] = $_POST['id_wd_value'];
        $config['id_wd']['nickname'] = $_POST['id_wd_nickname'];
        $config['id_wd']['is_active'] = isset($_POST['id_wd_active']);
        saveConfig($config);
        $message = "ID WD updated!";
    }

    // 4. Manage Contacts
    if (isset($_POST['update_contacts']) && hasPermission('idwd')) {
        $config['contacts']['whatsapp']['number'] = $_POST['wa_number'];
        $config['contacts']['whatsapp']['is_active'] = isset($_POST['wa_active']);
        $config['contacts']['telegram']['username'] = $_POST['tg_username'];
        $config['contacts']['telegram']['is_active'] = isset($_POST['tg_active']);
        saveConfig($config);
        $message = "Contacts updated!";
    }

    // 5. Manage Neo Party
    if (isset($_POST['update_neo']) && hasPermission('neo')) {
        $config['neo_party']['topup_url'] = $_POST['neo_topup'];
        $config['neo_party']['withdraw_url'] = $_POST['neo_withdraw'];
        $config['neo_party']['neo_url'] = $_POST['neo_neo'];
        $config['neo_party']['register_url'] = $_POST['neo_register'];
        $config['neo_party']['is_active'] = isset($_POST['neo_active']);
        saveConfig($config);
        $message = "Neo Party updated!";
    }

    // 7. Manage Admin Game IDs
    if (isset($_POST['add_game_id']) && hasPermission('idwd')) {
        $newGameId = [
            'id' => time(),
            'name' => $_POST['game_id_name'],
            'balance' => 0 // Initial balance
        ];
        $config['admin_game_ids'][] = $newGameId;
        saveConfig($config);
        $message = "Admin Game ID added!";
    }
    if (isset($_POST['delete_game_id']) && hasPermission('idwd')) {
        $config['admin_game_ids'] = array_filter($config['admin_game_ids'], function ($g) {
            return $g['id'] != $_POST['game_id_id'];
        });
        saveConfig($config);
        $message = "Admin Game ID deleted!";
    }
    if (isset($_POST['update_game_balance']) && hasPermission('idwd')) {
        foreach ($config['admin_game_ids'] as &$gid) {
            if ($gid['id'] == $_POST['game_id_id']) {
                $b = floatval($_POST['new_balance_b'] ?? 0);
                $m = floatval($_POST['new_balance_m'] ?? 0);
                $gid['balance'] = $b + ($m / 1000);
                break;
            }
        }
        saveConfig($config);
        $message = "Game ID Balance updated!";
    }
    if (isset($_POST['update_game_usage']) && hasPermission('idwd')) {
        foreach ($config['admin_game_ids'] as &$gid) {
            if ($gid['id'] == $_POST['game_id_id']) {
                $gid['usage'] = $_POST['new_usage'];
                break;
            }
        }
        saveConfig($config);
        $message = "Game ID Usage updated!";
    }

    // 6. Manage Users (Add/Delete/Lock)
    if (isset($_POST['add_user']) && hasPermission('users')) {
        $permissions = $_POST['permissions'] ?? [];

        $newUser = [
            'id' => time(),
            'username' => $_POST['new_username'],
            'password' => $_POST['new_password'],
            'role' => 'admin',
            'permissions' => $permissions,
            'is_locked' => false
        ];
        $users[] = $newUser;
        saveUsers($users);
        $message = "User added!";
    }
    if (isset($_POST['delete_user']) && hasPermission('users')) {
        $users = array_filter($users, function ($u) {
            return $u['id'] != $_POST['user_id'];
        });
        saveUsers($users);
        $message = "User deleted!";
    }
    if (isset($_POST['toggle_lock']) && hasPermission('users')) {
        foreach ($users as &$u) {
            if ($u['id'] == $_POST['user_id']) {
                $u['is_locked'] = !($u['is_locked'] ?? false);
                break;
            }
        }
        saveUsers($users);
        $message = "User lock status updated!";
    }

    // 7. Handle Transaction Status Update
    if (isset($_POST['update_status']) && hasPermission('transactions')) {
        $invoice = $_POST['invoice'];
        $status = $_POST['status'];
        $reason = $_POST['reason'] ?? '';
        $admin = $_SESSION['admin_username'];

        // BALANCE UPDATE LOGIC
        if ($status === 'DONE') {
            $queue = getQueue();
            $transaction = null;
            foreach ($queue as $t) {
                if ($t['invoice'] === $invoice) {
                    $transaction = $t;
                    break;
                }
            }

            if ($transaction) {
                $gameId = $_POST['admin_game_id'] ?? null;
                $bankId = $_POST['admin_bank_id'] ?? null;

                // 1. Update Game ID Balance (Chips)
                if ($gameId) {
                    foreach ($config['admin_game_ids'] as &$gid) {
                        if ($gid['id'] == $gameId) {
                            if ($transaction['type'] === 'topup') {
                                // Deduct Chips
                                $chipStr = calculateChipAmount($transaction['nominal']); // e.g. "1.23 B"
                                $chipVal = floatval($chipStr); // 1.23
                                $gid['balance'] -= $chipVal;
                            } else {
                                // Add Chips (Parse "1B 500M" -> 1.5)
                                $nominal = strtoupper($transaction['nominal']);
                                $chips = 0;
                                if (preg_match('/(\d+(?:\.\d+)?)B/', $nominal, $m))
                                    $chips += (float) $m[1];
                                if (preg_match('/(\d+(?:\.\d+)?)M/', $nominal, $m))
                                    $chips += (float) $m[1] / 1000;
                                $gid['balance'] += $chips;
                            }
                            break;
                        }
                    }
                }

                // 2. Update Bank Balance (Money)
                if ($transaction['type'] === 'topup') {
                    // Add Money to Destination Bank
                    // Match payment_method to Bank Name
                    $pm = $transaction['payment_method'];
                    foreach ($config['banks'] as &$b) {
                        if (stripos($pm, $b['name']) !== false) {
                            $b['balance'] = ($b['balance'] ?? 0) + (int) $transaction['nominal'];
                            break;
                        }
                    }
                } elseif ($transaction['type'] === 'withdraw' && $bankId) {
                    // Deduct Money from Selected Admin Bank
                    foreach ($config['banks'] as &$b) {
                        if ($b['id'] == $bankId) {
                            // Calculate Payout Amount
                            $payoutStr = calculateWDAmount($transaction['nominal']); // e.g. "Rp 65.000"
                            $payoutVal = (int) str_replace(['Rp ', '.'], '', $payoutStr);
                            $b['balance'] = ($b['balance'] ?? 0) - $payoutVal;
                            break;
                        }
                    }
                }

                saveConfig($config);
            }
        }

        if (updateTransactionStatus($invoice, $status, $reason, $admin)) {
            $message = "Transaction $invoice updated to $status!";
        } else {
            $message = "Failed to update transaction.";
        }
    }

    // 8. Handle Edit Transaction
    if (isset($_POST['edit_transaction']) && hasPermission('transactions')) {
        $invoice = $_POST['invoice'];

        // Check Status for Permission (Restrict editing DONE/REJECTED)
        $tempQueue = getQueue();
        $canEdit = true;
        foreach ($tempQueue as $t) {
            if ($t['invoice'] === $invoice) {
                if (($t['status'] === 'DONE' || $t['status'] === 'REJECTED') && !hasPermission('edit_final')) {
                    $canEdit = false;
                }
                break;
            }
        }

        if (!$canEdit) {
            $message = "Error: Hanya Super Admin yang bisa mengubah data transaksi yang sudah selesai/ditolak!";
        } else {
            // Sanitize nominal (remove dots)
            $raw_nominal = str_replace('.', '', $_POST['nominal']);

            $newData = [
                'nickname' => $_POST['nickname'],
                'nominal' => $raw_nominal,
                'bank_name' => $_POST['bank_name'] ?? '',
                'account_number' => $_POST['account_number'] ?? '',
                'account_name' => $_POST['account_name'] ?? '',
                'sender_name' => $_POST['sender_name'] ?? ''
            ];
            $admin = $_SESSION['admin_username'];

            if (editTransaction($invoice, $newData, $admin)) {
                $message = "Transaction $invoice updated successfully!";
            } else {
                $message = "Failed to update transaction.";
            }
        }
    }

    // Refresh data
    $config = getConfig();
    $users = getUsers();
}

// --- Filter Transactions ---
$queue = getQueue();
$filter_status = $_GET['status'] ?? 'PENDING'; // Default to PENDING
$filter_type = $_GET['type'] ?? 'ALL';
$filter_bank = $_GET['filter_bank'] ?? '';
$filter_date = $_GET['date'] ?? '';
$filter_search = $_GET['search'] ?? '';

// --- CALCULATE DAILY STATS & PERFORMANCE ---
$today_str = date('Y-m-d');
$daily_topup_total = 0;
$daily_wd_b = 0;
$daily_wd_m = 0;
$daily_wd_count = 0;
$daily_bank_balances = [];
$admin_performance = [];

foreach ($queue as $item) {
    $item_date = date('Y-m-d', $item['timestamp']);

    // 1. Daily Financial Summary (Only DONE transactions)
    if ($item_date === $today_str && $item['status'] === 'DONE') {
        if ($item['type'] === 'topup') {
            $nominal = (int) ($item['nominal'] ?? 0);
            $daily_topup_total += $nominal;

            // Calculate Bank Balance (In)
            $pm = $item['payment_method'] ?? 'Unknown';
            $parts = explode('-', $pm);
            $bank_name = trim($parts[0]);
            if (!empty($bank_name)) {
                if (!isset($daily_bank_balances[$bank_name])) {
                    $daily_bank_balances[$bank_name] = ['in' => 0, 'out' => 0];
                }
                $daily_bank_balances[$bank_name]['in'] += $nominal;
            }

        } elseif ($item['type'] === 'withdraw') {
            $nominal_str = strtoupper($item['nominal'] ?? '');

            // Parse B part
            if (preg_match('/(\d+(?:\.\d+)?)B/', $nominal_str, $matches)) {
                $daily_wd_b += (float) $matches[1];
            }

            // Parse M part
            if (preg_match('/(\d+(?:\.\d+)?)M/', $nominal_str, $matches)) {
                $daily_wd_m += (float) $matches[1];
            }

            $daily_wd_count++;

            // Calculate Bank Balance (Out) - Need to know which bank paid!
            // Currently, withdraw transactions don't store the "Paid From Bank" explicitly in a separate field
            // But the user asked to add this feature. For now, we can't calculate 'out' per bank accurately
            // until we implement the "Select Bank" feature in Withdraw Approval.
            // However, if we assume the 'bank_name' in the transaction is the destination (User's bank),
            // that doesn't help us know which Admin Bank was used.
            // So for now, 'out' will be 0 until we update the Withdraw logic.
        }
    }

    // 2. Admin Performance (Based on processed_by and processed_at)
    if (isset($item['processed_by']) && isset($item['processed_at'])) {
        $proc_date = date('Y-m-d', $item['processed_at']);
        if ($proc_date === $today_str) {
            $admin = $item['processed_by'];
            if (!isset($admin_performance[$admin])) {
                $admin_performance[$admin] = ['topup' => 0, 'withdraw' => 0, 'rejected' => 0, 'total' => 0];
            }

            $admin_performance[$admin]['total']++;

            if ($item['status'] === 'REJECTED') {
                $admin_performance[$admin]['rejected']++;
            } else {
                $admin_performance[$admin][$item['type']]++;
            }
        }
    }
}

$filtered_queue = array_filter($queue, function ($item) use ($filter_status, $filter_type, $filter_date, $filter_search, $filter_bank) {
    // Filter Status
    if ($filter_status !== 'ALL' && $item['status'] !== $filter_status) {
        return false;
    }
    // Filter Type
    if ($filter_type !== 'ALL' && $item['type'] !== $filter_type) {
        return false;
    }
    // Filter Date
    if (!empty($filter_date)) {
        $item_date = date('Y-m-d', $item['timestamp']);
        if ($item_date !== $filter_date) {
            return false;
        }
    }
    // Filter Search (Invoice)
    if (!empty($filter_search)) {
        if (stripos($item['invoice'], $filter_search) === false) {
            return false;
        }
    }
    // Filter Bank
    if (!empty($filter_bank)) {
        if ($item['type'] === 'topup') {
            // For Top Up, check payment_method
            if (stripos($item['payment_method'] ?? '', $filter_bank) === false) {
                return false;
            }
        } elseif ($item['type'] === 'withdraw') {
            // For Withdraw, check bank_name
        }
    }
    // Filter Time Range
    $start_time = $_GET['start_time'] ?? '';
    $end_time = $_GET['end_time'] ?? '';
    if (!empty($start_time) || !empty($end_time)) {
        $item_time = date('H:i', $item['timestamp']);
        if (!empty($start_time) && $item_time < $start_time)
            return false;
        if (!empty($end_time) && $item_time > $end_time)
            return false;
    }

    return true;
});

// Sort by timestamp descending (newest first)
usort($filtered_queue, function ($a, $b) {
    return $b['timestamp'] - $a['timestamp'];
});

// Get Attendance Logs
$attendance_logs = getAttendance();

// Count Edits for Performance
foreach ($attendance_logs as $log) {
    // Log format: ['timestamp' => ..., 'username' => ..., 'type' => ..., 'details' => ...]
    $log_date = date('Y-m-d', $log['timestamp']);
    if ($log_date === $today_str && $log['type'] === 'EDIT_DATA') {
        $adm = $log['username'];
        if (!isset($admin_performance[$adm])) {
            $admin_performance[$adm] = ['topup' => 0, 'withdraw' => 0, 'rejected' => 0, 'total' => 0, 'edited' => 0];
        }
        if (!isset($admin_performance[$adm]['edited'])) {
            $admin_performance[$adm]['edited'] = 0;
        }
        $admin_performance[$adm]['edited']++;
    }
}

// Split for Tabs
$queue_topup = array_filter($filtered_queue, fn($i) => $i['type'] === 'topup');
$queue_withdraw = array_filter($filtered_queue, fn($i) => $i['type'] === 'withdraw');

?>
<script>
    const attendanceLogs = <?= json_encode($attendance_logs) ?>;
</script>
<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Royal Aqua</title>
    <link rel="stylesheet" href="style.css?v=<?= time() ?>">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }

        .admin-user {
            font-size: 14px;
            color: #FFD700;
        }

        /* Override body flex centering from style.css */
        body {
            display: block !important;
            height: auto !important;
            overflow-y: auto !important;
            padding-left: 80px !important;
            /* Space for sidebar */
            padding-right: 20px !important;
            /* Right padding for balance */
            padding-top: 20px !important;
            box-sizing: border-box;
        }

        .logout-btn {
            background: rgba(255, 0, 0, 0.2);
            border: 1px solid red;
            padding: 5px 15px;
            border-radius: 5px;
            color: white;
            text-decoration: none;
            font-size: 12px;
        }

        .dashboard-grid {
            display: block;
            padding-left: 80px;
            /* Space for Mini Sidebar */
        }

        .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            width: 60px;
            background: rgba(16, 20, 35, 0.98);
            border-right: 1px solid rgba(255, 215, 0, 0.1);
            padding: 20px 10px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .sidebar-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            margin-bottom: 15px;
            background: transparent;
            border: none;
            color: #aaa;
            cursor: pointer;
            border-radius: 8px;
            transition: 0.3s;
            position: relative;
        }

        .sidebar-btn.active,
        .sidebar-btn:hover {
            background: rgba(255, 215, 0, 0.1);
            color: #FFD700;
        }

        .sidebar-btn i {
            font-size: 18px;
        }

        .sidebar-btn span {
            display: none;
            /* Hide text completely */
        }

        /* Tooltip */
        .sidebar-btn::after {
            content: attr(title);
            position: absolute;
            left: 50px;
            background: #333;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: 0.2s;
            visibility: hidden;
            z-index: 1001;
            box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
        }

        .sidebar-btn:hover::after {
            opacity: 1;
            visibility: visible;
            left: 55px;
        }

        .content-area {}

        .content-section {
            display: none;
        }

        .content-section.active {
            display: block;
        }

        .card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .card h3 {
            margin-top: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 10px;
            margin-bottom: 15px;
            text-align: left;
        }

        .table-responsive {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        th,
        td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 14px;
        }

        th {
            color: #FFD700;
        }

        .action-btn {
            padding: 5px 10px;
            border-radius: 5px;
            border: none;
            cursor: pointer;
            color: white;
            font-size: 12px;
        }

        .btn-red {
            background: #f44336;
        }

        .btn-green {
            background: #4CAF50;
        }

        .btn-blue {
            background: #2196F3;
        }

        .btn-orange {
            background: #FF9800;
        }

        .filter-bar {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .filter-bar select,
        .filter-bar input {
            padding: 8px;
            border-radius: 5px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(0, 0, 0, 0.3);
            color: white;
        }

        .filter-btn {
            padding: 8px 15px;
            background: var(--secondary-color);
            border: none;
            border-radius: 5px;
            color: #000;
            font-weight: bold;
            cursor: pointer;
        }

        .perm-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 15px;
        }

        .perm-item {
            background: rgba(0, 0, 0, 0.2);
            padding: 8px;
            border-radius: 5px;
        }

        @media (max-width: 768px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }

            .sidebar {
                display: flex;
                overflow-x: auto;
                padding: 10px;
                gap: 10px;
            }

            .sidebar-btn {
                width: auto;
                white-space: nowrap;
                margin-bottom: 0;
            }
        }
    </style>
</head>

<body>
    <div
        style="background: #f44336; color: white; padding: 15px; text-align: center; font-weight: bold; position: fixed; top: 0; left: 0; width: 100%; z-index: 99999; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
        ⚠️ ANDA SEDANG MENGAKSES VERSI LAMA (PHP/MAMP) ⚠️<br>
        Versi ini sudah tidak digunakan. Silakan akses Admin Panel Baru di sini:<br>
        <a href="http://localhost:3000/admin/dashboard"
            style="color: #FFD700; text-decoration: underline; font-size: 18px; display: inline-block; margin-top: 5px;">👉
            KLIK DISINI UNTUK KE ADMIN PANEL BARU (LOCALHOST:3000) 👈</a>
    </div>
    <div style="margin-top: 80px;"> <!-- Spacer for banner -->
        <!-- Sidebar (Moved Outside) -->
        <!-- Sidebar (Fixed Icon Only) -->
        <div class="sidebar">
            <div
                style="text-align: center; padding: 10px 0; font-size: 20px; color: #FFD700; font-weight: bold; margin-bottom: 20px;">
                👑
            </div>

            <?php if (hasPermission('transactions')): ?>
                <button class="sidebar-btn visible active" onclick="showSection('transactions')" title="Transaksi">
                    <i>📝</i>
                </button>
            <?php endif; ?>

            <?php if (hasPermission('banks')): ?>
                <button class="sidebar-btn visible" onclick="showSection('banks')" title="Bank & Payment">
                    <i>🏦</i>
                </button>
            <?php endif; ?>

            <?php if (hasPermission('idwd')): ?>
                <button class="sidebar-btn visible" onclick="showSection('idwd')" title="ID WD & Contacts">
                    <i>🆔</i>
                </button>
            <?php endif; ?>

            <?php if (hasPermission('neo')): ?>
                <button class="sidebar-btn visible" onclick="showSection('neo')" title="Neo Party">
                    <i>🎮</i>
                </button>
            <?php endif; ?>

            <?php if (hasPermission('users')): ?>
                <button class="sidebar-btn visible" onclick="showSection('users')" title="Manage Admins">
                    <i>👥</i>
                </button>
                <button class="sidebar-btn visible" onclick="showSection('attendance')" title="Absensi">
                    <i>🕒</i>
                </button>
            <?php endif; ?>

            <?php if (hasPermission('settings')): ?>
                <button class="sidebar-btn visible" onclick="showSection('settings')" title="Settings">
                    <i>⚙️</i>
                </button>
            <?php endif; ?>

            <!-- Spacer to push logout to bottom -->
            <div style="flex-grow: 1;"></div>

            <a href="admin.php?logout=true" class="sidebar-btn visible" title="Logout"
                style="color: #f44336; margin-top: 10px;">
                <i>🚪</i>
            </a>
        </div>

        <div class="container" style="max-width: 1200px;">
            <div class="glass-panel">
                <div class="admin-header">
                    <div>
                        <h2><i class="fas fa-crown"></i> Admin Panel</h2>
                        <div class="admin-user">Logged in as:
                            <strong><?= htmlspecialchars($_SESSION['admin_username']) ?></strong>
                        </div>
                    </div>
                    <a href="admin.php?logout=true" class="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>

                <?php if ($message): ?>
                    <div class="status-result status-done" style="margin-bottom: 20px;"><?= $message ?></div>
                <?php endif; ?>

                <div class="dashboard-grid">


                    <!-- Content -->
                    <div class="content-area">
                        <!-- DEBUG: Remove after fixing -->
                        <div
                            style="background: #333; color: #0f0; padding: 10px; margin-bottom: 20px; font-family: monospace;">
                            <strong>DEBUG INFO:</strong><br>
                            Role: <?= $_SESSION['admin_role'] ?? 'N/A' ?><br>
                            Permissions: <?= json_encode($_SESSION['admin_permissions'] ?? []) ?><br>
                            Has 'banks'?: <?= hasPermission('banks') ? 'YES' : 'NO' ?>
                        </div>

                        <!-- 0. Transactions Section -->
                        <?php if (hasPermission('transactions')): ?>
                            <div id="transactions" class="content-section active">

                                <!-- Compact Dashboard Header -->
                                <div class="card" style="margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.2);">
                                    <div
                                        style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">

                                        <!-- Col 1: Daily Stats -->
                                        <div style="border-right: 1px solid rgba(255,255,255,0.1); padding-right: 15px;">
                                            <h5
                                                style="margin: 0 0 10px 0; color: #aaa; text-transform: uppercase; font-size: 12px;">
                                                HARI INI</h5>
                                            <div
                                                style="display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center;">
                                                <span style="color: #4CAF50; font-weight: bold;"><i
                                                        class="fas fa-arrow-down"></i> Top Up</span>
                                                <span style="font-size: 18px; font-weight: bold; color: white;">Rp
                                                    <?= number_format($daily_topup_total, 0, ',', '.') ?></span>
                                            </div>
                                            <div
                                                style="display: flex; justify-content: space-between; align-items: center;">
                                                <span style="color: #FFD700; font-weight: bold;"><i
                                                        class="fas fa-arrow-up"></i>
                                                    Withdraw</span>
                                                <span style="font-size: 18px; font-weight: bold; color: white;">
                                                    <?php
                                                    $wd_display = [];
                                                    if ($daily_wd_b > 0)
                                                        $wd_display[] = $daily_wd_b . 'B';
                                                    if ($daily_wd_m > 0)
                                                        $wd_display[] = $daily_wd_m . 'M';
                                                    echo empty($wd_display) ? "0" : implode(' ', $wd_display);
                                                    ?>
                                                </span>
                                            </div>
                                        </div>

                                        <!-- Col 2: Bank Balances -->
                                        <div style="border-right: 1px solid rgba(255,255,255,0.1); padding-right: 15px;">
                                            <h5
                                                style="margin: 0 0 10px 0; color: #aaa; text-transform: uppercase; font-size: 12px;">
                                                SALDO BANK</h5>
                                            <div style="max-height: 80px; overflow-y: auto; font-size: 13px;">
                                                <?php foreach ($config['banks'] as $bank):
                                                    if (!$bank['is_active'])
                                                        continue;
                                                    ?>
                                                    <div
                                                        style="display: flex; justify-content: space-between; margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 2px;">
                                                        <span style="color: #ddd;"><?= htmlspecialchars($bank['name']) ?></span>
                                                        <span style="color: #FFD700; font-weight: bold;">Rp
                                                            <?= number_format($bank['balance'] ?? 0, 0, ',', '.') ?></span>
                                                    </div>
                                                <?php endforeach; ?>
                                            </div>
                                        </div>

                                        <!-- Col 3: Admin Chip Stocks -->
                                        <div>
                                            <h5
                                                style="margin: 0 0 10px 0; color: #aaa; text-transform: uppercase; font-size: 12px;">
                                                STOK CHIP ADMIN</h5>
                                            <div style="max-height: 80px; overflow-y: auto; font-size: 13px;">
                                                <?php foreach ($config['admin_game_ids'] ?? [] as $gid):
                                                    $usage = $gid['usage'] ?? 'mixed';
                                                    $color = ($usage == 'topup') ? '#4CAF50' : (($usage == 'withdraw') ? '#f44336' : '#FFD700');

                                                    // Format Balance
                                                    $bal = floatval($gid['balance']);
                                                    $b_part = floor($bal);
                                                    $m_part = round(($bal - $b_part) * 1000);
                                                    $balDisplay = $b_part . 'B';
                                                    if ($m_part > 0)
                                                        $balDisplay .= ' ' . $m_part . 'M';
                                                    ?>
                                                    <div
                                                        style="display: flex; justify-content: space-between; margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 2px;">
                                                        <span
                                                            style="color: <?= $color ?>;"><?= htmlspecialchars($gid['name']) ?></span>
                                                        <span style="color: white; font-weight: bold;"><?= $balDisplay ?></span>
                                                    </div>
                                                <?php endforeach; ?>
                                            </div>
                                        </div>

                                    </div>
                                    <!-- Filter Section -->
                                    <div class="card">
                                        <div
                                            style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                            <h3 style="margin:0;"><i class="fas fa-filter"></i> Filter Transaksi</h3>
                                            <button type="button" class="action-btn btn-blue" onclick="toggleFilter()">
                                                <i class="fas fa-chevron-down"></i> Toggle Filter
                                            </button>
                                        </div>
                                        <div id="filterSection" style="display: none;">
                                            <form method="GET" class="filter-bar">
                                                <select name="status">
                                                    <option value="ALL" <?= $filter_status == 'ALL' ? 'selected' : '' ?>>Semua
                                                        Status
                                                    </option>
                                                    <option value="PENDING" <?= $filter_status == 'PENDING' ? 'selected' : '' ?>>
                                                        Pending
                                                    </option>
                                                    <option value="DONE" <?= $filter_status == 'DONE' ? 'selected' : '' ?>>Done
                                                    </option>
                                                    <option value="REJECTED" <?= $filter_status == 'REJECTED' ? 'selected' : '' ?>>
                                                        Rejected
                                                    </option>
                                                </select>
                                                <select name="type">
                                                    <option value="ALL" <?= $filter_type == 'ALL' ? 'selected' : '' ?>>Semua
                                                        Tipe
                                                    </option>
                                                    <option value="topup" <?= $filter_type == 'topup' ? 'selected' : '' ?>>Top
                                                        Up
                                                    </option>
                                                    <option value="withdraw" <?= $filter_type == 'withdraw' ? 'selected' : '' ?>>
                                                        Withdraw
                                                    </option>
                                                </select>
                                                <input type="text" name="search" placeholder="Cari Invoice..."
                                                    value="<?= htmlspecialchars($filter_search) ?>">

                                                <select name="filter_bank">
                                                    <option value="">Semua Bank</option>
                                                    <?php foreach ($config['banks'] as $bank): ?>
                                                        <option value="<?= $bank['name'] ?>" <?= ($filter_bank ?? '') == $bank['name'] ? 'selected' : '' ?>><?= $bank['name'] ?>
                                                        </option>
                                                    <?php endforeach; ?>
                                                </select>

                                                <input type="date" name="date"
                                                    value="<?= htmlspecialchars($filter_date) ?>">
                                                <input type="time" name="start_time"
                                                    value="<?= htmlspecialchars($_GET['start_time'] ?? '') ?>"
                                                    title="Jam Mulai">
                                                <input type="time" name="end_time"
                                                    value="<?= htmlspecialchars($_GET['end_time'] ?? '') ?>"
                                                    title="Jam Selesai">
                                                <button type="submit" class="filter-btn">Cari</button>
                                            </form>
                                        </div>
                                        <script>
                                            function toggleFilter() {
                                                var x = document.getElementById("filterSection");
                                                if (x.style.display === "none") {
                                                    x.style.display = "block";
                                                } else {
                                                    x.style.display = "none";
                                                }
                                            }
                                        </script>
                                    </div>

                                    <script>
                                        function rejectTransaction(invoice) {
                                            Swal.fire({
                                                title: 'Tolak Transaksi?',
                                                text: "Pilih alasan penolakan:",
                                                input: 'select',
                                                inputOptions: {
                                                    'Penipu': 'Penipu',
                                                    'Data Tidak Sesuai': 'Data Tidak Sesuai'
                                                },
                                                inputPlaceholder: 'Pilih alasan...',
                                                showCancelButton: true,
                                                confirmButtonColor: '#d33',
                                                cancelButtonColor: '#3085d6',
                                                confirmButtonText: 'Ya, Tolak!',
                                                cancelButtonText: 'Batal',
                                                inputValidator: (value) => {
                                                    if (!value) {
                                                        return 'Anda harus memilih alasan!'
                                                    }
                                                }
                                            }).then((result) => {
                                                if (result.isConfirmed) {
                                                    document.getElementById('reason-' + invoice).value = result.value;
                                                    document.getElementById('reject-form-' + invoice).submit();
                                                }
                                            })
                                        }
                                    </script>

                                    <div class="card">
                                        <div
                                            style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                                            <h3><i class="fas fa-list"></i> Data Transaksi</h3>
                                            <div style="display:flex; gap:10px;">
                                                <button onclick="switchTab('topup')" id="btn-topup"
                                                    class="action-btn btn-green"
                                                    style="font-size:14px; padding:8px 15px;">Top Up</button>
                                                <button onclick="switchTab('withdraw')" id="btn-withdraw" class="action-btn"
                                                    style="background:#444; font-size:14px; padding:8px 15px;">Withdraw</button>
                                            </div>
                                        </div>

                                        <!-- TOP UP TABLE -->
                                        <div id="tab-topup" class="table-responsive">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Waktu</th>
                                                        <th>Invoice</th>
                                                        <th>User Info</th>
                                                        <th>Bank Tujuan</th>
                                                        <th>Nominal</th>
                                                        <th>Status</th>
                                                        <th>Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <?php if (empty($queue_topup)): ?>
                                                        <tr>
                                                            <td colspan="7" style="text-align:center;">Tidak ada data Top Up.
                                                            </td>
                                                        </tr>
                                                    <?php else: ?>
                                                        <?php foreach ($queue_topup as $item): ?>
                                                            <tr>
                                                                <td><?= date('d/m H:i', $item['timestamp']) ?></td>
                                                                <td><small><?= htmlspecialchars($item['invoice']) ?></small></td>
                                                                <td>
                                                                    ID: <?= htmlspecialchars($item['id_game']) ?><br>
                                                                    Nick: <?= htmlspecialchars($item['nickname'] ?? '-') ?><br>
                                                                    <small>Sender:
                                                                        <?= htmlspecialchars($item['sender_name'] ?? '-') ?></small>
                                                                </td>
                                                                <td>
                                                                    <!-- Extract Bank Name from Payment Method -->
                                                                    <?php
                                                                    $pm = $item['payment_method'] ?? '-';
                                                                    $parts = explode('-', $pm);
                                                                    echo '<span style="color:#4CAF50; font-weight:bold;">' . htmlspecialchars(trim($parts[0])) . '</span>';
                                                                    if (isset($parts[1]))
                                                                        echo '<br><small>' . htmlspecialchars(trim($parts[1])) . '</small>';
                                                                    ?>
                                                                </td>
                                                                <td>
                                                                    Rp <?= number_format($item['nominal'] ?? 0, 0, ',', '.') ?>
                                                                    <br>
                                                                    <small style="color: #4CAF50; font-weight:bold;">
                                                                        <?= calculateChipAmount($item['nominal'] ?? 0) ?>
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <?php
                                                                    $status = $item['status'] ?? 'UNKNOWN';
                                                                    $statusClass = ($status == 'DONE') ? 'status-done' : (($status == 'REJECTED') ? 'status-rejected' : 'status-pending');
                                                                    ?>
                                                                    <span class="<?= $statusClass ?>"
                                                                        style="padding: 2px 8px; border-radius: 4px; font-size: 10px; display:inline-block; min-width:50px; text-align:center;">
                                                                        <?= $status ?>
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <?php if ($status == 'PENDING'): ?>
                                                                        <button type="button"
                                                                            onclick="openProcessModal('<?= $item['invoice'] ?>', 'topup', '<?= $item['nominal'] ?>')"
                                                                            class="action-btn btn-green" title="Terima"><i
                                                                                class="fas fa-check"></i></button>
                                                                        <form method="POST" style="margin-top:5px;"
                                                                            id="reject-form-<?= $item['invoice'] ?>">
                                                                            <input type="hidden" name="invoice"
                                                                                value="<?= $item['invoice'] ?>">
                                                                            <input type="hidden" name="status" value="REJECTED">
                                                                            <input type="hidden" name="reason"
                                                                                id="reason-<?= $item['invoice'] ?>">
                                                                            <button type="button"
                                                                                onclick="rejectTransaction('<?= $item['invoice'] ?>')"
                                                                                class="action-btn btn-red" title="Tolak"><i
                                                                                    class="fas fa-times"></i></button>
                                                                        </form>
                                                                    <?php endif; ?>
                                                                    <button type="button"
                                                                        onclick='openEditModal(<?= json_encode($item) ?>)'
                                                                        class="action-btn btn-blue" title="Edit"
                                                                        style="margin-top:5px;"><i class="fas fa-edit"></i></button>
                                                                </td>
                                                            </tr>
                                                        <?php endforeach; ?>
                                                    <?php endif; ?>
                                                </tbody>
                                            </table>
                                        </div>

                                        <!-- WITHDRAW TABLE -->
                                        <div id="tab-withdraw" class="table-responsive" style="display:none;">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Waktu</th>
                                                        <th>Invoice</th>
                                                        <th>User Info</th>
                                                        <th>Bank User</th>
                                                        <th>Nominal</th>
                                                        <th>Status</th>
                                                        <th>Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <?php if (empty($queue_withdraw)): ?>
                                                        <tr>
                                                            <td colspan="7" style="text-align:center;">Tidak ada data Withdraw.
                                                            </td>
                                                        </tr>
                                                    <?php else: ?>
                                                        <?php foreach ($queue_withdraw as $item): ?>
                                                            <tr>
                                                                <td><?= date('d/m H:i', $item['timestamp']) ?></td>
                                                                <td><small><?= htmlspecialchars($item['invoice']) ?></small></td>
                                                                <td>
                                                                    ID: <?= htmlspecialchars($item['id_game']) ?><br>
                                                                    Nick: <?= htmlspecialchars($item['nickname'] ?? '-') ?>
                                                                </td>
                                                                <td>
                                                                    <small>
                                                                        Bank: <?= htmlspecialchars($item['bank_name'] ?? '-') ?><br>
                                                                        Rek:
                                                                        <?= htmlspecialchars($item['account_number'] ?? '-') ?><br>
                                                                        A.N: <?= htmlspecialchars($item['account_name'] ?? '-') ?>
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <?= htmlspecialchars($item['nominal'] ?? '-') ?>
                                                                    <br>
                                                                    <small style="color: #FF5722; font-weight:bold;">
                                                                        Bayar: <?= calculateWDAmount($item['nominal'] ?? '0') ?>
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <?php
                                                                    $status = $item['status'] ?? 'UNKNOWN';
                                                                    $statusClass = ($status == 'DONE') ? 'status-done' : (($status == 'REJECTED') ? 'status-rejected' : 'status-pending');
                                                                    ?>
                                                                    <span class="<?= $statusClass ?>"
                                                                        style="padding: 2px 8px; border-radius: 4px; font-size: 10px; display:inline-block; min-width:50px; text-align:center;">
                                                                        <?= $status ?>
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <?php if ($status == 'PENDING'): ?>
                                                                        <form method="POST" style="display:flex; gap:5px;">
                                                                            <input type="hidden" name="invoice"
                                                                                value="<?= $item['invoice'] ?>">
                                                                            <button type="submit" name="update_status" value="DONE"
                                                                                class="action-btn btn-green" title="Terima"><i
                                                                                    class="fas fa-check"></i></button>
                                                                            <input type="hidden" name="status" value="DONE">
                                                                        </form>
                                                                        <form method="POST" style="margin-top:5px;"
                                                                            id="reject-form-<?= $item['invoice'] ?>">
                                                                            <input type="hidden" name="invoice"
                                                                                value="<?= $item['invoice'] ?>">
                                                                            <input type="hidden" name="status" value="REJECTED">
                                                                            <input type="hidden" name="reason"
                                                                                id="reason-<?= $item['invoice'] ?>">
                                                                            <button type="button"
                                                                                onclick="rejectTransaction('<?= $item['invoice'] ?>')"
                                                                                class="action-btn btn-red" title="Tolak"><i
                                                                                    class="fas fa-times"></i></button>
                                                                        </form>
                                                                    <?php endif; ?>
                                                                    <button type="button"
                                                                        onclick='openEditModal(<?= json_encode($item) ?>)'
                                                                        class="action-btn btn-blue" title="Edit"
                                                                        style="margin-top:5px;"><i class="fas fa-edit"></i></button>
                                                                </td>
                                                            </tr>
                                                        <?php endforeach; ?>
                                                    <?php endif; ?>
                                                </tbody>
                                            </table>
                                        </div>

                                        <!-- Removed local script -->
                                    </div>
                                </div>
                            <?php endif; ?>

                            <!-- 1. Banks Section -->
                            <?php if (hasPermission('banks')): ?>
                                <div id="banks" class="content-section">
                                    <div class="card">
                                        <h3><i class="fas fa-plus-circle"></i> Tambah Bank</h3>
                                        <form method="POST">
                                            <div class="form-group">
                                                <input type="text" name="bank_name" placeholder="Nama Bank (BCA, DANA, dll)"
                                                    required>
                                            </div>
                                            <div class="form-group">
                                                <input type="text" name="bank_number" placeholder="Nomor Rekening" required>
                                            </div>
                                            <div class="form-group">
                                                <input type="text" name="bank_holder" placeholder="Atas Nama" required>
                                            </div>
                                            <button type="submit" name="add_bank" class="submit-btn">Tambah</button>
                                        </form>
                                    </div>

                                    <div class="card">
                                        <h3><i class="fas fa-list"></i> Daftar Bank</h3>
                                        <div class="table-responsive">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Bank</th>
                                                        <th>No. Rek</th>
                                                        <th>A.N</th>
                                                        <th>Status</th>
                                                        <th>Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <?php foreach ($config['banks'] as $bank): ?>
                                                        <tr>
                                                            <td><?= htmlspecialchars($bank['name']) ?></td>
                                                            <td><?= htmlspecialchars($bank['number']) ?></td>
                                                            <td><?= htmlspecialchars($bank['holder']) ?></td>
                                                            <td>
                                                                <span
                                                                    class="<?= $bank['is_active'] ? 'status-done' : 'status-rejected' ?>"
                                                                    style="padding: 2px 8px; border-radius: 4px; font-size: 10px;">
                                                                    <?= $bank['is_active'] ? 'Active' : 'Inactive' ?>
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <form method="POST" style="display:inline;">
                                                                    <input type="hidden" name="bank_id"
                                                                        value="<?= $bank['id'] ?>">
                                                                    <button type="submit" name="toggle_bank"
                                                                        class="action-btn btn-blue" title="Toggle Active"><i
                                                                            class="fas fa-sync"></i></button>
                                                                    <button type="submit" name="delete_bank"
                                                                        class="action-btn btn-red" title="Delete"
                                                                        onclick="return confirm('Hapus bank ini?')"><i
                                                                            class="fas fa-trash"></i></button>
                                                                </form>
                                                            </td>
                                                        </tr>
                                                    <?php endforeach; ?>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            <?php endif; ?>

                            <!-- 2. ID WD & Contacts -->
                            <?php if (hasPermission('idwd')): ?>
                                <div id="idwd" class="content-section">
                                    <!-- Manage Admin Game IDs -->
                                    <div class="card">
                                        <h3><i class="fas fa-gamepad"></i> Manage Admin Game IDs (Chip Stock)</h3>

                                        <!-- Add New Game ID -->
                                        <form method="POST" style="margin-bottom: 20px; display: flex; gap: 10px;">
                                            <input type="text" name="game_id_name" placeholder="Nama ID (e.g. Bebek, Ayam)"
                                                required
                                                style="flex: 1; padding: 10px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white;">
                                            <button type="submit" name="add_game_id" class="submit-btn"
                                                style="width: auto;">Tambah
                                                ID</button>
                                        </form>

                                        <!-- List Game IDs -->
                                        <div class="table-responsive">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Nama ID</th>
                                                        <th>Fungsi Utama</th>
                                                        <th>Stok Chip (B)</th>
                                                        <th>Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <?php
                                                    $admin_game_ids = $config['admin_game_ids'] ?? [];
                                                    if (empty($admin_game_ids)):
                                                        ?>
                                                        <tr>
                                                            <td colspan="4" style="text-align:center;">Belum ada ID Admin.</td>
                                                        </tr>
                                                    <?php else: ?>
                                                        <?php foreach ($admin_game_ids as $gid): ?>
                                                            <tr>
                                                                <td><?= htmlspecialchars($gid['name']) ?></td>
                                                                <td>
                                                                    <form method="POST" style="display:inline;">
                                                                        <input type="hidden" name="game_id_id"
                                                                            value="<?= $gid['id'] ?>">
                                                                        <select name="new_usage" onchange="this.form.submit()"
                                                                            style="padding: 5px; border-radius: 4px; background: #222; color: white; border: 1px solid #444;">
                                                                            <option value="mixed" <?= ($gid['usage'] ?? '') == 'mixed' ? 'selected' : '' ?>>Campuran</option>
                                                                            <option value="topup" <?= ($gid['usage'] ?? '') == 'topup' ? 'selected' : '' ?>>Khusus Top Up</option>
                                                                            <option value="withdraw" <?= ($gid['usage'] ?? '') == 'withdraw' ? 'selected' : '' ?>>Khusus Withdraw
                                                                            </option>
                                                                        </select>
                                                                        <input type="hidden" name="update_game_usage" value="1">
                                                                    </form>
                                                                </td>
                                                                <td>
                                                                    <?php
                                                                    // Format Balance for Display (e.g. 1.53 -> 1B 530M)
                                                                    $bal = floatval($gid['balance']);
                                                                    $b_part = floor($bal);
                                                                    $m_part = round(($bal - $b_part) * 1000);
                                                                    ?>
                                                                    <div
                                                                        style="margin-bottom: 5px; font-weight: bold; color: #FFD700;">
                                                                        <?= $b_part ?> B <?= $m_part > 0 ? $m_part . ' M' : '' ?>
                                                                    </div>

                                                                    <form method="POST"
                                                                        style="display: flex; gap: 5px; align-items: center;">
                                                                        <input type="hidden" name="game_id_id"
                                                                            value="<?= $gid['id'] ?>">
                                                                        <input type="number" step="any" name="new_balance_b"
                                                                            value="<?= $b_part ?>" placeholder="B"
                                                                            style="width: 60px; padding: 5px; border-radius: 4px; border: 1px solid #444; background: #222; color: #FFD700;"
                                                                            title="Billions">
                                                                        <span style="color: #aaa;">B</span>
                                                                        <input type="number" step="any" name="new_balance_m"
                                                                            value="<?= $m_part ?>" placeholder="M"
                                                                            style="width: 60px; padding: 5px; border-radius: 4px; border: 1px solid #444; background: #222; color: #FFD700;"
                                                                            title="Millions">
                                                                        <span style="color: #aaa;">M</span>
                                                                        <button type="submit" name="update_game_balance"
                                                                            class="action-btn btn-green" title="Update Saldo"><i
                                                                                class="fas fa-save"></i></button>
                                                                    </form>
                                                                </td>
                                                                <td>
                                                                    <form method="POST" onsubmit="return confirm('Hapus ID ini?');">
                                                                        <input type="hidden" name="game_id_id"
                                                                            value="<?= $gid['id'] ?>">
                                                                        <button type="submit" name="delete_game_id"
                                                                            class="action-btn btn-red" title="Hapus"><i
                                                                                class="fas fa-trash"></i></button>
                                                                    </form>
                                                                </td>
                                                            </tr>
                                                        <?php endforeach; ?>
                                                    <?php endif; ?>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div class="card">
                                        <h3><i class="fas fa-id-card"></i> ID Withdraw</h3>
                                        <form method="POST">
                                            <div class="form-group">
                                                <label>ID Value</label>
                                                <input type="text" name="id_wd_value"
                                                    value="<?= htmlspecialchars($config['id_wd']['value']) ?>">
                                            </div>
                                            <div class="form-group">
                                                <label>Nickname</label>
                                                <input type="text" name="id_wd_nickname"
                                                    value="<?= htmlspecialchars($config['id_wd']['nickname']) ?>">
                                            </div>
                                            <div class="form-group">
                                                <label>
                                                    <input type="checkbox" name="id_wd_active" style="width:auto;"
                                                        <?= $config['id_wd']['is_active'] ? 'checked' : '' ?>> Tampilkan di
                                                    Web
                                                </label>
                                            </div>
                                            <button type="submit" name="update_id_wd" class="submit-btn">Simpan ID
                                                WD</button>
                                        </form>
                                    </div>

                                    <div class="card">
                                        <h3><i class="fas fa-address-book"></i> Kontak Admin</h3>
                                        <form method="POST">
                                            <div class="form-group">
                                                <label>WhatsApp Number (628xxx)</label>
                                                <input type="text" name="wa_number"
                                                    value="<?= htmlspecialchars($config['contacts']['whatsapp']['number']) ?>">
                                            </div>
                                            <div class="form-group">
                                                <label>
                                                    <input type="checkbox" name="wa_active" style="width:auto;"
                                                        <?= $config['contacts']['whatsapp']['is_active'] ? 'checked' : '' ?>>
                                                    Aktifkan Tombol WA
                                                </label>
                                            </div>
                                            <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">
                                            <div class="form-group">
                                                <label>Telegram Username (tanpa @)</label>
                                                <input type="text" name="tg_username"
                                                    value="<?= htmlspecialchars($config['contacts']['telegram']['username']) ?>">
                                            </div>
                                            <div class="form-group">
                                                <label>
                                                    <input type="checkbox" name="tg_active" style="width:auto;"
                                                        <?= $config['contacts']['telegram']['is_active'] ? 'checked' : '' ?>>
                                                    Aktifkan Tombol TG
                                                </label>
                                            </div>
                                            <button type="submit" name="update_contacts" class="submit-btn">Simpan
                                                Kontak</button>
                                        </form>
                                    </div>
                                </div>
                            <?php endif; ?>

                            <!-- 3. Neo Party -->
                            <?php if (hasPermission('neo')): ?>
                                <div id="neo" class="content-section">
                                    <div class="card">
                                        <h3><i class="fas fa-gamepad"></i> Neo Party Links</h3>
                                        <form method="POST">
                                            <div class="form-group"><label>Top Up URL</label><input type="text"
                                                    name="neo_topup"
                                                    value="<?= htmlspecialchars($config['neo_party']['topup_url']) ?>">
                                            </div>
                                            <div class="form-group"><label>Withdraw URL</label><input type="text"
                                                    name="neo_withdraw"
                                                    value="<?= htmlspecialchars($config['neo_party']['withdraw_url']) ?>">
                                            </div>
                                            <div class="form-group"><label>Neo URL</label><input type="text" name="neo_neo"
                                                    value="<?= htmlspecialchars($config['neo_party']['neo_url']) ?>"></div>
                                            <div class="form-group"><label>Register URL</label><input type="text"
                                                    name="neo_register"
                                                    value="<?= htmlspecialchars($config['neo_party']['register_url']) ?>">
                                            </div>
                                            <div class="form-group">
                                                <label>
                                                    <input type="checkbox" name="neo_active" style="width:auto;"
                                                        <?= $config['neo_party']['is_active'] ? 'checked' : '' ?>> Tampilkan
                                                    Tab
                                                    Neo
                                                    Party
                                                </label>
                                            </div>
                                            <button type="submit" name="update_neo" class="submit-btn">Simpan Neo
                                                Party</button>
                                        </form>
                                    </div>
                                </div>
                            <?php endif; ?>

                            <!-- 4. User Management -->
                            <?php if (hasPermission('users')): ?>
                                <div id="users" class="content-section">
                                    <div class="card">
                                        <h3><i class="fas fa-user-plus"></i> Tambah Admin Baru</h3>
                                        <form method="POST">
                                            <div class="form-group">
                                                <input type="text" name="new_username" placeholder="Username Baru" required>
                                            </div>
                                            <div class="form-group">
                                                <input type="password" name="new_password" placeholder="Password Baru"
                                                    required>
                                            </div>
                                            <div class="form-group">
                                                <label>Hak Akses:</label>
                                                <div class="perm-grid">
                                                    <div class="perm-item"><input type="checkbox" name="permissions[]"
                                                            value="transactions" checked> Transaksi</div>
                                                    <div class="perm-item"><input type="checkbox" name="permissions[]"
                                                            value="banks">
                                                        Bank &
                                                        Payment</div>
                                                    <div class="perm-item"><input type="checkbox" name="permissions[]"
                                                            value="idwd">
                                                        ID WD & Contacts</div>
                                                    <div class="perm-item"><input type="checkbox" name="permissions[]"
                                                            value="neo">
                                                        Neo Party</div>
                                                    <div class="perm-item"><input type="checkbox" name="permissions[]"
                                                            value="settings">
                                                        Settings</div>
                                                    <div class="perm-item"><input type="checkbox" name="permissions[]"
                                                            value="users">
                                                        Manage
                                                        Admins</div>
                                                </div>
                                            </div>
                                            <button type="submit" name="add_user" class="submit-btn">Tambah User</button>
                                        </form>
                                    </div>

                                    <div class="card">
                                        <h3><i class="fas fa-users-cog"></i> Daftar Admin</h3>
                                        <div class="table-responsive">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Username</th>
                                                        <th>Role</th>
                                                        <th>Status</th>
                                                        <th>Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <?php foreach ($users as $u): ?>
                                                        <tr>
                                                            <td><?= htmlspecialchars($u['username']) ?></td>
                                                            <td><?= htmlspecialchars($u['role']) ?></td>
                                                            <td>
                                                                <?php if ($u['is_locked'] ?? false): ?>
                                                                    <span class="status-rejected"
                                                                        style="padding:2px 5px; border-radius:3px; font-size:10px;">LOCKED</span>
                                                                <?php else: ?>
                                                                    <span class="status-done"
                                                                        style="padding:2px 5px; border-radius:3px; font-size:10px;">ACTIVE</span>
                                                                <?php endif; ?>
                                                            </td>
                                                            <td>
                                                                <?php if ($u['username'] !== 'admin' && $u['username'] !== $_SESSION['admin_username']): ?>
                                                                    <form method="POST" style="display:inline;">
                                                                        <input type="hidden" name="user_id" value="<?= $u['id'] ?>">

                                                                        <!-- Lock/Unlock Button -->
                                                                        <button type="submit" name="toggle_lock"
                                                                            class="action-btn btn-orange"
                                                                            title="<?= ($u['is_locked'] ?? false) ? 'Unlock' : 'Lock' ?>">
                                                                            <i
                                                                                class="fas <?= ($u['is_locked'] ?? false) ? 'fa-lock-open' : 'fa-lock' ?>"></i>
                                                                        </button>

                                                                        <button type="submit" name="delete_user"
                                                                            class="action-btn btn-red"
                                                                            onclick="return confirm('Hapus user ini?')"><i
                                                                                class="fas fa-trash"></i></button>
                                                                    </form>
                                                                <?php else: ?>
                                                                    <small style="color:#aaa;">(Protected)</small>
                                                                <?php endif; ?>
                                                            </td>
                                                        </tr>
                                                    <?php endforeach; ?>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <!-- 5. Attendance Log & Performance -->
                                <div id="attendance" class="content-section">
                                    <!-- Performance Table -->
                                    <div class="card">
                                        <h3><i class="fas fa-chart-line"></i> Kinerja Admin Hari Ini (<?= date('d/m/Y') ?>)
                                        </h3>
                                        <div class="table-responsive">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Admin</th>
                                                        <th>Top Up (Done)</th>
                                                        <th>Withdraw (Done)</th>
                                                        <th>Rejected</th>
                                                        <th>Edited</th>
                                                        <th>Total Proses</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <?php if (empty($admin_performance)): ?>
                                                        <tr>
                                                            <td colspan="6" style="text-align:center;">Belum ada transaksi
                                                                diproses
                                                                hari
                                                                ini.</td>
                                                        </tr>
                                                    <?php else: ?>
                                                        <?php foreach ($admin_performance as $adm => $stats): ?>
                                                            <tr>
                                                                <td><strong><?= htmlspecialchars($adm) ?></strong></td>
                                                                <td style="color:#4CAF50;"><?= $stats['topup'] ?></td>
                                                                <td style="color:#FFD700;"><?= $stats['withdraw'] ?></td>
                                                                <td>
                                                                    <?php if ($stats['rejected'] > 0): ?>
                                                                        <a href="javascript:void(0)"
                                                                            onclick="showAttendanceDetails('<?= $adm ?>', 'rejected')"
                                                                            style="color:#f44336; text-decoration:underline; font-weight:bold;">
                                                                            <?= $stats['rejected'] ?>
                                                                        </a>
                                                                    <?php else: ?>
                                                                        <span style="color:#f44336;">0</span>
                                                                    <?php endif; ?>
                                                                </td>
                                                                <td>
                                                                    <?php if (($stats['edited'] ?? 0) > 0): ?>
                                                                        <a href="javascript:void(0)"
                                                                            onclick="showAttendanceDetails('<?= $adm ?>', 'edited')"
                                                                            style="color:#2196F3; text-decoration:underline; font-weight:bold;">
                                                                            <?= $stats['edited'] ?? 0 ?>
                                                                        </a>
                                                                    <?php else: ?>
                                                                        <span style="color:#2196F3;">0</span>
                                                                    <?php endif; ?>
                                                                </td>
                                                                <td><strong><?= $stats['total'] ?></strong></td>
                                                            </tr>
                                                        <?php endforeach; ?>
                                                    <?php endif; ?>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div class="card">
                                        <h3><i class="fas fa-history"></i> Riwayat Absensi (1000 Terakhir)</h3>
                                        <div class="table-responsive">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Waktu</th>
                                                        <th>Username</th>
                                                        <th>Aktivitas</th>
                                                        <th>IP Address</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <?php foreach ($attendance_logs as $log): ?>
                                                        <tr>
                                                            <td><?= date('d/m/Y H:i:s', $log['timestamp']) ?></td>
                                                            <td><?= htmlspecialchars($log['username']) ?></td>
                                                            <td>
                                                                <span
                                                                    style="color: <?= $log['type'] == 'login' ? '#4CAF50' : '#f44336' ?>; font-weight:bold;">
                                                                    <?= strtoupper($log['type']) ?>
                                                                </span>
                                                            </td>
                                                            <td><?= htmlspecialchars($log['ip']) ?></td>
                                                        </tr>
                                                    <?php endforeach; ?>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            <?php endif; ?>

                            <!-- 6. Settings -->
                            <?php if (hasPermission('settings')): ?>
                                <div id="settings" class="content-section">
                                    <div class="card">
                                        <h3><i class="fas fa-cogs"></i> System Settings</h3>
                                        <form method="POST">
                                            <div class="form-group">
                                                <label>Telegram Bot Token</label>
                                                <input type="text" name="bot_token"
                                                    value="<?= htmlspecialchars($config['telegram_bot_token']) ?>">
                                            </div>
                                            <div class="form-group">
                                                <label>Telegram Chat ID</label>
                                                <input type="text" name="chat_id"
                                                    value="<?= htmlspecialchars($config['telegram_chat_id']) ?>">
                                            </div>
                                            <div class="form-group">
                                                <label>QRIS Image URL</label>
                                                <input type="text" name="qris_url"
                                                    value="<?= htmlspecialchars($config['qris_image_url']) ?>">
                                            </div>
                                            <button type="submit" name="update_settings" class="submit-btn">Simpan
                                                Settings</button>
                                        </form>
                                    </div>
                                </div>
                            <?php endif; ?>

                        </div>
                    </div>
                </div>
            </div>

            <!-- Edit Modal -->
            <div id="editModal" class="modal-overlay" style="display: none;">
                <div class="modal-content" style="max-width: 500px;">
                    <h2>Edit Transaksi</h2>
                    <form method="POST">
                        <input type="hidden" name="edit_transaction" value="1">
                        <input type="hidden" name="invoice" id="edit_invoice">

                        <div class="form-group">
                            <label>Nickname</label>
                            <input type="text" name="nickname" id="edit_nickname" required>
                        </div>

                        <div class="form-group">
                            <label>Nominal</label>
                            <input type="text" name="nominal" id="edit_nominal" required onkeyup="formatRupiah(this)">
                        </div>

                        <!-- Fields for Withdraw -->
                        <div id="edit_wd_fields" style="display:none;">
                            <div class="form-group">
                                <label>Bank</label>
                                <input type="text" name="bank_name" id="edit_bank_name">
                            </div>
                            <div class="form-group">
                                <label>No. Rekening</label>
                                <input type="text" name="account_number" id="edit_account_number">
                            </div>
                            <div class="form-group">
                                <label>Atas Nama</label>
                                <input type="text" name="account_name" id="edit_account_name">
                            </div>
                        </div>

                        <!-- Fields for Top Up -->
                        <div id="edit_topup_fields" style="display:none;">
                            <div class="form-group">
                                <label>Pengirim</label>
                                <input type="text" name="sender_name" id="edit_sender_name">
                            </div>
                        </div>

                        <div style="display:flex; gap:10px; margin-top:20px;">
                            <button type="button" onclick="document.getElementById('editModal').style.display='none'"
                                class="action-btn btn-red" style="flex:1;">Batal</button>
                            <button type="submit" class="action-btn btn-green" style="flex:1;">Simpan Perubahan</button>
                        </div>
                    </form>
                </div>
                <div id="attendanceModal" class="modal">
                    <div class="modal-content" style="max-width: 600px;">
                        <span class="close" onclick="closeAttendanceModal()">&times;</span>
                        <h2 id="attModalTitle">Detail Absensi</h2>
                        <div id="attModalContent" style="max-height: 400px; overflow-y: auto;">
                            <!-- List will go here -->
                        </div>
                    </div>
                </div>

                <script>
                    function showAttendanceDetails(admin, type) {
                        const modal = document.getElementById('attendanceModal');
                        const title = document.getElementById('attModalTitle');
                        const content = document.getElementById('attModalContent');

                        let actionFilter = '';
                        let titleText = '';

                        if (type === 'rejected') {
                            actionFilter = 'REJECT_TRANSACTION';
                            titleText = `Riwayat Reject oleh ${admin}`;
                        } else if (type === 'edited') {
                            actionFilter = 'EDIT_DATA';
                            titleText = `Riwayat Edit oleh ${admin}`;
                        }

                        title.innerText = titleText;
                        content.innerHTML = '';

                        // Filter logs
                        // Log structure: Object {username, type, timestamp, details}
                        // Sort by newest first
                        const filtered = attendanceLogs.filter(log => {
                            return log.username === admin && log.type === actionFilter;
                        }).sort((a, b) => b.timestamp - a.timestamp);

                        if (filtered.length === 0) {
                            content.innerHTML = '<p style="text-align:center;">Tidak ada data.</p>';
                        } else {
                            const list = document.createElement('ul');
                            list.style.listStyle = 'none';
                            list.style.padding = '0';

                            filtered.forEach(log => {
                                const date = new Date(log.timestamp * 1000).toLocaleString('id-ID');
                                const details = log.details || '-';
                                const li = document.createElement('li');
                                li.style.background = 'rgba(255,255,255,0.05)';
                                li.style.padding = '10px';
                                li.style.marginBottom = '5px';
                                li.style.borderRadius = '5px';
                                li.innerHTML = `
                        <small style="color:#888;">${date}</small><br>
                        ${details}
                    `;
                                list.appendChild(li);
                            });
                            content.appendChild(list);
                        }

                        modal.style.display = 'block';
                    }

                    function closeAttendanceModal() {
                        document.getElementById('attendanceModal').style.display = 'none';
                    }
                </script>

                <div id="toast-container"></div>
                <audio id="notif-sound" src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
                    preload="auto"></audio>

                <style>
                    #toast-container {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 9999;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .toast {
                        background: rgba(16, 20, 35, 0.95);
                        border: 1px solid var(--secondary-color);
                        border-left: 5px solid var(--secondary-color);
                        color: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
                        min-width: 300px;
                        transform: translateX(120%);
                        transition: transform 0.3s ease-out;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        opacity: 0;
                        /* Start hidden */
                    }

                    .toast.show {
                        transform: translateX(0);
                        opacity: 1;
                        /* Fade in */
                    }

                    .toast-icon {
                        font-size: 24px;
                        color: var(--secondary-color);
                    }

                    .toast-content h4 {
                        margin: 0 0 5px 0;
                        color: var(--secondary-color);
                        font-size: 16px;
                    }

                    .toast-content p {
                        margin: 0;
                        font-size: 14px;
                        color: #ddd;
                    }
                </style>

                <script>
                    // Global Error Handler
                    window.onerror = function (msg, url, line) {
                        alert("JS Error: " + msg + "\nLine: " + line);
                    };

                    function switchTab(tab) {
                        console.log('Switching tab to:', tab);
                        const tabTopup = document.getElementById('tab-topup');
                        const tabWithdraw = document.getElementById('tab-withdraw');
                        const btnTopup = document.getElementById('btn-topup');
                        const btnWithdraw = document.getElementById('btn-withdraw');

                        if (tabTopup && tabWithdraw && btnTopup && btnWithdraw) {
                            tabTopup.style.display = (tab === 'topup') ? 'block' : 'none';
                            tabWithdraw.style.display = (tab === 'withdraw') ? 'block' : 'none';

                            btnTopup.style.background = (tab === 'topup') ? '#4CAF50' : '#444';
                            btnWithdraw.style.background = (tab === 'withdraw') ? '#FFD700' : '#444';
                            btnWithdraw.style.color = (tab === 'withdraw') ? '#000' : '#fff';
                        } else {
                            console.error('Tab elements not found!');
                        }
                    }

                    function openEditModal(item) {
                        document.getElementById('editModal').style.display = 'flex';
                        document.getElementById('edit_invoice').value = item.invoice;
                        document.getElementById('edit_nickname').value = item.nickname;
                        document.getElementById('edit_nominal').value = item.nominal;

                        if (item.type === 'withdraw') {
                            document.getElementById('edit_wd_fields').style.display = 'block';
                            document.getElementById('edit_topup_fields').style.display = 'none';
                            document.getElementById('edit_bank_name').value = item.bank_name || '';
                            document.getElementById('edit_account_number').value = item.account_number || '';
                            document.getElementById('edit_account_name').value = item.account_name || '';
                        } else {
                            document.getElementById('edit_wd_fields').style.display = 'none';
                            document.getElementById('edit_topup_fields').style.display = 'block';
                            document.getElementById('edit_sender_name').value = item.sender_name || '';
                        }
                    }

                    function showSection(sectionId) {
                        console.log('Switching to section:', sectionId);

                        // Hide all sections
                        const sections = document.querySelectorAll('.content-section');
                        sections.forEach(el => {
                            el.style.display = 'none';
                            el.classList.remove('active');
                        });

                        // Deactivate all buttons
                        document.querySelectorAll('.sidebar-btn').forEach(el => el.classList.remove('active'));

                        // Show selected section
                        const section = document.getElementById(sectionId);
                        if (section) {
                            section.style.setProperty('display', 'block', 'important');
                            section.classList.add('active');
                            console.log('Section found:', sectionId, 'Content length:', section.innerHTML.length);
                        } else {
                            console.error('Section not found:', sectionId);
                            alert('DEBUG ERROR: Section not found: ' + sectionId + '. Please contact developer.');
                        }
                        // Highlight button
                        const btns = document.querySelectorAll('.sidebar-btn');
                        btns.forEach(btn => {
                            // Check if the button's onclick contains the sectionId
                            const onclickVal = btn.getAttribute('onclick');
                            if (onclickVal && onclickVal.includes("'" + sectionId + "'")) {
                                btn.classList.add('active');
                            }
                        });
                    }

                    function formatRupiah(input) {
                        let number_string = input.value.replace(/[^,\d]/g, '').toString();
                        let split = number_string.split(',');
                        let sisa = split[0].length % 3;
                        let rupiah = split[0].substr(0, sisa);
                        let ribuan = split[0].substr(sisa).match(/\d{3}/gi);

                        if (ribuan) {
                            let separator = sisa ? '.' : '';
                            rupiah += separator + ribuan.join('.');
                        }

                        rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
                        input.value = rupiah;
                    }

                    // Auto select first visible button
                    document.addEventListener('DOMContentLoaded', function () {
                        const firstBtn = document.querySelector('.sidebar-btn.visible');
                        if (firstBtn) {
                            firstBtn.click();
                        }

                        // Start Polling
                        startPolling();
                    });

                    // --- Notification Logic ---
                    const notificationMap = new Map(); // Stores invoice -> lastNotificationTime
                    const REMINDER_INTERVAL = 20000; // 20 seconds

                    function startPolling() {
                        setInterval(checkPendingTransactions, 5000); // Check every 5 seconds
                    }

                    async function checkPendingTransactions() {
                        try {
                            const response = await fetch('check_new.php?t=' + Date.now());
                            const data = await response.json();

                            if (data.status === 'success') {
                                const currentPendingInvoices = new Set();
                                const now = Date.now();

                                data.pending_transactions.forEach(tx => {
                                    currentPendingInvoices.add(tx.invoice);

                                    if (!notificationMap.has(tx.invoice)) {
                                        // NEW Transaction
                                        showToast(tx, 'Baru');
                                        playNotificationSound();
                                        notificationMap.set(tx.invoice, now);
                                    } else {
                                        // Existing Transaction - Check for Reminder
                                        const lastTime = notificationMap.get(tx.invoice);
                                        if (now - lastTime >= REMINDER_INTERVAL) {
                                            showToast(tx, 'Reminder');
                                            playNotificationSound();
                                            notificationMap.set(tx.invoice, now);
                                        }
                                    }
                                });

                                // Cleanup: Remove processed transactions from map
                                for (const [invoice] of notificationMap) {
                                    if (!currentPendingInvoices.has(invoice)) {
                                        notificationMap.delete(invoice);
                                    }
                                }
                            }
                        } catch (error) {
                            console.error('Polling error:', error);
                        }
                    }

                    function playNotificationSound() {
                        const audio = document.getElementById('notif-sound');
                        // Reset audio to start to allow rapid replay
                        audio.currentTime = 0;
                        audio.play().catch(e => console.log("Audio play failed:", e));
                    }

                    function showToast(tx, type) {
                        const container = document.getElementById('toast-container');
                        const toast = document.createElement('div');
                        toast.className = 'toast';

                        const icon = tx.type === 'topup' ? 'fa-arrow-circle-up' : 'fa-arrow-circle-down';
                        let title = tx.type === 'topup' ? 'Top Up' : 'Withdraw';

                        if (type === 'Reminder') {
                            title = '⏳ ' + title + ' (Menunggu)';
                        } else {
                            title = '🔔 New ' + title + '!';
                        }

                        const color = tx.type === 'topup' ? '#4CAF50' : '#FFD700';

                        toast.style.borderLeftColor = color;

                        toast.innerHTML = `
                <div class="toast-icon"><i class="fas ${icon}" style="color:${color}"></i></div>
                <div class="toast-content">
                    <h4 style="color:${color}">${title}</h4>
                    <p>Invoice: <strong>${tx.invoice}</strong></p>
                    <p>Nick: ${tx.nickname}</p>
                </div>
            `;

                        container.appendChild(toast);

                        // Trigger animation
                        setTimeout(() => toast.classList.add('show'), 100);

                        // Remove after 5 seconds
                        setTimeout(() => {
                            toast.classList.remove('show');
                            setTimeout(() => toast.remove(), 300);
                        }, 5000);
                    }
                </script>
                <!-- Process Transaction Modal -->
                <div id="processModal" class="modal">
                    <div class="modal-content">
                        <span class="close" onclick="closeProcessModal()">&times;</span>
                        <h2>Proses Transaksi</h2>
                        <p id="processInvoiceDisplay" style="color: #FFD700; font-weight: bold;"></p>

                        <form method="POST" id="processForm">
                            <input type="hidden" name="invoice" id="processInvoice">
                            <input type="hidden" name="status" value="DONE">
                            <input type="hidden" name="update_status" value="DONE">

                            <!-- Select Admin Game ID -->
                            <div class="form-group">
                                <label id="gameIdLabel">Pilih ID Admin (Sumber Chip)</label>
                                <select name="admin_game_id" required
                                    style="width: 100%; padding: 10px; border-radius: 5px; background: #333; color: white; border: 1px solid #555;">
                                    <option value="">-- Pilih ID --</option>
                                    <?php foreach ($config['admin_game_ids'] ?? [] as $gid):
                                        $usage = $gid['usage'] ?? 'mixed';
                                        $usageLabel = ($usage == 'topup') ? '[TOP UP]' : (($usage == 'withdraw') ? '[WD]' : '');
                                        ?>
                                        <option value="<?= $gid['id'] ?>"><?= $usageLabel ?>
                                            <?= htmlspecialchars($gid['name']) ?>
                                            (Stok:
                                            <?= $gid['balance'] ?>B)
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <!-- Select Admin Bank (Only for Withdraw) -->
                            <div class="form-group" id="adminBankGroup" style="display: none;">
                                <label>Pilih Bank Admin (Sumber Dana)</label>
                                <select name="admin_bank_id" id="adminBankSelect"
                                    style="width: 100%; padding: 10px; border-radius: 5px; background: #333; color: white; border: 1px solid #555;">
                                    <option value="">-- Pilih Bank --</option>
                                    <?php foreach ($config['banks'] ?? [] as $bank): ?>
                                        <?php if ($bank['is_active']): ?>
                                            <option value="<?= $bank['id'] ?>"><?= htmlspecialchars($bank['name']) ?> -
                                                <?= htmlspecialchars($bank['number']) ?> (Saldo:
                                                <?= number_format($bank['balance'] ?? 0) ?>)
                                            </option>
                                        <?php endif; ?>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div style="margin-top: 20px; text-align: right;">
                                <button type="button" onclick="closeProcessModal()"
                                    class="action-btn btn-red">Batal</button>
                                <button type="submit" class="action-btn btn-green">Proses Selesai</button>
                            </div>
                        </form>
                    </div>
                </div>

                <script>
                    // ... existing scripts ...

                    function openProcessModal(invoice, type, nominal) {
                        document.getElementById('processModal').style.display = 'block';
                        document.getElementById('processInvoice').value = invoice;
                        document.getElementById('processInvoiceDisplay').innerText = invoice + ' (' + type.toUpperCase() + ')';

                        const gameIdLabel = document.getElementById('gameIdLabel');
                        const adminBankGroup = document.getElementById('adminBankGroup');
                        const adminBankSelect = document.getElementById('adminBankSelect');

                        if (type === 'topup') {
                            gameIdLabel.innerText = "Pilih ID Admin (Kurangi Stok Chip)";
                            adminBankGroup.style.display = 'none';
                            adminBankSelect.required = false;
                        } else {
                            gameIdLabel.innerText = "Pilih ID Admin (Tambah Stok Chip)";
                            adminBankGroup.style.display = 'block';
                            adminBankSelect.required = true;
                        }
                    }

                    function closeProcessModal() {
                        document.getElementById('processModal').style.display = 'none';
                    }

                    // Close modal when clicking outside
                    window.onclick = function (event) {
                        const modal = document.getElementById('processModal');
                        if (event.target == modal) {
                            modal.style.display = "none";
                        }
                        // Also handle attendance modal
                        const attModal = document.getElementById('attendanceModal');
                        if (event.target == attModal) {
                            attModal.style.display = "none";
                        }
                        // Also handle edit modal
                        const editModal = document.getElementById('editModal');
                        if (event.target == editModal) {
                            editModal.style.display = "none";
                        }
                    }
                </script>
            </div> <!-- End Spacer -->
</body>

</html>