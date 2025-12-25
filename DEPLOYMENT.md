# 🚀 Panduan Deployment Royal Topup (Next.js)

Aplikasi ini dibangun menggunakan **Next.js**. Berbeda dengan panduan lama (PHP), aplikasi ini membutuhkan **Node.js** untuk berjalan optimal.

## Pilihan Cara Upload / Deployment

### Opsi 1: Vercel (Sangat Disarankan - Paling Mudah) 🏆
Vercel adalah platform pembuat Next.js. Gratis untuk hobi/personal.

1.  Buat akun di [Vercel.com](https://vercel.com).
2.  Install Vercel CLI di komputer Anda (jika belum):
    ```bash
    npm i -g vercel
    ```
3.  Di terminal VS Code, jalankan perintah:
    ```bash
    vercel
    ```
4.  Ikuti petunjuk di layar (tekan Enter untuk default).
5.  Selesai! Anda akan mendapatkan URL domain (contoh: `royal-topup.vercel.app`).

### Opsi 2: VPS / cPanel dengan Node.js
Jika Anda menggunakan hosting biasa (cPanel), pastikan hosting Anda mendukung **Node.js**.

1.  **Build Aplikasi**:
    Di terminal, jalankan:
    ```bash
    npm run build
    ```
    Ini akan membuat folder `.next`.

2.  **Upload File**:
    Upload semua file **KECUALI** folder `node_modules` ke hosting.

3.  **Install Dependency**:
    Di terminal hosting (SSH atau Terminal cPanel), masuk ke folder dan jalankan:
    ```bash
    npm install --production
    ```

4.  **Setup Database**:
    Pastikan file database SQLite (`dev.db`) ikut terupload atau generate baru dengan:
    ```bash
    npx prisma db push
    ```

5.  **Jalankan**:
    ```bash
    npm start
    ```
    (Anda mungkin perlu setup PM2 atau Passenger di cPanel agar aplikasi terus berjalan).

## ⚠️ Database SQLite
Aplikasi ini menggunakan database file `dev.db`.
*   **Penting**: Jika Anda deploy ke Vercel, data di `dev.db` akan **hilang** setiap kali Anda redeploy (karena serverless).
*   **Solusi**: Untuk produksi jangka panjang, disarankan ganti provider database ke **PostgreSQL / MySQL** (seperti Supabase, Railway, atau PlanetScale).
    *   Ubah `provider = "sqlite"` di `schema.prisma` menjadi `postgresql` / `mysql`.
    *   Update `DATABASE_URL` di `.env`.

## 🧹 Otomatisasi Maintenance (Cron Job)
Aplikasi ini sekarang memiliki fitur **Auto-Cleanup** yang berjalan otomatis setiap tanggal 1 (via Vercel Cron).
*   Logs > 90 hari akan dihapus.
*   Transaksi selesai > 6 bulan akan dihapus.
*   **Cara Cek**: Di Dashboard Vercel, buka tab **Settings > Cron Jobs**.

---

## Fitur Baru: Manajemen Staff (Super Admin)
Anda sekarang memiliki kontrol penuh terhadap staff di menu **Admin -> Staff**:

1.  **Status Akun (Aktif/Nonaktif)**:
    *   Anda bisa menonaktifkan akun staff yang sudah tidak bekerja.
    *   Staff yang dinonaktifkan **tidak bisa login** sama sekali.

2.  **Hak Akses (Permissions)**:
    *   Klik "Edit Akses" pada staff.
    *   Anda bisa memilih menu apa saja yang boleh diakses (ceklis permission).
    *   (Saat ini permission sudah disimpan di database, logika pengecekan di setiap halaman akan aktif sesuai permission yang Anda set).

3.  **Log Login**:
    *   Di kartu staff, Anda bisa melihat "Terakhir Login".
    *   Setiap kali staff login, waktunya akan tercatat. 
