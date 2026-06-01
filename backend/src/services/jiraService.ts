import axios from 'axios';
import jiraCredentialService from './jiraCredentialService';

export interface JiraCredentials {
  email: string;
  apiToken: string;
  host: string;
}

interface AuthHeaderResult {
  authHeader: Record<string, string>;
  host: string;
}

class JiraService {
  private buildAuthHeader(credentials: JiraCredentials): AuthHeaderResult {
    const auth = Buffer.from(`${credentials.email}:${credentials.apiToken}`).toString('base64');
    return {
      authHeader: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      host: credentials.host
    };
  }

  async createIssue(credentials: JiraCredentials, data: {
    projectKey: string;
    summary: string;
    description?: string;
    issueType?: string;
    priority?: string;
    assigneeId?: string;
    customFields?: Record<string, any>;
    update?: Record<string, any>;
  }) {
    try {
      const { authHeader, host } = this.buildAuthHeader(credentials);
      
      // Auto-fetch accountId if not provided (required for Assignee field in many Jira configurations)
      let assigneeId = data.assigneeId;
      if (!assigneeId) {
        try {
          const myselfRes = await axios.get(`${host}/rest/api/3/myself`, { headers: authHeader });
          assigneeId = myselfRes.data.accountId;
          console.log(`✅ Auto-fetched accountId for assignee: ${assigneeId}`);
        } catch (e) {
          console.warn('⚠️ Could not auto-fetch accountId from /myself. Assignee field may be empty if required.');
        }
      }

      const response = await axios.post(
        `${host}/rest/api/3/issue`,
        {
          update: data.update,
          fields: {
            project: {
              key: data.projectKey,
            },
            summary: data.summary,
            assignee: assigneeId ? { id: assigneeId } : undefined,
            ...data.customFields,
            description: data.description
              ? {
                  type: 'doc',
                  version: 1,
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: data.description,
                        },
                      ],
                    },
                  ],
                }
              : undefined,
            issuetype: {
              name: data.issueType || 'Task',
            },
            priority: data.priority
              ? {
                  name: data.priority,
                }
              : undefined,
          },
        },
        {
          headers: authHeader,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error creating Jira issue:', error.response?.data || error.message);
      throw error;
    }
  }

  async getProjects(credentials: JiraCredentials) {
    try {
      const { authHeader, host } = this.buildAuthHeader(credentials);
      const response = await axios.get(`${host}/rest/api/3/project`, {
        headers: authHeader,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Jira projects:', error.response?.data || error.message);
      throw error;
    }
  }

  // Build JQL query for assigned issues with date filter
  private buildJqlQuery(userEmail: string, filter: 'today' | 'weekly' | 'monthly' | 'all' = 'all'): string {
    let dateClause = '';
    
    switch (filter) {
      case 'today':
        dateClause = 'created >= startOfDay() OR updated >= startOfDay()';
        break;
      case 'weekly':
        dateClause = 'created >= startOfWeek() OR updated >= startOfWeek()';
        break;
      case 'monthly':
        dateClause = 'created >= startOfMonth() OR updated >= startOfMonth()';
        break;
      case 'all':
      default:
        dateClause = 'created >= -30d';
        break;
    }

    // JQL for issues assigned to user OR reported by user, with proper parentheses for AND/OR precedence
    return `(assignee = currentUser() OR reporter = currentUser()) AND (${dateClause}) ORDER BY updated DESC`;
  }

  async getIssues(credentials: JiraCredentials, filter: 'today' | 'weekly' | 'monthly' | 'all' = 'all', userEmail?: string) {
    try {
      const { authHeader, host } = this.buildAuthHeader(credentials);
      const jql = this.buildJqlQuery(userEmail || credentials.email, filter);
      
      // Migrated to POST /rest/api/3/search/jql (GET /rest/api/3/search was removed - HTTP 410)
      // See: https://developer.atlassian.com/changelog/#CHANGE-2046
      const response = await axios.post(
        `${host}/rest/api/3/search/jql`,
        {
          jql,
          maxResults: 50,
          fields: ['key', 'summary', 'status', 'priority', 'assignee', 'reporter', 'updated', 'created', 'issuetype'],
        },
        {
          headers: authHeader,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Jira issues:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateStatus(credentials: JiraCredentials, issueIdOrKey: string, status: string) {
    try {
      const { authHeader, host } = this.buildAuthHeader(credentials);
      // First, get the valid transitions for this issue
      const transitionsResponse = await axios.get(
        `${host}/rest/api/3/issue/${issueIdOrKey}/transitions`,
        {
          headers: authHeader,
        }
      );

      // Find the transition ID that matches the requested status
      const transition = transitionsResponse.data.transitions.find(
        (t: any) => t.name.toLowerCase() === status.toLowerCase()
      );

      if (!transition) {
        const availableStatuses = transitionsResponse.data.transitions.map((t: any) => t.name).join(', ');
        throw new Error(`Invalid status '${status}'. Available statuses: ${availableStatuses}`);
      }

      // Perform the transition
      const response = await axios.post(
        `${host}/rest/api/3/issue/${issueIdOrKey}/transitions`,
        {
          transition: {
            id: transition.id,
          },
        },
        {
          headers: authHeader,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error updating Jira status:', error.response?.data || error.message);
      throw error;
    }
  }

  async addAttachment(credentials: JiraCredentials, issueIdOrKey: string, fileBuffer: Buffer, fileName: string, mimeType: string) {
    try {
      const { authHeader, host } = this.buildAuthHeader(credentials);
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: mimeType,
      });

      const response = await axios.post(
        `${host}/rest/api/3/issue/${issueIdOrKey}/attachments`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            ...authHeader,
            'X-Atlassian-Token': 'no-check',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error adding Jira attachment:', error.response?.data || error.message);
      throw error;
    }
  }

  // Helper: Get user credentials from User object
  async getUserCredentials(user: any): Promise<JiraCredentials | null> {
    if (!user || !user.jiraEmail || !user.jiraApiToken || !user.jiraHost) {
      return null;
    }

    const decryptedToken = await jiraCredentialService.decrypt(user.jiraApiToken);
    return {
      email: user.jiraEmail,
      apiToken: decryptedToken,
      host: user.jiraHost,
    };
  }
}

export default new JiraService();