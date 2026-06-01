import { Task, TaskStatus } from '@prisma/client';
import { CreateTaskDTO, UpdateTaskDTO } from '../types';
import prisma from '../config/database';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export class TaskService {
  // Get all tasks with optional filters
  async getAllTasks(filters?: {
    userId?: string;
    status?: TaskStatus;
    priority?: Priority;
    search?: string;
  }): Promise<Task[]> {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { jiraKey: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.task.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true
          }
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // Get task by ID
  async getTaskById(id: string): Promise<Task | null> {
    return await prisma.task.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        agendas: true,
      },
    });
  }

  // Create new task
  async createTask(data: CreateTaskDTO, userId: string): Promise<Task> {
    const { tags, jiraIssueKey, ...taskData } = data;

    return await prisma.task.create({
      data: {
        ...taskData,
        jiraKey: jiraIssueKey,
        userId,
      },
      include: {
        tags: true,
      },
    });
  }

  // Update task
  async updateTask(id: string, data: UpdateTaskDTO): Promise<Task> {
    const { tags, jiraIssueKey, ...taskData } = data;

    return await prisma.task.update({
      where: { id },
      data: {
        ...taskData,
        jiraKey: jiraIssueKey,
      },
      include: {
        tags: true,
      },
    });
  }

  // Delete task
  async deleteTask(id: string): Promise<Task> {
    return await prisma.task.delete({
      where: { id },
    });
  }

  // Get task statistics
  async getTaskStats(userId?: string) {
    const where = userId ? { userId } : {};

    const [
      total,
      todo,
      inProgress,
      done,
      backlog,
      inReview,
      cancelled,
      byPriority
    ] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.count({ where: { ...where, status: 'TODO' } }),
      prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { ...where, status: 'DONE' } }),
      prisma.task.count({ where: { ...where, status: 'BACKLOG' } }),
      prisma.task.count({ where: { ...where, status: 'IN_REVIEW' } }),
      prisma.task.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.task.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: {
        todo,
        inProgress,
        done,
        backlog,
        inReview,
        cancelled,
      },
      byPriority: byPriority.reduce((acc: any, item: any) => {
        acc[item.priority.toLowerCase()] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export default new TaskService();