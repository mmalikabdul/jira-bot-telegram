import { Agenda } from '@prisma/client';
import googleCalendarService from './googleCalendarService';
import prisma from '../config/database';

interface CreateAgendaInput {
  userId: string;
  title: string;
  description?: string;
  date: Date;
  startTime: string;
  endTime: string;
  taskId?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  recurrenceEndDate?: Date;
  syncWithGoogle?: boolean;
  googleCalendarId?: string;
}

interface UpdateAgendaInput {
  title?: string;
  description?: string;
  date?: Date;
  startTime?: string;
  endTime?: string;
  notes?: string;
  completed?: boolean;
  syncWithGoogle?: boolean;
}

class AgendaService {
  /**
   * Create a new agenda item
   */
  async createAgenda(data: CreateAgendaInput): Promise<Agenda> {
    const agendaData: any = {
      userId: data.userId,
      title: data.title,
      description: data.description,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      taskId: data.taskId,
      notes: data.notes,
      isRecurring: data.isRecurring || false,
      recurrenceRule: data.recurrenceRule,
      recurrenceEndDate: data.recurrenceEndDate,
    };

    // Create agenda in database
    const agenda = await prisma.agenda.create({
      data: agendaData,
      include: {
        task: true,
        user: true,
      },
    });

    // Sync with Google Calendar if requested
    if (data.syncWithGoogle && data.googleCalendarId) {
      try {
        const startDateTime = this.combineDateAndTime(data.date, data.startTime);
        const endDateTime = this.combineDateAndTime(data.date, data.endTime);

        const googleEvent = await googleCalendarService.syncEvent(
          data.googleCalendarId,
          {
            title: data.title,
            description: data.description,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            isRecurring: data.isRecurring || false,
            recurrenceRule: data.recurrenceRule,
          }
        );

        // Update agenda with Google Event ID
        if (googleEvent.id) {
          await prisma.agenda.update({
            where: { id: agenda.id },
            data: {
              googleEventId: googleEvent.id,
              googleCalendarId: data.googleCalendarId,
            },
          });
        }
      } catch (error) {
        console.error('Failed to sync with Google Calendar:', error);
        // Continue even if Google sync fails
      }
    }

    return agenda;
  }

  /**
   * Get all agendas for a user
   */
  async getAgendas(
    userId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      completed?: boolean;
    }
  ): Promise<Agenda[]> {
    const where: any = { userId };

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters?.completed !== undefined) {
      where.completed = filters.completed;
    }

    return prisma.agenda.findMany({
      where,
      include: {
        task: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Get agenda by ID
   */
  async getAgendaById(id: string, userId: string): Promise<Agenda | null> {
    return prisma.agenda.findFirst({
      where: { id, userId },
      include: {
        task: true,
      },
    });
  }

  /**
   * Update an agenda item
   */
  async updateAgenda(
    id: string,
    userId: string,
    data: UpdateAgendaInput
  ): Promise<Agenda> {
    const agenda = await this.getAgendaById(id, userId);
    if (!agenda) {
      throw new Error('Agenda not found');
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date) updateData.date = data.date;
    if (data.startTime) updateData.startTime = data.startTime;
    if (data.endTime) updateData.endTime = data.endTime;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.completed !== undefined) updateData.completed = data.completed;

    const updatedAgenda = await prisma.agenda.update({
      where: { id },
      data: updateData,
      include: {
        task: true,
      },
    });

    // Sync with Google Calendar if event exists
    if (data.syncWithGoogle && agenda.googleEventId && agenda.googleCalendarId) {
      try {
        const startDateTime = this.combineDateAndTime(
          data.date || agenda.date,
          data.startTime || agenda.startTime
        );
        const endDateTime = this.combineDateAndTime(
          data.date || agenda.date,
          data.endTime || agenda.endTime
        );

        await googleCalendarService.updateEvent(
          agenda.googleCalendarId,
          agenda.googleEventId,
          {
            title: data.title || agenda.title,
            description: data.description || agenda.description || undefined,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
          }
        );
      } catch (error) {
        console.error('Failed to sync update with Google Calendar:', error);
      }
    }

    return updatedAgenda;
  }

  /**
   * Delete an agenda item
   */
  async deleteAgenda(id: string, userId: string): Promise<void> {
    const agenda = await this.getAgendaById(id, userId);
    if (!agenda) {
      throw new Error('Agenda not found');
    }

    // Delete from Google Calendar if synced
    if (agenda.googleEventId && agenda.googleCalendarId) {
      try {
        await googleCalendarService.deleteEvent(
          agenda.googleCalendarId,
          agenda.googleEventId
        );
      } catch (error) {
        console.error('Failed to delete from Google Calendar:', error);
      }
    }

    await prisma.agenda.delete({
      where: { id },
    });
  }

  /**
   * Mark agenda as completed
   */
  async completeAgenda(id: string, userId: string): Promise<Agenda> {
    return this.updateAgenda(id, userId, { completed: true });
  }

  /**
   * Get agendas for today
   */
  async getTodayAgendas(userId: string): Promise<Agenda[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getAgendas(userId, {
      startDate: today,
      endDate: tomorrow,
    });
  }

  /**
   * Get agendas for this week
   */
  async getWeekAgendas(userId: string): Promise<Agenda[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return this.getAgendas(userId, {
      startDate: today,
      endDate: weekEnd,
    });
  }

  /**
   * Combine date and time string into Date object
   */
  private combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

  /**
   * Sync all user agendas with Google Calendar
   */
  async syncAllWithGoogle(
    userId: string,
    googleCalendarId: string
  ): Promise<{ synced: number; failed: number }> {
    const agendas = await prisma.agenda.findMany({
      where: { userId, googleEventId: null },
    });

    let synced = 0;
    let failed = 0;

    for (const agenda of agendas) {
      try {
        const startDateTime = this.combineDateAndTime(
          agenda.date,
          agenda.startTime
        );
        const endDateTime = this.combineDateAndTime(agenda.date, agenda.endTime);

        const googleEvent = await googleCalendarService.syncEvent(
          googleCalendarId,
          {
            title: agenda.title,
            description: agenda.description || undefined,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            isRecurring: agenda.isRecurring,
            recurrenceRule: agenda.recurrenceRule || undefined,
          }
        );

        if (googleEvent.id) {
          await prisma.agenda.update({
            where: { id: agenda.id },
            data: {
              googleEventId: googleEvent.id,
              googleCalendarId,
            },
          });
          synced++;
        }
      } catch (error) {
        console.error(`Failed to sync agenda ${agenda.id}:`, error);
        failed++;
      }
    }

    return { synced, failed };
  }
}

export default new AgendaService();
