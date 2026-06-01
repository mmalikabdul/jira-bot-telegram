import type { Task } from '../types/task';

// Mock data for testing
export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Implement user authentication',
    description: 'Add JWT-based authentication with login and registration',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2026-06-15',
    estimatedHours: 8,
    actualHours: 5,
    jiraKey: 'PROJ-101',
    tags: [
      { id: '1', name: 'Backend', color: '#3b82f6' },
      { id: '2', name: 'Security', color: '#ef4444' },
    ],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: '2',
    title: 'Design dashboard UI',
    description: 'Create mockups for the main dashboard with stats and charts',
    status: 'DONE',
    priority: 'MEDIUM',
    dueDate: '2026-06-10',
    estimatedHours: 6,
    actualHours: 7,
    jiraKey: 'PROJ-102',
    tags: [
      { id: '3', name: 'Frontend', color: '#10b981' },
      { id: '4', name: 'Design', color: '#f59e0b' },
    ],
    createdAt: '2026-05-28T00:00:00Z',
    updatedAt: '2026-06-01T09:00:00Z',
  },
  {
    id: '3',
    title: 'Setup CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment',
    status: 'TODO',
    priority: 'URGENT',
    dueDate: '2026-06-08',
    estimatedHours: 4,
    jiraKey: 'PROJ-103',
    tags: [
      { id: '5', name: 'DevOps', color: '#8b5cf6' },
    ],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: '4',
    title: 'Write API documentation',
    description: 'Document all REST API endpoints with examples',
    status: 'BACKLOG',
    priority: 'LOW',
    estimatedHours: 3,
    jiraKey: 'PROJ-104',
    tags: [
      { id: '6', name: 'Documentation', color: '#64748b' },
    ],
    createdAt: '2026-05-30T00:00:00Z',
    updatedAt: '2026-05-30T00:00:00Z',
  },
  {
    id: '5',
    title: 'Optimize database queries',
    description: 'Add indexes and optimize slow queries',
    status: 'IN_REVIEW',
    priority: 'HIGH',
    dueDate: '2026-06-12',
    estimatedHours: 5,
    actualHours: 4,
    jiraKey: 'PROJ-105',
    tags: [
      { id: '1', name: 'Backend', color: '#3b82f6' },
      { id: '7', name: 'Performance', color: '#ec4899' },
    ],
    createdAt: '2026-05-29T00:00:00Z',
    updatedAt: '2026-06-01T08:00:00Z',
  },
];

// Helper function to get task by ID
export const getTaskById = (id: string): Task | undefined => {
  return mockTasks.find((task) => task.id === id);
};

// Helper function to filter tasks
export const filterTasks = (
  tasks: Task[],
  filters: {
    status?: string;
    priority?: string;
    search?: string;
  }
): Task[] => {
  return tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.jiraKey?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });
};
