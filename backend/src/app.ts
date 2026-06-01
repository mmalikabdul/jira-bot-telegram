import dotenv from 'dotenv';
// Load environment variables at the very beginning
dotenv.config();

import express, { Application, Request, Response } from 'express';
import cors from 'cors';

import taskRoutes from './routes/taskRoutes';
import agendaRoutes from './routes/agendaRoutes';
import authRoutes from './routes/authRoutes';
import TelegramBotService from './services/telegramBotService';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Jira Task Monitor API is running' });
});

// API Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/agendas', agendaRoutes);
app.use('/api/auth', authRoutes);

app.get('/api', (req: Request, res: Response) => {
  res.json({ 
    message: 'Jira Task Monitor API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      tasks: '/api/tasks',
      agendas: '/api/agendas',
      jira: '/api/jira',
      notifications: '/api/notifications'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  
  // Initialize Telegram Bot after server starts
  if (process.env.TELEGRAM_BOT_TOKEN) {
    // Accessing the singleton instance to ensure it's initialized
    const botService = TelegramBotService;
    console.log('🤖 Telegram Bot Service instance accessed');
  }
});

export default app;
