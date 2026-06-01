import { Router } from 'express';
import agendaController from '../controllers/agendaController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protected agenda routes
router.post('/', authenticate, agendaController.createAgenda);
router.get('/', authenticate, agendaController.getAgendas);
router.get('/today', authenticate, agendaController.getTodayAgendas);
router.get('/week', authenticate, agendaController.getWeekAgendas);
router.get('/:id', authenticate, agendaController.getAgendaById);
router.put('/:id', authenticate, agendaController.updateAgenda);
router.delete('/:id', authenticate, agendaController.deleteAgenda);
router.patch('/:id/complete', authenticate, agendaController.completeAgenda);

// Google Calendar routes
router.get('/google/auth-url', authenticate, agendaController.getGoogleAuthUrl);
router.get('/google/callback', authenticate, agendaController.handleGoogleCallback);
router.get('/google/calendars', authenticate, agendaController.getCalendarList);
router.post('/google/sync', authenticate, agendaController.syncAllWithGoogle);

export default router;
