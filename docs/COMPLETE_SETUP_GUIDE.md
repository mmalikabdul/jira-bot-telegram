# Jira Task Monitor - Complete Setup Guide

## Overview

Aplikasi **Jira Task Monitor** telah dienhance dengan fitur-fitur baru:

1. **Google Calendar Sync** - Sync agenda ke Google Calendar
2. **Recurring Events** - Support daily/weekly/monthly recurring events
3. **Telegram Bot Integration** - Create agenda via Telegram bot
4. **Jira-like Fields** - Work type, sprint, epic, story points, assignee, dll

---

## 📋 Database Setup

### 1. Update `.env` Backend

Copy `backend/.env.example` ke `backend/.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/jira_monitor

# Google Calendar
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/agendas/google/callback

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

### 2. Run Database Migration

```bash
cd backend
npx prisma generate
npx prisma db push
# atau
npx prisma migrate dev --name add_agenda_jira_fields
```

---

## 🤖 Telegram Bot Setup

### 1. Create Bot via BotFather

1. Buka Telegram dan search `@BotFather`
2. Ketik `/newbot` dan ikuti instructions
3. Copy **bot token** yang diberikan

### 2. Add Token to `.env`

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIjKlMnOpQrStUvWxYz
```

### 3. Telegram Bot Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Start bot dan lihat instructions | `/start` |
| `/link <email>` | Link Telegram ke account app | `/link user@example.com` |
| `/agenda` | Create agenda via Telegram | `/agenda Daily Standup \| 2026-06-01 \| 09:00 \| 09:30` |
| `/today` | Lihat agenda hari ini | `/today` |
| `/help` | Show help message | `/help` |

### 4. Flow Create Agenda via Telegram

1. **Link account dulu**: Ketik `/link your@email.com`
2. **Create agenda**: Ketik `/agenda Title | Date | StartTime | EndTime`
3. **Auto-sync**: Event otomatis dibuat di database + Google Calendar

**Example**:
```
/agenda Daily Standup | 2026-06-01 | 09:00 | 09:30
```

---

## 🗓️ Google Calendar Setup

Follow detailed guide di [`docs/GOOGLE_CALENDAR_SETUP.md`](docs/GOOGLE_CALENDAR_SETUP.md)

### Quick Summary:

1. Buat Google Cloud Project
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:3000/api/agendas/google/callback`
5. Copy Client ID dan Secret ke `.env`

---

## 🎯 Enhanced Agenda Schema

### New Fields Added (Jira-like)

| Field | Type | Description |
|-------|------|-------------|
| `workType` | Enum | MEETING, TASK, REVIEW, PLANNING, STANDUP, RETROSPECTIVE, OTHER |
| `status` | Enum | TODO, IN_PROGRESS, DONE, CANCELLED |
| `priority` | Enum | LOW, MEDIUM, HIGH, URGENT |
| `storyPoints` | Float | Story points untuk task |
| `sprint` | String | Sprint name/number |
| `epic` | String | Epic name |
| `labels` | String[] | Tags/labels |
| `assigneeId` | String | User ID yang di-assign |
| `createdVia` | Enum | WEB, TELEGRAM, API |

### Database Relations

- `userId` → Creator/owner
- `assigneeId` → Assigned user (optional)
- `taskId` → Related task (optional)
- `googleEventId` → Synced Google Calendar event ID

---

## 🚀 How to Run

### Backend

```bash
cd backend

# Install dependencies (if not done)
npm install

# Setup database
npx prisma generate
npx prisma db push

# Start dev server
npm run dev
```

Server akan run di `http://localhost:3000`

### Frontend

```bash
cd frontend

# Install dependencies (if not done)
npm install

# Start dev server
npm run dev
```

Frontend akan run di `http://localhost:5173`

---

## 📡 Backend API Endpoints

### Agenda Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/agendas` | Create new agenda |
| `GET` | `/api/agendas` | Get all agendas (with filters) |
| `GET` | `/api/agendas/today` | Get today's agendas |
| `GET` | `/api/agendas/week` | Get this week's agendas |
| `GET` | `/api/agendas/:id` | Get agenda by ID |
| `PUT` | `/api/agendas/:id` | Update agenda |
| `DELETE` | `/api/agendas/:id` | Delete agenda |
| `PATCH` | `/api/agendas/:id/complete` | Mark as completed |

### Google Calendar Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agendas/google/auth-url` | Get OAuth URL |
| `GET` | `/api/agendas/google/callback` | OAuth callback |
| `GET` | `/api/agendas/google/calendars` | Get user's calendars |
| `POST` | `/api/agendas/google/sync` | Sync all agendas to Google |

---

## ✅ Checklist Before Using

- [ ] PostgreSQL database running dan accessible
- [ ] `backend/.env` configured dengan DATABASE_URL
- [ ] `npx prisma generate` dan `npx prisma db push` executed
- [ ] Google Calendar API credentials added ke `.env` (optional)
- [ ] Telegram Bot Token added ke `.env` (optional)
- [ ] Backend running (`npm run dev`)
- [ ] Frontend running (`npm run dev`)
- [ ] Link Telegram account via `/link <email>`

---

## 📁 Files Created/Modified

### Backend
| File | Status | Description |
|------|--------|-------------|
| `backend/prisma/schema.prisma` | Modified | Added Jira-like fields, Telegram fields |
| `backend/src/services/googleCalendarService.ts` | Created | Google Calendar OAuth & sync |
| `backend/src/services/agendaService.ts` | Created | Agenda CRUD + Google sync |
| `backend/src/services/telegramBotService.ts` | Created | Telegram bot handler |
| `backend/src/controllers/agendaController.ts` | Created | Agenda REST API controllers |
| `backend/src/routes/agendaRoutes.ts` | Created | Agenda route definitions |
| `backend/src/app.ts` | Modified | Added agenda routes |
| `backend/.env.example` | Modified | Added Google + Telegram vars |

### Frontend
| File | Status | Description |
|------|--------|-------------|
| `frontend/src/pages/Agenda.tsx` | Modified | FullCalendar + Jira fields UI |
| `frontend/src/types/agenda.ts` | Modified | Enhanced with Jira-like types |

### Docs
| File | Status | Description |
|------|--------|-------------|
| `docs/GOOGLE_CALENDAR_SETUP.md` | Created | Google Calendar setup guide |
| `docs/AGENDA_FEATURE.md` | Created | Feature documentation |
| `docs/COMPLETE_SETUP_GUIDE.md` | Created | This file |
| `docs/IMPLEMENTATION_PROGRESS.md` | Modified | Updated progress |

---

## 🔮 Next Steps (Future Enhancements)

- [ ] Connect frontend ke real backend API (currently using mock data)
- [ ] Implement OAuth flow untuk Google Calendar di frontend
- [ ] Add notification system (Telegram reminders sebelum meeting)
- [ ] Drag-and-drop rescheduling
- [ ] Bulk operations (delete multiple, update status)
- [ ] Team calendar sharing
- [ ] Jira API integration untuk auto-sync issues
- [ ] WhatsApp integration via Twilio
- [ ] Email notifications

---

**Status**: ✅ Implementation Complete - Ready for Database Setup & Testing
**Last Updated**: 2026-06-01
