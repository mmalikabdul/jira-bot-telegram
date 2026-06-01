import { Request } from 'express';

// Task types
export interface CreateTaskDTO {
  title: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date;
  estimatedHours?: number;
  jiraIssueKey?: string;
  tags?: string[];
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  jiraIssueKey?: string;
  tags?: string[];
}

// Extended Request with user (for future auth)
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}
