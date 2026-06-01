# Persiapan Integrasi Jira & Telegram

Untuk mengaktifkan integrasi Jira dan Telegram, Anda perlu menyiapkan beberapa hal berikut:

---

## 1. Persiapan Jira (Atlassian)

Aplikasi ini menggunakan Jira REST API untuk sinkronisasi task.

### A. Dapatkan Jira API Token
1. Login ke [Atlassian API Tokens page](https://id.atlassian.com/manage-profile/security/api-tokens).
2. Klik **Create API token**.
3. Beri nama (misal: `Jira Task Monitor`) dan klik **Create**.
4. **Copy API token** tersebut (Anda tidak akan bisa melihatnya lagi).

### B. Konfigurasi `.env` Backend
Update file `backend/.env` dengan data berikut:
```env
JIRA_HOST=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-generated-api-token
```

---

## 2. Persiapan Telegram Bot

Bot ini memungkinkan Anda membuat agenda dan menerima notifikasi via Telegram.

### A. Buat Bot Baru
1. Buka Telegram dan cari `@BotFather`.
2. Ketik `/newbot`.
3. Masukkan nama bot (misal: `Jira Monitor Bot`).
4. Masukkan username bot (harus diakhiri dengan `bot`, misal: `my_jira_monitor_bot`).
5. **Copy HTTP API Token** yang diberikan.

### B. Konfigurasi `.env` Backend
Update file `backend/.env`:
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIjKlMnOpQrStUvWxYz
```

---

## 3. Langkah Integrasi (Setelah App Running)

Setelah backend dan frontend berjalan:

### A. Menghubungkan Telegram ke Akun Anda
1. Buka bot Anda di Telegram.
2. Klik **Start** atau ketik `/start`.
3. Ketik `/link your-email@example.com` (gunakan email yang terdaftar di aplikasi).
4. Bot akan mengonfirmasi jika akun berhasil dihubungkan.

### B. Mencoba Membuat Agenda via Telegram
Ketik perintah dengan format:
`/agenda Judul Agenda | Tanggal (YYYY-MM-DD) | Jam Mulai (HH:mm) | Jam Selesai (HH:mm)`

**Contoh:**
```
/agenda Daily Standup | 2026-06-01 | 09:00 | 09:30
```

### C. Sinkronisasi Jira
1. Di Dashboard atau menu Backlog, klik tombol **Sync Jira**.
2. Aplikasi akan menarik task dari Jira host yang dikonfigurasi.
3. Task yang ditarik akan muncul di Backlog dan bisa dijadwalkan ke Agenda.

---

## 🛠️ Troubleshooting Persiapan

1. **Jira API Error**: Pastikan email dan API token benar. Coba akses `https://your-domain.atlassian.net/rest/api/3/myself` di browser (setelah login) untuk memastikan host benar.
2. **Telegram Bot Tidak Merespon**: Pastikan `TELEGRAM_BOT_TOKEN` di `.env` sudah benar dan backend sudah di-restart.
3. **Database Error**: Pastikan Anda sudah menjalankan `npx prisma db push` setelah melakukan perubahan schema.

---

**Status**: Siap untuk dikonfigurasi! 🚀
