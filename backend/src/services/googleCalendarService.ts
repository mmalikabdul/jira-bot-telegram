import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  recurrence?: string[]; // RRULE format
}

interface RecurrenceOptions {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval?: number;
  daysOfWeek?: string[]; // ['MO', 'TU', 'WE', 'TH', 'FR']
  endDate?: string;
  count?: number;
}

class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Set user credentials for OAuth2
   */
  setCredentials(tokens: { access_token: string; refresh_token?: string }) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Build RRULE string from recurrence options
   */
  private buildRecurrenceRule(options: RecurrenceOptions): string {
    let rrule = `RRULE:FREQ=${options.frequency}`;

    if (options.interval && options.interval > 1) {
      rrule += `;INTERVAL=${options.interval}`;
    }

    if (options.daysOfWeek && options.daysOfWeek.length > 0) {
      rrule += `;BYDAY=${options.daysOfWeek.join(',')}`;
    }

    if (options.endDate) {
      // Convert to YYYYMMDD format
      const endDate = options.endDate.replace(/[-:]/g, '').split('T')[0];
      rrule += `;UNTIL=${endDate}`;
    } else if (options.count) {
      rrule += `;COUNT=${options.count}`;
    }

    return rrule;
  }

  /**
   * Create a calendar event (with optional recurrence)
   */
  async createEvent(
    calendarId: string,
    event: CalendarEvent,
    recurrenceOptions?: RecurrenceOptions
  ) {
    const eventResource: any = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.startDateTime,
        timeZone: 'Asia/Jakarta',
      },
      end: {
        dateTime: event.endDateTime,
        timeZone: 'Asia/Jakarta',
      },
    };

    // Add recurrence rule if provided
    if (recurrenceOptions) {
      const rrule = this.buildRecurrenceRule(recurrenceOptions);
      eventResource.recurrence = [rrule];
    }

    const response = await this.calendar.events.insert({
      calendarId,
      requestBody: eventResource,
    });

    return response.data;
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(
    calendarId: string,
    eventId: string,
    event: Partial<CalendarEvent>
  ) {
    const eventResource: any = {};

    if (event.title) eventResource.summary = event.title;
    if (event.description) eventResource.description = event.description;
    if (event.startDateTime) {
      eventResource.start = {
        dateTime: event.startDateTime,
        timeZone: 'Asia/Jakarta',
      };
    }
    if (event.endDateTime) {
      eventResource.end = {
        dateTime: event.endDateTime,
        timeZone: 'Asia/Jakarta',
      };
    }
    if (event.recurrence) {
      eventResource.recurrence = event.recurrence;
    }

    const response = await this.calendar.events.update({
      calendarId,
      eventId,
      requestBody: eventResource,
    });

    return response.data;
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(calendarId: string, eventId: string) {
    await this.calendar.events.delete({
      calendarId,
      eventId,
    });
  }

  /**
   * Get events from calendar within a date range
   */
  async getEvents(
    calendarId: string,
    timeMin: string,
    timeMax: string
  ) {
    const response = await this.calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  }

  /**
   * Sync local agenda with Google Calendar
   */
  async syncEvent(
    calendarId: string,
    localEvent: {
      googleEventId?: string;
      title: string;
      description?: string;
      startDateTime: string;
      endDateTime: string;
      isRecurring: boolean;
      recurrenceRule?: string;
    }
  ) {
    try {
      // If event already has Google ID, update it
      if (localEvent.googleEventId) {
        return await this.updateEvent(calendarId, localEvent.googleEventId, {
          title: localEvent.title,
          description: localEvent.description,
          startDateTime: localEvent.startDateTime,
          endDateTime: localEvent.endDateTime,
        });
      }

      // Otherwise, create new event
      const eventData: CalendarEvent = {
        title: localEvent.title,
        description: localEvent.description,
        startDateTime: localEvent.startDateTime,
        endDateTime: localEvent.endDateTime,
      };

      // Parse recurrence rule if exists
      let recurrenceOptions: RecurrenceOptions | undefined;
      if (localEvent.isRecurring && localEvent.recurrenceRule) {
        recurrenceOptions = this.parseRecurrenceRule(localEvent.recurrenceRule);
      }

      return await this.createEvent(calendarId, eventData, recurrenceOptions);
    } catch (error) {
      console.error('Error syncing event with Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Parse RRULE string to RecurrenceOptions
   */
  private parseRecurrenceRule(rrule: string): RecurrenceOptions {
    const options: RecurrenceOptions = { frequency: 'DAILY' };
    
    const parts = rrule.replace('RRULE:', '').split(';');
    
    parts.forEach(part => {
      const [key, value] = part.split('=');
      
      switch (key) {
        case 'FREQ':
          options.frequency = value as 'DAILY' | 'WEEKLY' | 'MONTHLY';
          break;
        case 'INTERVAL':
          options.interval = parseInt(value);
          break;
        case 'BYDAY':
          options.daysOfWeek = value.split(',');
          break;
        case 'UNTIL':
          options.endDate = value;
          break;
        case 'COUNT':
          options.count = parseInt(value);
          break;
      }
    });
    
    return options;
  }

  /**
   * Get user's calendar list
   */
  async getCalendarList() {
    const response = await this.calendar.calendarList.list();
    return response.data.items || [];
  }
}

export default new GoogleCalendarService();
export { RecurrenceOptions, CalendarEvent };
