# React Channel App

A full-stack application built with React, Vite, Express, and PostgreSQL (via Drizzle ORM).

## Deployment (Penting untuk Github)

**PENTING: Aplikasi ini memiliki Backend (Express) dan Database (PostgreSQL).**
**GitHub Pages HANYA bisa menjalankan Frontend Statis (HTML/CSS/JS).** 

Jika Anda mengupload ini ke GitHub Pages, **menu login tidak akan bisa berjalan** karena backend Node.js (`server.ts`) tidak bisa dijalankan di GitHub Pages, sehingga API `/api` akan me-return 404 (Not Found).

Untuk mem-publish aplikasi full-stack ini agar login bisa berjalan, Anda **harus menggunakan layanan yang mendukung backend Node.js**, seperti:

### 1. Render.com (Gratis & Paling Mudah)
Render sangat direkomendasikan karena Anda cukup menghubungkan repository GitHub dan otomatis akan me-running backend.
1. Buat akun di [Render.com](https://render.com/)
2. Klik "New +" lalu pilih **"Web Service"**
3. Hubungkan akun GitHub Anda dan pilih repository ini
4. Konfigurasi yang harus diisi:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
5. Masukkan konfigurasi Database (Supabase / Cloud SQL) di menu **Environment Variables**:
   - `SQL_HOST` = host database Anda
   - `SQL_USER` = user database
   - `SQL_PASSWORD` = password db
   - `SQL_DB_NAME` = nama database
   - `SQL_ADMIN_USER` = admin user db
   - `SQL_ADMIN_PASSWORD` = admin password db
6. Klik **"Deploy Web Service"**

File `render.yaml` sudah disiapkan, sehingga Render akan otomatis mengenali settingan di atas!

### 2. Railway.app atau layanan Node.js lainnya
Gunakan cara yang mirip dengan Render, pastikan menjalankan Build Command: `npm run build` dan Start command `npm run start`.


---

## Setup di Komputer Lokal

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Konfigurasi Database**
   Copy `.env.example` ke `.env` lalu isi dengan detail Supabase atau PostgreSQL Anda.

3. **Migrasi / Inisialisasi Database**
   ```bash
   npx drizzle-kit push
   ```

4. **Jalankan Aplikasi Lokal (Dev)**
   ```bash
   npm run dev
   ```
