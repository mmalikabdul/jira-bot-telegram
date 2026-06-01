import { Request, Response } from 'express';
import taskService from '../services/taskService';
import jiraService from '../services/jiraService';
import prisma from '../config/database';
import { CreateTaskDTO, UpdateTaskDTO } from '../types';

export class TaskController {
  // GET /api/tasks
  async getAllTasks(req: Request, res: Response) {
    try {
      const { status, priority, search } = req.query;
      const userId = (req as any).userId;

      const tasks = await taskService.getAllTasks({
        userId,
        status: status as any,
        priority: priority as any,
        search: search as string,
      });

      res.json({
        success: true,
        data: tasks,
        count: tasks.length,
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tasks',
      });
    }
  }

  // GET /api/tasks/stats
  async getTaskStats(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const stats = await taskService.getTaskStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching task stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch task statistics',
      });
    }
  }

  // GET /api/tasks/:id
  async getTaskById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await taskService.getTaskById(id as string);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch task',
      });
    }
  }

  // POST /api/tasks
  async createTask(req: Request, res: Response) {
    try {
      const taskData: CreateTaskDTO = req.body;
      const userId = (req as any).userId || 'test-user-id';

      const task = await taskService.createTask(taskData, userId);

      res.status(201).json({
        success: true,
        data: task,
        message: 'Task created successfully',
      });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create task. Make sure user exists.',
      });
    }
  }

  // PUT /api/tasks/:id
  async updateTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const taskData: UpdateTaskDTO = req.body;

      const task = await taskService.updateTask(id as string, taskData);

      res.json({
        success: true,
        data: task,
        message: 'Task updated successfully',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update task',
      });
    }
  }

  // DELETE /api/tasks/:id
  async deleteTask(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await taskService.deleteTask(id as string);

      res.json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete task',
      });
    }
  }

  // GET /api/tasks/jira
  async getJiraTasks(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      const credentials = await jiraService.getUserCredentials(user);
      if (!credentials) {
        return res.status(400).json({
          success: false,
          error: 'Jira credentials not configured. Please set up your Jira account.',
          needsJiraSetup: true
        });
      }

      // Get filter from query params (today, weekly, monthly, all)
      const filter = (req.query.filter as 'today' | 'weekly' | 'monthly' | 'all') || 'all';
      
      const issues = await jiraService.getIssues(credentials, filter, user.jiraEmail || undefined);
      res.json({
        success: true,
        data: issues.issues,
        total: issues.total
      });
    } catch (error: any) {
      console.error('Error fetching Jira issues:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Jira issues'
      });
    }
  }
}

export default new TaskController();