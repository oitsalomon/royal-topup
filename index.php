<?php
require_once 'functions.php';
$config = getConfig();
$banks = $config['banks'] ?? [];
$id_wd = $config['id_wd'] ?? ['value' => '-', 'nickname' => '', 'is_active' => false];
$qris_url = $config['qris_image_url'] ?? '';
$contacts = $config['contacts'] ?? [];
$neo_party = $config['neo_party'] ?? ['is_active' => false];
?>
<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Royal Aqua - Top Up & Withdraw</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>

<body>
    <div class="container">
        <div class="glass-panel">
            <h1><i class="fas fa-crown"></i> Royal Aqua</h1>

            <!-- Info Panel -->
            <div class="info-grid">
                <!-- Banks hidden, will show on select -->


            </div>

            <!-- Tabs -->
            <div class="tabs">
                <button class="tab-btn active" onclick="showTab('topup')">Top Up</button>
                <button class="tab-btn" onclick="showTab('withdraw')">Withdraw</button>
                <button class="tab-btn" onclick="showTab('status')">Cek Status</button>
                <?php if ($neo_party['is_active']): ?>
                    <button class="tab-btn" onclick="showTab('neo')">Neo Party</button>
                <?php endif; ?>
            </div>

            <!-- Top Up Form -->
            <div id="topup" class="form-section active">
                <form action="submit.php" method="POST">
                    <input type="hidden" name="type" value="topup">

                    <div class="form-group">
                        <label>WhatsApp Number</label>
                        <input type="text" name="wa" required placeholder="08xxx">
                    </div>

                    <div class="form-group">
                        <label>ID Game</label>
                        <input type="text" name="id_game" required placeholder="123456">
                    </div>

                    <div class="form-group">
                        <label>Nickname</label>
                        <input type="text" name="nickname" required placeholder="RoyalPlayer">
                    </div>

                    <div class="form-group">
                        <label>Nominal Top Up</label>
                        <input type="text" name="nominal" id="nominal" required placeholder="Contoh: 10000"
                            onkeyup="formatRupiah(this); calculateChipJS(this.value)">
                        <small id="chipEstimate"
                            style="color: #FFD700; display: block; margin-top: 5px; font-weight: bold;"></small>
                    </div>

                    <div class="form-group">
                        <label>Nama Rekening Pengirim</label>
                        <input type="text" name="sender_name" required placeholder="A.N Pengirim">
                    </div>

                    <div class="form-group">
                        <label>Pembayaran Ke</label>
                        <select name="admin_bank" id="bankSelect" required onchange="showBankDetails()">
                            <option value="" disabled selected>--- PILIH BANK TUJUAN ---</option>
                            <?php foreach ($banks as $bank): ?>
                                <?php if ($bank['is_active']): ?>
                                    <option
                                        value="<?= htmlspecialchars($bank['name']) ?> - <?= htmlspecialchars($bank['number']) ?>"
                                        data-name="<?= htmlspecialchars($bank['name']) ?>"
                                        data-number="<?= htmlspecialchars($bank['number']) ?>"
                                        data-holder="<?= htmlspecialchars($bank['holder']) ?>">
                                        <?= htmlspecialchars($bank['name']) ?>
                                    </option>
                                <?php endif; ?>
                            <?php endforeach; ?>
                            <option value="QRIS" data-name="QRIS" data-number="" data-holder="">QRIS</option>
                        </select>

                        <!-- Dynamic Bank Details -->
                        <div id="bankDetails"
                            style="margin-top: 15px; display: none; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);">
                            <div style="font-size: 18px; font-weight: bold; color: #FFD700;" id="detailName">BANK</div>
                            <div style="font-size: 24px; font-weight: bold; margin: 5px 0; letter-spacing: 1px;"
                                id="detailNumber">00000000</div>
                            <div style="font-size: 14px; opacity: 0.8;" id="detailHolder">A.N ADMIN</div>
                            <button type="button" onclick="copyToClipboard()"
                                style="margin-top: 10px; padding: 5px 15px; background: rgba(255,255,255,0.2); border: none; border-radius: 5px; color: white; cursor: pointer;">
                                <i class="fas fa-copy"></i> Salin No. Rek
                            </button>
                        </div>
                    </div>

                    <div class="form-group" id="qrisDisplay" style="text-align: center; display: none;">
                        <img src="<?= htmlspecialchars($qris_url) ?>" alt="QRIS"
                            style="max-width: 200px; border-radius: 10px;">
                    </div>

                    <button type="submit" class="submit-btn">Kirim Top Up</button>
                </form>
            </div>

            <!-- Withdraw Form -->
            <div id="withdraw" class="form-section">
                <form action="submit.php" method="POST">
                    <input type="hidden" name="type" value="withdraw">

                    <div class="form-group">
                        <label>ID Game</label>
                        <input type="text" name="id_game" required>
                    </div>

                    <div class="form-group">
                        <label>Nickname</label>
                        <input type="text" name="nickname" required>
                    </div>

                    <div class="form-group">
                        <label>Nominal Withdraw</label>
                        <div style="display: flex; gap: 10px;">
                            <div style="flex: 1;">
                                <div class="input-group" style="display: flex; align-items: center;">
                                    <input type="number" name="wd_b" id="wd_b" placeholder="0"
                                        style="border-top-right-radius: 0; border-bottom-right-radius: 0;"
                                        oninput="calculateWDEstimate()">
                                    <span
                                        style="background: var(--secondary-color); color: #000; padding: 12px 15px; border-top-right-radius: 8px; border-bottom-right-radius: 8px; font-weight: bold;">B</span>
                                </div>
                            </div>
                            <div style="flex: 1;">
                                <div class="input-group" style="display: flex; align-items: center;">
                                    <input type="number" name="wd_m" id="wd_m" placeholder="0"
                                        style="border-top-right-radius: 0; border-bottom-right-radius: 0;"
                                        oninput="calculateWDEstimate()">
                                    <span
                                        style="background: #4CAF50; color: #fff; padding: 12px 15px; border-top-right-radius: 8px; border-bottom-right-radius: 8px; font-weight: bold;">M</span>
                                </div>
                            </div>
                        </div>
                        <small id="wdEstimate"
                            style="color: #4CAF50; display: block; margin-top: 5px; font-weight: bold;"></small>
                    </div>

                    <div class="form-group">
                        <label>Bank Penerima</label>
                        <input type="text" name="user_bank" required placeholder="BCA">
                    </div>

                    <div class="form-group">
                        <label>Nomor Rekening</label>
                        <input type="text" name="account_number" required>
                    </div>

                    <div class="form-group">
                        <label>Nama Pemilik Rekening</label>
                        <input type="text" name="account_name" required>
                    </div>

                    <button type="submit" class="submit-btn">Kirim Withdraw</button>
                </form>
            </div>

            <!-- Status Check -->
            <div id="status" class="form-section">
                <form id="statusForm" onsubmit="checkStatus(event)">
                    <div class="form-group">
                        <label>Masukkan ID Game</label>
                        <input type="text" id="check_id_game" required>
                    </div>
                    <button type="submit" class="submit-btn">Cek Status</button>
                </form>
                <div id="statusResult" class="status-result" style="display: none;"></div>
            </div>

            <!-- Neo Party Tab -->
            <?php if ($neo_party['is_active']): ?>
                <div id="neo" class="form-section">
                    <div class="neo-grid">
                        <a href="<?= htmlspecialchars($neo_party['topup_url']) ?>" target="_blank" class="neo-btn">
                            <i class="fas fa-coins"></i>
                            <span>TOP UP</span>
                        </a>
                        <a href="<?= htmlspecialchars($neo_party['withdraw_url']) ?>" target="_blank" class="neo-btn">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>WITHDRAW</span>
                        </a>
                        <a href="<?= htmlspecialchars($neo_party['neo_url']) ?>" target="_blank" class="neo-btn">
                            <i class="fas fa-gamepad"></i>
                            <span>NEO</span>
                        </a>
                        <a href="<?= htmlspecialchars($neo_party['register_url']) ?>" target="_blank" class="neo-btn">
                            <i class="fas fa-user-plus"></i>
                            <span>REGISTER</span>
                        </a>
                    </div>
                </div>
            <?php endif; ?>

        </div>
    </div>

    <!-- Admin Contacts -->
    <div class="contact-float">
        <?php if (($contacts['whatsapp']['is_active'] ?? false)): ?>
            <a href="https://wa.me/<?= htmlspecialchars($contacts['whatsapp']['number']) ?>" target="_blank"
                class="contact-btn wa-btn">
                <i class="fab fa-whatsapp"></i>
            </a>
        <?php endif; ?>

        <?php if (($contacts['telegram']['is_active'] ?? false)): ?>
            <a href="https://t.me/<?= htmlspecialchars($contacts['telegram']['username']) ?>" target="_blank"
                class="contact-btn tg-btn">
                <i class="fab fa-telegram-plane"></i>
            </a>
        <?php endif; ?>
    </div>

    <!-- Confirmation Modal -->
    <div id="confirmModal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
            <h2 id="modalTitle">Konfirmasi Pembayaran</h2>
            <div id="modalBody">
                <!-- Dynamic Content -->
            </div>
            <div class="timer-box">
                Sisa Waktu: <span id="timerDisplay">60</span> detik
            </div>
            <div class="modal-actions">
                <button onclick="closeModal()" class="cancel-btn">Batal</button>
                <button onclick="submitRealForm()" class="confirm-btn" id="confirmBtn">Pembayaran Berhasil</button>
            </div>
        </div>
    </div>

    <script>
        let countdown;
        let currentFormId = '';

        function showTab(tabName) {
            document.querySelectorAll('.form-section').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }

        // Intercept Form Submission
        document.addEventListener('DOMContentLoaded', function () {
            document.querySelector('#topup form').addEventListener('submit', function (e) {
                e.preventDefault();
                openModal('topup', this);
            });

            document.querySelector('#withdraw form').addEventListener('submit', function (e) {
                e.preventDefault();
                openModal('withdraw', this);
            });
        });

        function openModal(type, form) {
            currentFormId = form;
            const modal = document.getElementById('confirmModal');
            const modalBody = document.getElementById('modalBody');
            const modalTitle = document.getElementById('modalTitle');

            if (type === 'withdraw') {
                const amount = form.querySelector('[name="amount"]').value;

                // VALIDATION: Must end with B or M
                if (!/[BbMm]$/.test(amount)) {
                    alert("Harap masukkan nominal dengan akhiran B atau M! (Contoh: 10B atau 100M)");
                    return; // Stop process
                }

                const bank = form.querySelector('[name="user_bank"]').value;
                const accNum = form.querySelector('[name="account_number"]').value;
                const accName = form.querySelector('[name="account_name"]').value;
                const idGame = form.querySelector('[name="id_game"]').value;
                const nickname = form.querySelector('[name="nickname"]').value;

                // Get ID WD Config (passed from PHP)
                const idWdValue = "<?= htmlspecialchars($id_wd['value']) ?>";
                const idWdNick = "<?= htmlspecialchars($id_wd['nickname']) ?>";

                modalTitle.innerText = "Konfirmasi Withdraw";
                modalBody.innerHTML = `
                <div class="info-grid" style="grid-template-columns: 1fr;">
                    <div class="info-item">
                        <strong>Detail Withdraw</strong>
                        <p>${amount} ke ${bank} (${accNum})</p>
                        <p>A.N ${accName}</p>
                    </div>
                </div>
                <p>Pastikan data di atas benar.</p>
                <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">
                <p>Silakan kirim Chip ke ID berikut:</p>
                <div class="bank-card" style="text-align:center;">
                    <div class="bank-holder">ID TUJUAN</div>
                    <div class="bank-number" id="detailNumber">${idWdValue}</div>
                    <div class="bank-holder">${idWdNick}</div>
                    <button onclick="navigator.clipboard.writeText('${idWdValue}')" class="copy-btn-small">Salin ID</button>
                </div>
                <p>Silakan kirim Chip ke ID di atas.</p>`;
            } else {
                // Top Up Logic
                const nominalStr = form.querySelector('[name="nominal"]').value;
                // Remove dots for calculation
                const nominal = parseInt(nominalStr.replace(/\./g, ''));

                const bankSelect = document.getElementById('bankSelect');
                const bankName = bankSelect.options[bankSelect.selectedIndex].text;

                const chipEstimate = getChipEstimate(nominal);

                modalTitle.innerText = "Konfirmasi Top Up";
                modalBody.innerHTML = `
                <div class="info-grid" style="grid-template-columns: 1fr;">
                    <div class="info-item">
                        <strong>Detail Top Up</strong>
                        <p>Rp ${nominal.toLocaleString('id-ID')}</p>
                        <p style="color: #FFD700; font-weight: bold;">Dapat: ${chipEstimate}</p>
                        <p>Via ${bankName}</p>
                    </div>
                </div>
                <p>Silakan selesaikan pembayaran Anda.</p>`;
            }

            modal.style.display = 'flex';
            startTimer();
        }

        function startTimer() {
            let timeLeft = 60;
            document.getElementById('timerDisplay').innerText = timeLeft;

            clearInterval(countdown);
            countdown = setInterval(() => {
                timeLeft--;
                document.getElementById('timerDisplay').innerText = timeLeft;

                if (timeLeft <= 0) {
                    clearInterval(countdown);
                    closeModal();
                    alert("Waktu habis! Transaksi dibatalkan.");
                }
            }, 1000);
        }

        function closeModal() {
            document.getElementById('confirmModal').style.display = 'none';
            clearInterval(countdown);
        }

        function submitRealForm() {
            clearInterval(countdown);
            // Submit the stored form
            if (currentFormId) {
                currentFormId.submit();
            }
        }

        async function checkStatus(e) {
            e.preventDefault();
            const idGame = document.getElementById('check_id_game').value.trim();
            const resultDiv = document.getElementById('statusResult');
            resultDiv.style.display = 'block'; // Ensure it's visible

            if (!idGame) {
                resultDiv.innerHTML = '<p style="color: #f44336;">Masukkan ID Game!</p>';
                return;
            }

            try {
                const response = await fetch('check_status.php?id_game=' + idGame + '&t=' + new Date().getTime());
                const data = await response.json();

                if (data.status === 'found') {
                    let html = `<h4 style="margin-bottom:10px;">Riwayat Transaksi (5 Terakhir)</h4>`;
                    html += `<div style="display:flex; flex-direction:column; gap:10px;">`;

                    data.data.forEach(item => {
                        let statusColor = '#ff9800'; // Pending
                        let statusText = 'Pending';
                        if (item.status === 'DONE') {
                            statusColor = '#4CAF50';
                            statusText = 'Berhasil';
                        } else if (item.status === 'REJECTED') {
                            statusColor = '#f44336';
                            statusText = 'Ditolak';
                        }

                        let typeLabel = item.type === 'topup' ? 'Top Up' : 'Withdraw';
                        let typeColor = item.type === 'topup' ? '#2196F3' : '#FF5722';

                        html += `
                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border-left: 4px solid ${statusColor};">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:12px; color:#aaa;">${item.timestamp}</span>
                                <span style="background:${statusColor}; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:bold;">${statusText}</span>
                            </div>
                            <div style="margin-top:5px; font-weight:bold;">
                                <span style="color:${typeColor}; margin-right:5px;">[${typeLabel}]</span>
                                ${item.nominal}
                            </div>
                            ${item.status === 'REJECTED' ? `<div style="font-size:11px; color:#f44336; margin-top:2px;">Alasan: ${item.reject_reason}</div>` : ''}
                        </div>`;
                    });

                    html += `</div>`;
                    resultDiv.innerHTML = html;
                } else {
                    resultDiv.innerHTML = '<p style="color: #f44336;">Data tidak ditemukan.</p>';
                }
            } catch (error) {
                console.error('Error:', error);
                resultDiv.innerHTML = 'Gagal mengecek status.';
            }
        }

        function showBankDetails() {
            const select = document.getElementById('bankSelect');
            const selectedOption = select.options[select.selectedIndex];
            const detailsDiv = document.getElementById('bankDetails');
            const qrisDiv = document.getElementById('qrisDisplay');

            // Reset
            detailsDiv.style.display = 'none';
            qrisDiv.style.display = 'none';

            if (selectedOption.value === "") return;

            if (selectedOption.value === "QRIS") {
                qrisDiv.style.display = 'block';
                return;
            }

            const name = selectedOption.getAttribute('data-name');
            const number = selectedOption.getAttribute('data-number');
            const holder = selectedOption.getAttribute('data-holder');

            document.getElementById('detailName').textContent = name;
            document.getElementById('detailNumber').textContent = number;
            document.getElementById('detailHolder').textContent = holder;

            detailsDiv.style.display = 'block';

            // Add animation
            detailsDiv.style.animation = 'none';
            detailsDiv.offsetHeight; /* trigger reflow */
            detailsDiv.style.animation = 'fadeIn 0.5s ease';
        }

        function copyToClipboard() {
            const number = document.getElementById('detailNumber').textContent;
            navigator.clipboard.writeText(number).then(() => {
                alert('Nomor Rekening Berhasil Disalin!');
            });
        }

        function appendAmount(suffix) {
            const input = document.getElementById('wd_amount');
            let value = input.value;

            // Remove existing B/M/b/m at the end
            value = value.replace(/[BbMm]$/, '');

            // Append new suffix
            input.value = value + suffix;
            input.focus();
        }

        function formatRupiah(input) {
            // Remove non-digits
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

        function onlyNumbers(input) {
            // Remove non-digits (allow empty for deletion)
            // But we must preserve B/M if they were added by button?
            // User request: "karakter tulisan kan harus di pencet" -> User cannot TYPE letters.
            // So if user types "10a", "a" is removed.
            // If user clicks "B", it appends "B".
            // My appendAmount function works programmatically.
            // But if I enforce onlyNumbers on input, it might strip the "B" if I'm not careful.
            // Wait, the user said "nominal mereka hanya bisa mengisi angka".
            // But the field MUST contain B/M at the end.
            // So the logic should be: Allow digits, but if there is a B/M at the end, keep it?
            // Or better: The input field is for NUMBERS ONLY. The B/M is a suffix handled separately?
            // No, the previous requirement was "10B".
            // Let's make it so: User types numbers. If they type a letter, it's removed.
            // BUT, if the letter is B or M, should we allow it?
            // "karakter tulisan kan harus di pencet" -> implies they CANNOT type it.

            // Strategy: Remove all non-digits.
            // BUT, we need to allow B/M if it's already there?
            // Let's check if the last char is B/M, preserve it.

            let val = input.value;
            let suffix = '';
            if (/[BbMm]$/.test(val)) {
                suffix = val.slice(-1);
                val = val.slice(0, -1);
            }

            // Strip non-digits from the numeric part
            val = val.replace(/\D/g, '');

            input.value = val + suffix;
        }

        function getChipEstimate(rupiah) {
            // Helper for flooring to 2 decimals
            const floor2 = (val) => (Math.floor(val * 100) / 100).toFixed(2);

            // Dynamic Tiers
            if (rupiah >= 3150000) { // 50B+
                return floor2(rupiah / 63000) + ' B';
            } else if (rupiah >= 1280000) { // 20B+
                return floor2(rupiah / 64000) + ' B';
            } else if (rupiah >= 645000) { // 10B+
                return floor2(rupiah / 64500) + ' B';
            } else {
                // Fixed Packages
                const map = {
                    10000: '120 M',
                    15000: '170 M',
                    20000: '250 M',
                    25000: '350 M',
                    30000: '400 M',
                    32500: '500 M',
                    35000: '530 M',
                    40000: '600 M',
                    45000: '650 M',
                    50000: '750 M',
                    55000: '800 M',
                    60000: '900 M',
                    65000: '1 B'
                };
                if (map[rupiah]) {
                    return map[rupiah];
                }
            }

            // Default Normal Price (1B = 65.000) for unlisted amounts
            if (rupiah > 0) {
                return floor2(rupiah / 65000) + ' B';
            }
            return "";
        }

        function calculateWDEstimate() {
            const b = parseFloat(document.getElementById('wd_b').value) || 0;
            const m = parseFloat(document.getElementById('wd_m').value) || 0;

            if (b === 0 && m === 0) {
                document.getElementById('wdEstimate').innerText = "";
                return 0;
            }

            let totalB = b + (m / 1000);
            let estimate = 0;

            if (totalB < 1) {
                // Fixed Map for < 1B (using M)
                const totalM = (b * 1000) + m;
                const map = {
                    100: 5000,
                    200: 10000,
                    300: 15000,
                    400: 20000,
                    500: 25000,
                    750: 35000,
                    900: 45000
                };

                // Find exact match or closest lower bound? User said "Fixed Price".
                // Let's assume exact match for now, or maybe fallback?
                // User example: 500M -> 25K.
                // If user enters 550M, what happens? 
                // "Pure harga paket tetap". implies only specific packages?
                // Or maybe linear interpolation? 
                // Let's stick to the map. If not in map, maybe show "Hubungi Admin"?
                // Or maybe just use the closest logic?
                // Let's implement exact map first.
                if (map[totalM]) {
                    estimate = map[totalM];
                } else {
                    // Fallback or "Unlisted"?
                    // Let's try to be smart. If 600M, maybe 30K? (Linear 50k/B rate for small?)
                    // 500M = 25K -> 50k/B.
                    // 100M = 5K -> 50k/B.
                    // It seems consistent 50k/B for small amounts?
                    // 900M = 45K -> 50k/B.
                    // So < 1B is effectively 50k/B?
                    // Let's use 50k/B for unlisted small amounts.
                    estimate = totalB * 50000;
                }
            } else {
                // >= 1B -> 60k/B
                estimate = totalB * 60000;
            }

            document.getElementById('wdEstimate').innerText = "Estimasi Pendapatan: Rp " + estimate.toLocaleString('id-ID');
            return estimate;
        }

        // Update openModal to use new inputs
        const originalOpenModal = openModal;
        openModal = function (type, form) {
            if (type === 'withdraw') {
                currentFormId = form;
                const b = form.querySelector('[name="wd_b"]').value;
                const m = form.querySelector('[name="wd_m"]').value;

                if ((!b || b == 0) && (!m || m == 0)) {
                    alert("Harap isi nominal B atau M!");
                    return;
                }

                let nominalStr = "";
                if (b && b > 0) nominalStr += b + "B ";
                if (m && m > 0) nominalStr += m + "M";
                nominalStr = nominalStr.trim();

                const bank = form.querySelector('[name="user_bank"]').value;
                const accNum = form.querySelector('[name="account_number"]').value;
                const accName = form.querySelector('[name="account_name"]').value;

                // Calculate estimate again for modal
                const estimate = calculateWDEstimate();

                // Get ID WD Config (passed from PHP)
                const idWdValue = "<?= htmlspecialchars($id_wd['value']) ?>";
                const idWdNick = "<?= htmlspecialchars($id_wd['nickname']) ?>";

                const modal = document.getElementById('confirmModal');
                const modalBody = document.getElementById('modalBody');
                const modalTitle = document.getElementById('modalTitle');

                modalTitle.innerText = "Konfirmasi Withdraw";
                modalBody.innerHTML = `
                <div class="info-grid" style="grid-template-columns: 1fr;">
                    <div class="info-item">
                        <strong>Detail Withdraw</strong>
                        <p>${nominalStr}</p>
                        <p style="color: #4CAF50; font-weight: bold;">Estimasi: Rp ${estimate.toLocaleString('id-ID')}</p>
                        <p>Ke: ${bank} (${accNum})</p>
                        <p>A.N ${accName}</p>
                    </div>
                </div>
                <p>Pastikan data di atas benar.</p>
                <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">
                <p>Silakan kirim Chip ke ID berikut:</p>
                <div class="bank-card" style="text-align:center;">
                    <div class="bank-holder">ID TUJUAN</div>
                    <div class="bank-number" id="detailNumber">${idWdValue}</div>
                    <div class="bank-holder">${idWdNick}</div>
                    <button onclick="navigator.clipboard.writeText('${idWdValue}')" class="copy-btn-small">Salin ID</button>
                </div>
                <p>Silakan kirim Chip ke ID di atas.</p>`;

                modal.style.display = 'flex';
                startTimer();
            } else {
                originalOpenModal(type, form);
            }
        };

        function calculateChipJS(rupiahStr) {
            // Remove non-digits
            let rupiah = parseInt(rupiahStr.replace(/[^0-9]/g, ''));

            if (isNaN(rupiah)) {
                document.getElementById('chipEstimate').innerText = "";
                return;
            }

            let estimate = getChipEstimate(rupiah);

            if (estimate) {
                document.getElementById('chipEstimate').innerText = "Dapat: " + estimate;
            } else {
                document.getElementById('chipEstimate').innerText = "";
            }
        }

        // Check for errors from submit.php
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        if (error === 'spam') {
            alert("⚠️ Sistem Sibuk! Harap tunggu 2 menit sebelum transaksi lagi.");
        } else if (error === 'pending') {
            alert("⚠️ Transaksi Pending! Anda masih memiliki transaksi yang belum selesai. Silakan cek status.");
        }
    </script>
</body>

</html>