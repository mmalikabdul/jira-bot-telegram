export type AgendaWorkType = 'MEETING' | 'TASK' | 'REVIEW' | 'PLANNING' | 'STANDUP' | 'RETROSPECTIVE' | 'OTHER';
export type AgendaStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Agenda {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  completed: boolean;
  
  // Jira-like Fields
  workType: AgendaWorkType;
  status: AgendaStatus;
  priority: Priority;
  storyPoints?: number;
  sprint?: string;
  epic?: string;
  labels: string[];
  
  // Assignment
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };

  isRecurring: boolean;
  recurrenceRule?: string;
  recurrenceEndDate?: string;
  googleEventId?: string;
  googleCalendarId?: string;
  taskId?: string;
  task?: {
    id: string;
    title: string;
    status: string;
  };
  
  createdVia: 'WEB' | 'TELEGRAM' | 'API';
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgendaInput {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  taskId?: string;
  notes?: string;
  
  // Jira-like Fields
  workType?: AgendaWorkType;
  status?: AgendaStatus;
  priority?: Priority;
  storyPoints?: number;
  sprint?: string;
  epic?: string;
  labels?: string[];
  assigneeId?: string;

  isRecurring?: boolean;
  recurrenceRule?: string;
  recurrenceEndDate?: string;
  syncWithGoogle?: boolean;
  googleCalendarId?: string;
}

export interface RecurrenceOptions {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval?: number;
  daysOfWeek?: string[]; // ['MO', 'TU', 'WE', 'TH', 'FR']
  endDate?: string;
  count?: number;
}
