import { Response } from 'express';
import agendaService from '../services/agendaService';
import googleCalendarService from '../services/googleCalendarService';
import { AuthRequest } from '../types';

class AgendaController {
  /**
   * Create a new agenda
   */
  async createAgenda(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id; // From auth middleware
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        title,
        description,
        date,
        startTime,
        endTime,
        taskId,
        notes,
        isRecurring,
        recurrenceRule,
        recurrenceEndDate,
        syncWithGoogle,
        googleCalendarId,
      } = req.body;

      if (!title || !date || !startTime || !endTime) {
        return res.status(400).json({
          error: 'Title, date, startTime, and endTime are required',
        });
      }

      const agenda = await agendaService.createAgenda({
        userId,
        title,
        description,
        date: new Date(date),
        startTime,
        endTime,
        taskId,
        notes,
        isRecurring,
        recurrenceRule,
        recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
        syncWithGoogle,
        googleCalendarId,
      });

      res.status(201).json(agenda);
    } catch (error: any) {
      console.error('Error creating agenda:', error);
      res.status(500).json({ error: error.message || 'Failed to create agenda' });
    }
  }

  /**
   * Get all agendas for the authenticated user
   */
  async getAgendas(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { startDate, endDate, completed } = req.query;

      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (completed !== undefined) filters.completed = completed === 'true';

      const agendas = await agendaService.getAgendas(userId, filters);
      res.json(agendas);
    } catch (error: any) {
      console.error('Error fetching agendas:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch agendas' });
    }
  }

  /**
   * Get today's agendas
   */
  async getTodayAgendas(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const agendas = await agendaService.getTodayAgendas(userId);
      res.json(agendas);
    } catch (error: any) {
      console.error('Error fetching today agendas:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch today agendas' });
    }
  }

  /**
   * Get this week's agendas
   */
  async getWeekAgendas(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const agendas = await agendaService.getWeekAgendas(userId);
      res.json(agendas);
    } catch (error: any) {
      console.error('Error fetching week agendas:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch week agendas' });
    }
  }

  /**
   * Get agenda by ID
   */
  async getAgendaById(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const id = req.params.id as string;
      const agenda = await agendaService.getAgendaById(id, userId);

      if (!agenda) {
        return res.status(404).json({ error: 'Agenda not found' });
      }

      res.json(agenda);
    } catch (error: any) {
      console.error('Error fetching agenda:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch agenda' });
    }
  }

  /**
   * Update an agenda
   */
  async updateAgenda(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const id = req.params.id as string;
      const updateData: any = {};

      const {
        title,
        description,
        date,
        startTime,
        endTime,
        notes,
        completed,
        syncWithGoogle,
      } = req.body;

      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (date) updateData.date = new Date(date);
      if (startTime) updateData.startTime = startTime;
      if (endTime) updateData.endTime = endTime;
      if (notes !== undefined) updateData.notes = notes;
      if (completed !== undefined) updateData.completed = completed;
      if (syncWithGoogle !== undefined) updateData.syncWithGoogle = syncWithGoogle;

      const agenda = await agendaService.updateAgenda(id, userId, updateData);
      res.json(agenda);
    } catch (error: any) {
      console.error('Error updating agenda:', error);
      res.status(500).json({ error: error.message || 'Failed to update agenda' });
    }
  }

  /**
   * Delete an agenda
   */
  async deleteAgenda(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const id = req.params.id as string;
      await agendaService.deleteAgenda(id, userId);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting agenda:', error);
      res.status(500).json({ error: error.message || 'Failed to delete agenda' });
    }
  }

  /**
   * Mark agenda as completed
   */
  async completeAgenda(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const id = req.params.id as string;
      const agenda = await agendaService.completeAgenda(id, userId);
      res.json(agenda);
    } catch (error: any) {
      console.error('Error completing agenda:', error);
      res.status(500).json({ error: error.message || 'Failed to complete agenda' });
    }
  }

  /**
   * Get Google Calendar authorization URL
   */
  async getGoogleAuthUrl(req: AuthRequest, res: Response) {
    try {
      const authUrl = googleCalendarService.getAuthUrl();
      res.json({ authUrl });
    } catch (error: any) {
      console.error('Error getting auth URL:', error);
      res.status(500).json({ error: error.message || 'Failed to get auth URL' });
    }
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(req: AuthRequest, res: Response) {
    try {
      const { code } = req.query;
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Authorization code is required' });
      }

      const tokens = await googleCalendarService.getTokensFromCode(code);
      
      // Store tokens securely (you should save this to user's record in database)
      // For now, just return them
      res.json({ tokens });
    } catch (error: any) {
      console.error('Error handling Google callback:', error);
      res.status(500).json({ error: error.message || 'Failed to authenticate with Google' });
    }
  }

  /**
   * Sync all agendas with Google Calendar
   */
  async syncAllWithGoogle(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { googleCalendarId } = req.body;
      if (!googleCalendarId) {
        return res.status(400).json({ error: 'Google Calendar ID is required' });
      }

      const result = await agendaService.syncAllWithGoogle(userId, googleCalendarId);
      res.json(result);
    } catch (error: any) {
      console.error('Error syncing with Google:', error);
      res.status(500).json({ error: error.message || 'Failed to sync with Google Calendar' });
    }
  }

  /**
   * Get user's Google Calendar list
   */
  async getCalendarList(req: AuthRequest, res: Response) {
    try {
      const calendars = await googleCalendarService.getCalendarList();
      res.json(calendars);
    } catch (error: any) {
      console.error('Error fetching calendar list:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch calendar list' });
    }
  }
}

export default new AgendaController();
