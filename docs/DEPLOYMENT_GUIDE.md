# 🚀 Panduan Deploy: Supabase + Railway + Netlify

## 📋 Persiapan

### Akun yang Perlu Dibuat
1. **GitHub** - untuk menyimpan kode
2. **Supabase** (supabase.com) - untuk database PostgreSQL
3. **Railway** (railway.app) - untuk backend API + Telegram Bot
4. **Netlify** (netlify.com) - untuk frontend

---

## 1️⃣ Step 1: Push ke GitHub

```bash
cd c:/Users/usER/Documents/jira-task-monitor

# Inisialisasi git (jika belum)
git init

# Tambahkan semua file
git add .

# Commit
git commit -m "Initial commit - Jira Task Monitor"

# Buat repository baru di GitHub, lalu:
git remote add origin https://github.com/USERNAME/jira-task-monitor.git
git branch -M main
git push -u origin main
```

---

## 2️⃣ Step 2: Setup Database di Supabase

### 2.1 Buat Project
1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Isi:
   - **Name**: `jira-task-monitor`
   - **Database Password**: (buat password yang kuat, simpan!)
   - **Region**: Singapore (terdekat ke Indonesia)
3. Klik **Create Project**

### 2.2 Dapatkan Connection String
1. Di dashboard Supabase → **Project Settings** → **Database**
2. Scroll ke **Connection String** → pilih **URI**
3. Copy connection string yang terlihat seperti:
   ```
   postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
4. ⚠️ **Ganti `[YOUR-PASSWORD]`** dengan password database yang kamu buat tadi

### 2.3 Setup Schema
Di Supabase → **SQL Editor** → **New Query** → paste & run:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'USER',
  telegram_chat_id VARCHAR(255) UNIQUE,
  telegram_username VARCHAR(255),
  jira_email VARCHAR(255) UNIQUE,
  jira_api_token TEXT,
  jira_host VARCHAR(255),
  jira_account_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'BACKLOG',
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  jira_id VARCHAR(255) UNIQUE,
  jira_key VARCHAR(255),
  estimated_hours FLOAT,
  actual_hours FLOAT,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_jira_id ON tasks(jira_id);

-- Create Agendas table
CREATE TABLE IF NOT EXISTS agendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  start_time VARCHAR(50) NOT NULL,
  end_time VARCHAR(50) NOT NULL,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  work_type VARCHAR(20) DEFAULT 'MEETING',
  status VARCHAR(20) DEFAULT 'TODO',
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  story_points FLOAT,
  sprint VARCHAR(255),
  epic VARCHAR(255),
  labels TEXT[] DEFAULT '{}',
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  google_event_id VARCHAR(255) UNIQUE,
  google_calendar_id VARCHAR(255),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  recurrence_end_date TIMESTAMP,
  parent_event_id VARCHAR(255),
  created_via VARCHAR(20) DEFAULT 'WEB',
  telegram_message_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE INDEX idx_agendas_user_id ON agendas(user_id);
CREATE INDEX idx_agendas_assignee_id ON agendas(assignee_id);
CREATE INDEX idx_agendas_date ON agendas(date);
CREATE INDEX idx_agendas_status ON agendas(status);
CREATE INDEX idx_agendas_google_event_id ON agendas(google_event_id);
CREATE INDEX idx_agendas_parent_event_id ON agendas(parent_event_id);

-- Create Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Task Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- Create Jira Sync table
CREATE TABLE IF NOT EXISTS jira_syncs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  last_sync TIMESTAMP DEFAULT NOW(),
  status VARCHAR(255),
  message TEXT,
  synced_count INT DEFAULT 0
);

-- Create Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_sent ON notifications(sent);
```

### 2.4 Simpan Connection String
Simpan ini untuk step berikutnya:
```
DATABASE_URL="postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
```

---

## 3️⃣ Step 3: Deploy Backend ke Railway

### 3.1 Setup Railway
1. Buka [railway.app](https://railway.app) → **Login with GitHub**
2. **New Project** → **Deploy from GitHub Repo**
3. Pilih repo `jira-task-monitor`
4. Railway akan otomatis detect backend (ada `package.json` di `/backend`)

### 3.2 Setting Environment Variables
Di Railway → pilih service backend → **Variables** → tambahkan:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Connection string dari Supabase |
| `JWT_SECRET` | Generate random string (contoh: `openssl rand -base64 32`) |
| `TELEGRAM_BOT_TOKEN` | Token bot Telegram kamu (`8873430484:...`) |
| `JIRA_HOST` | `https://telkomdds.atlassian.net` |
| `JIRA_EMAIL` | `m.abdul9malik@gmail.com` |
| `JIRA_API_TOKEN` | Token Jira kamu |
| `ENCRYPTION_KEY` | Random 32 karakter (untuk encrypt token) |
| `GOOGLE_CLIENT_ID` | (Opsional - jika pakai Google Calendar) |
| `GOOGLE_CLIENT_SECRET` | (Opsional) |
| `GOOGLE_REDIRECT_URI` | `https://[your-railway-url]/auth/google/callback` |
| `NODE_ENV` | `production` |

### 3.3 Tambahkan Railway Config
Buat file `backend/railway.toml`:

```toml
[build]
builder = "NIXPACKS"
nixpacksPlan = { "phases" = { "install" = { "cmd" = "npm install" }, "build" = { "cmd" = "npm run build" } } }

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### 3.4 Domain & URL
1. Di Railway → **Settings** → **Domains** → **Generate Domain**
2. Catat URL (contoh: `https://jira-task-monitor-production.up.railway.app`)
3. URL ini akan dipakai untuk:
   - Set Telegram Bot Webhook
   - Setting `GOOGLE_REDIRECT_URI`
   - Frontend API base URL

---

## 4️⃣ Step 4: Deploy Frontend ke Netlify

### 4.1 Buat .env.production
Buat file `frontend/.env.production`:

```env
VITE_API_URL=https://[your-railway-url]
```

Ganti `[your-railway-url]` dengan URL Railway dari step 3.4

### 4.2 Setup Netlify
1. Buka [netlify.com](https://netlify.com) → **Login with GitHub**
2. **Add New Site** → **Import from Git**
3. Pilih repo `jira-task-monitor`
4. Build settings:
   - **Base Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `frontend/dist`

### 4.3 Environment Variables di Netlify
Di Netlify → **Site Settings** → **Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | URL Railway backend |

### 4.4 Tambahkan Netlify Config
Buat file `frontend/netlify.toml`:

```toml
[build]
  base = "frontend"
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 5️⃣ Step 5: Setup Telegram Webhook

Setelah Railway backend running, set webhook:

```bash
curl -X POST "https://api.telegram.org/bot[TELEGRAM_BOT_TOKEN]/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://[your-railway-url]/webhook/telegram"}'
```

Atau langsung dari terminal Railway (via CLI):
```bash
railway run curl -X POST "https://api.telegram.org/bot[TELEGRAM_BOT_TOKEN]/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://[your-railway-url]/webhook/telegram\"}"
```

Verifikasi webhook:
```bash
curl "https://api.telegram.org/bot[TELEGRAM_BOT_TOKEN]/getWebhookInfo"
```

---

## 6️⃣ Step 6: Verifikasi

### Cek Backend
```bash
curl https://[your-railway-url]/health
# Response: {"status": "ok", "timestamp": "..."}
```

### Cek Frontend
Buka URL Netlify di browser → login & test fitur

### Cek Telegram Bot
Kirim `/start` ke bot → harusnya response

---

## 📁 Checklist Sebelum Deploy

- [ ] Code sudah di-push ke GitHub
- [ ] Database Supabase sudah dibuat & schema sudah di-migrate
- [ ] Railway backend sudah deploy & environment variables ter-set
- [ ] Frontend Netlify sudah deploy
- [ ] Telegram webhook sudah di-set ke Railway URL
- [ ] Test login, create task, bot Telegram
- [ ] `.env` files **TIDAK** ter-commit ke Git

---

## 🗑️ File yang Harus Ada di .gitignore

```
# Environment
.env
.env.local
.env.production

# Build outputs
backend/dist/
frontend/dist/
frontend/node_modules/
backend/node_modules/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Prisma
backend/prisma/migrations/
```

---

## 🆘 Troubleshooting

### Database Connection Error
- Pastikan `DATABASE_URL` menggunakan pooler port `6543` (bukan `5432`)
- Cek IP Railway di whitelist Supabase (Settings → Database → Network → Allow All)

### Telegram Bot Tidak Response
- Cek webhook: `https://api.telegram.org/bot[TOKEN]/getWebhookInfo`
- Pastikan URL webhook pakai HTTPS (Railway sudah otomatis HTTPS)
- Cek log Railway untuk error

### CORS Error
- Pastikan `CORS_ORIGIN` di Railway diset ke URL Netlify
- Atau set ke `*` untuk testing