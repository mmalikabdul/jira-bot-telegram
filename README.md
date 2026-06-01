# Jira Task Monitor Portal

Portal web untuk memonitor task Jira dengan kemampuan input backlog, daily agenda tracking, dan integrasi messaging (Telegram/WhatsApp).

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18+ dengan TypeScript
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI (MUI)
- **Calendar**: FullCalendar
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form + Yup
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **ORM**: Prisma
- **Task Scheduler**: node-cron
- **API Documentation**: Swagger/OpenAPI

### Database & Cache
- **Primary Database**: PostgreSQL 14+
- **Caching**: Redis 7+

### External Integrations
- **Jira**: jira-client
- **Telegram**: telegraf
- **WhatsApp**: Twilio API

### Deployment
- **Version Control**: GitHub (Private Repository)
- **Frontend Hosting**: Vercel
- **Backend + Database**: Railway
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
jira-task-monitor/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # Redux store
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                  # Node.js backend application
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── config/          # Configuration files
│   │   ├── utils/           # Utility functions
│   │   └── app.ts
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── docs/                     # Documentation
│   ├── api/                 # API documentation
│   ├── architecture/        # Architecture diagrams
│   └── guides/              # Setup guides
│
├── .github/
│   └── workflows/
│       ├── frontend-deploy.yml
│       └── backend-deploy.yml
│
├── .gitignore
├── .env.example
├── docker-compose.yml       # For local development
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ LTS
- npm atau yarn
- Git
- PostgreSQL (untuk development lokal) atau Railway account
- Redis (untuk development lokal)

### 1. Clone Repository

```bash
git clone https://github.com/your-username/jira-task-monitor.git
cd jira-task-monitor
```

### 2. Setup Backend

```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Edit .env dengan credentials Anda
# DATABASE_URL, REDIS_URL, JIRA_API_TOKEN, dll.

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install

# Copy environment variables
cp .env.example .env

# Edit .env dengan API URL
# VITE_API_URL=http://localhost:3000

# Start development server
npm run dev
```

### 4. Setup dengan Docker (Optional)

```bash
# Di root directory
docker-compose up -d
```

## 🔐 Environment Variables

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/jira_monitor

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Jira
JIRA_HOST=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# Telegram
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Jira Task Monitor
```

## 🚀 Deployment

### Deploy ke Railway (Backend + Database)

1. Buat account di [Railway.app](https://railway.app)
2. Connect GitHub repository
3. Create new project
4. Add PostgreSQL dan Redis service
5. Deploy backend service
6. Set environment variables di Railway dashboard

### Deploy ke Vercel (Frontend)

1. Buat account di [Vercel.com](https://vercel.com)
2. Import GitHub repository
3. Select `frontend` directory
4. Set environment variables
5. Deploy

## 📚 API Documentation

API documentation tersedia di `/api-docs` setelah backend running.

Atau lihat dokumentasi lengkap di [`docs/api/README.md`](docs/api/README.md)

## 🔗 External API Setup

### Jira API
1. Login ke Jira
2. Go to Account Settings > Security > API Tokens
3. Create API Token
4. Copy token ke `.env`

### Telegram Bot
1. Chat dengan [@BotFather](https://t.me/botfather)
2. Create new bot dengan `/newbot`
3. Copy bot token ke `.env`
4. Set webhook: `POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_BACKEND_URL>/webhook/telegram`

### WhatsApp (Twilio)
1. Buat account di [Twilio](https://www.twilio.com)
2. Get WhatsApp sandbox credentials
3. Copy credentials ke `.env`

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 License

Private - All Rights Reserved

## 👥 Contributors

- Your Name - Initial work

## 📞 Support

Untuk pertanyaan atau issues, silakan buat issue di GitHub repository.
