const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`;

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Agenda API
export const agendaApi = {
  getAll: () => fetchApi('/agendas'),
  getToday: () => fetchApi('/agendas/today'),
  getById: (id: string) => fetchApi(`/agendas/${id}`),
  create: (data: any) => fetchApi('/agendas', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/agendas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi(`/agendas/${id}`, { method: 'DELETE' }),
  syncWithGoogle: () => fetchApi('/agendas/sync-google', { method: 'POST' }),
};

// Google Calendar OAuth
export const googleCalendarApi = {
  getAuthUrl: () => fetchApi('/agendas/google/auth-url'),
  callback: (code: string) => fetchApi('/agendas/google/callback', { method: 'POST', body: JSON.stringify({ code }) }),
  getCalendars: () => fetchApi('/agendas/google/calendars'),
};

// Tasks API
export const taskApi = {
  getAll: (filters?: any) => {
    const params = new URLSearchParams(filters).toString();
    return fetchApi(`/tasks${params ? `?${params}` : ''}`);
  },
  getStats: () => fetchApi('/tasks/stats'),
  getJiraTasks: (filter?: string) => {
    const params = filter ? `?filter=${filter}` : '';
    return fetchApi(`/tasks/jira${params}`);
  },
  getById: (id: string) => fetchApi(`/tasks/${id}`),
  create: (data: any) => fetchApi('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi(`/tasks/${id}`, { method: 'DELETE' }),
};

// Telegram
export const telegramApi = {
  getBotInfo: () => fetchApi('/telegram/bot-info'),
};

// Auth
export const authApi = {
  login: (email: string, jiraEmail: string, jiraApiToken: string, jiraHost: string) =>
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, jiraEmail, jiraApiToken, jiraHost }),
    }),
  updateJiraCredentials: (jiraEmail: string, jiraApiToken: string, jiraHost: string) =>
    fetchApi('/auth/jira-credentials', {
      method: 'PUT',
      body: JSON.stringify({ jiraEmail, jiraApiToken, jiraHost }),
    }),
  register: (name: string, email: string, password: string) =>
    fetchApi('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
};

export default { agendaApi, googleCalendarApi, telegramApi, authApi, taskApi };
