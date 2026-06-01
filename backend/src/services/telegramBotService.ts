import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import prisma from '../config/database';
import agendaService from './agendaService';
import jiraService from './jiraService';

class TelegramBotService {
  private bot: TelegramBot | null = null;

  private lastCreatedIssue: Record<string, string> = {}; // chatId -> issueKey

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    console.log(`🔍 Checking Telegram Token: ${token ? 'Found (starts with ' + token.substring(0, 4) + ')' : 'Not Found'}`);
    if (token) {
      try {
        this.bot = new TelegramBot(token, { polling: true });
        this.setupHandlers();
        this.bot.getMe().then(me => {
          console.log(`🤖 Telegram Bot Service initialized as @${me.username}`);
        }).catch(err => {
          console.error('❌ Telegram Bot getMe error:', err.message);
        });
      } catch (error: any) {
        console.error('❌ Error initializing Telegram Bot:', error.message);
      }
    } else {
      console.warn('⚠️ TELEGRAM_BOT_TOKEN not found in environment variables');
    }
  }

  private setupHandlers() {
    if (!this.bot) return;

    // Log all messages for debugging
    this.bot.on('message', (msg) => {
      console.log(`📩 Received message from ${msg.from?.username || msg.from?.first_name}: ${msg.text}`);
    });

    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot?.sendMessage(
        chatId,
        'Welcome to Jira Task Monitor Bot! 🚀\n\n' +
          'Use /link <email> to link your account.\n' +
          'Use /agenda <title> | <date> | <startTime> | <endTime> to create a new agenda.\n' +
          'Use /task <projectKey> | <summary> | <description> to create a Jira task.\n' +
          'Use /status <Key> | <Status> to update task status.\n' +
          'Example: /agenda Daily Standup | 2026-06-01 | 09:00 | 09:30\n' +
          'Example: /task JOSS | Fix login bug | User cannot login\n' +
          'Example: /status JOSS-123 | DONE\n\n' +
          'You can also use the multi-line template:\n' +
          '/new\n' +
          'Squad: JOSS\n' +
          'Summary: My Task\n' +
          'Description: My Description\n\n' +
          '💡 Tip: Send a file/photo then use /attach <Key> to link it to a task.'
      );
    });

    // Link account
    this.bot.onText(/\/link (.+)/, async (msg, match) => {
      const chatId = msg.chat.id.toString();
      const email = match?.[1];

      if (!email) return;

      try {
        let user = await prisma.user.findUnique({ where: { email } });
        
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              telegramChatId: chatId,
              telegramUsername: msg.from?.username,
            },
          });
          this.bot?.sendMessage(chatId, `✅ Account linked successfully for ${email}!`);
        } else {
          // Auto-create user if not found
          const name = msg.from?.first_name || email.split('@')[0];
          user = await prisma.user.create({
            data: {
              email,
              name,
              password: 'telegram_user_placeholder', // They can reset this later via web
              telegramChatId: chatId,
              telegramUsername: msg.from?.username,
              role: 'USER'
            }
          });
          this.bot?.sendMessage(
            chatId,
            `✅ Account created and linked successfully!\n\n` +
            `Welcome, ${name}! You can now use /agenda and /task commands.`
          );
        }
      } catch (error) {
        console.error('Error linking telegram account:', error);
        this.bot?.sendMessage(chatId, '❌ Failed to link account. Please try again later.');
      }
    });

    // Create agenda via command
    // Format: /agenda Title | Date (YYYY-MM-DD) | Start (HH:mm) | End (HH:mm)
    this.bot.onText(/\/agenda(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id.toString();
      const input = match?.[1];

      if (!input) {
        this.bot?.sendMessage(
          chatId,
          '📝 *Create Agenda Help*\n\n' +
            'Format: `/agenda Title | Date | Start | End`\n' +
            'Example: `/agenda Daily Standup | 2026-06-01 | 09:00 | 09:30`',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      try {
        const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
        if (!user) {
          this.bot?.sendMessage(chatId, '❌ Your account is not linked. Use /link <email> first.');
          return;
        }

        const parts = input.split('|').map((p) => p.trim());
        if (parts.length < 4) {
          this.bot?.sendMessage(
            chatId,
            '❌ Invalid format. Use: /agenda Title | Date | Start | End'
          );
          return;
        }

        const [title, dateStr, startTime, endTime] = parts;
        const date = new Date(dateStr);

        if (isNaN(date.getTime())) {
          this.bot?.sendMessage(chatId, '❌ Invalid date format. Use YYYY-MM-DD.');
          return;
        }

        const agenda = await agendaService.createAgenda({
          userId: user.id,
          title,
          date,
          startTime,
          endTime,
          syncWithGoogle: true, // Auto sync for telegram created events
          googleCalendarId: 'primary', // Default to primary calendar
        });

        // Update with telegram info
        await prisma.agenda.update({
          where: { id: agenda.id },
          data: {
            createdVia: 'TELEGRAM',
            telegramMessageId: msg.message_id.toString(),
          },
        });

        this.bot?.sendMessage(
          chatId,
          `✅ Agenda created successfully!\n\n` +
            `📌 *${title}*\n` +
            `📅 ${dateStr}\n` +
            `⏰ ${startTime} - ${endTime}\n\n` +
            `Synced with Google Calendar! 🗓️`,
          { parse_mode: 'Markdown' }
        );
      } catch (error: any) {
        console.error('Error creating agenda via telegram:', error);
        this.bot?.sendMessage(chatId, `❌ Failed to create agenda: ${error.message}`);
      }
    });

    // Create Jira task via command
    // Format: /task ProjectKey | Summary | Description
    this.bot.onText(/\/task(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id.toString();
      const input = match?.[1];

      if (!input) {
        this.bot?.sendMessage(
          chatId,
          '🚀 *Create Jira Task Help*\n\n' +
            'Format: `/task ProjectKey | Summary | Description`\n' +
            'Example: `/task AEENK | Fix login bug | User cannot login`',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      try {
        const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
        if (!user) {
          this.bot?.sendMessage(chatId, '❌ Your account is not linked. Use /link <email> first.');
          return;
        }

        const parts = input.split('|').map((p) => p.trim());
        if (parts.length < 2) {
          this.bot?.sendMessage(chatId, '❌ Invalid format. Use: /task ProjectKey | Summary | Description');
          return;
        }

        const [projectKey, summary, description] = parts;

        const credentials = await jiraService.getUserCredentials(user);
        if (!credentials) {
          this.bot?.sendMessage(chatId, '❌ Jira credentials not configured. Please set up your Jira account.');
          return;
        }

        this.bot?.sendMessage(chatId, '⏳ Creating Jira task...');

        const jiraIssue = await jiraService.createIssue(credentials, {
          projectKey,
          summary,
          description,
          assigneeId: user.jiraAccountId || undefined,
          update: projectKey === 'JOSS' ? {
            customfield_10553: [
              { add: 'nonkak' } // Based on your screenshot
            ]
          } : undefined
        });

        // Save to local database as well
        await prisma.task.create({
          data: {
            title: summary,
            description: description,
            jiraId: jiraIssue.id,
            jiraKey: jiraIssue.key,
            userId: user.id,
            status: 'TODO',
            priority: 'MEDIUM',
          },
        });

        this.bot?.sendMessage(
          chatId,
          `✅ Jira task created successfully!\n\n` +
            `Key: ${jiraIssue.key}\n` +
            `Summary: ${summary}\n` +
            `Link: ${process.env.JIRA_HOST}/browse/${jiraIssue.key}`
        );
      } catch (error: any) {
        console.error('Error creating Jira task via telegram:', error);
        const errorMessage = error.response?.data?.errors
          ? Object.values(error.response.data.errors).join(', ')
          : error.message;
        this.bot?.sendMessage(chatId, `❌ Failed to create Jira task: ${errorMessage}`);
      }
    });

    // Update Status
    // Format: /status Key | Status
    this.bot.onText(/\/status(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id.toString();
      const input = match?.[1];

      if (!input) {
        this.bot?.sendMessage(
          chatId,
          '🔄 *Update Status Help*\n\n' +
            'Format: `/status Key | Status`\n' +
            'Example: `/status JOSS-123 | DONE`',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      try {
        const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
        if (!user) {
          this.bot?.sendMessage(chatId, '❌ Your account is not linked. Use /link <email> first.');
          return;
        }

        const parts = input.split('|').map((p) => p.trim());
        if (parts.length < 2) {
          this.bot?.sendMessage(chatId, '❌ Invalid format. Use: /status Key | Status');
          return;
        }

        const [key, status] = parts;
        
        // Map common status names to enum values and Jira statuses
        const statusMap: Record<string, { enum: string; jira: string }> = {
          'todo': { enum: 'TODO', jira: 'To Do' },
          'to do': { enum: 'TODO', jira: 'To Do' },
          'inprogress': { enum: 'IN_PROGRESS', jira: 'In Progress' },
          'in progress': { enum: 'IN_PROGRESS', jira: 'In Progress' },
          'in_progress': { enum: 'IN_PROGRESS', jira: 'In Progress' },
          'done': { enum: 'DONE', jira: 'Done' },
          'backlog': { enum: 'TODO', jira: 'Backlog' },
          'review': { enum: 'IN_PROGRESS', jira: 'Review' },
        };
        
        const mapped = statusMap[status.toLowerCase()] || { enum: status.toUpperCase().replace(/\s+/g, '_'), jira: status };
        
        const credentials = await jiraService.getUserCredentials(user);
        if (!credentials) {
          this.bot?.sendMessage(chatId, '❌ Jira credentials not configured. Please set up your Jira account.');
          return;
        }

        this.bot?.sendMessage(chatId, `⏳ Updating status for ${key} to ${mapped.jira}...`);

        await jiraService.updateStatus(credentials, key, mapped.jira);

        // Update local DB if task exists
        await prisma.task.updateMany({
          where: { jiraKey: key },
          data: { status: mapped.enum }
        });

        this.bot?.sendMessage(chatId, `✅ Status for *${key}* updated to *${mapped.jira}*!`, { parse_mode: 'Markdown' });
      } catch (error: any) {
        console.error('Error updating status via telegram:', error);
        this.bot?.sendMessage(chatId, `❌ Failed to update status: ${error.message}`);
      }
    });

    // Multi-line /new command
    this.bot.onText(/\/new/, async (msg) => {
      const chatId = msg.chat.id.toString();
      const text = msg.text || '';
      
      // If it's just "/new", show template
      if (text.trim() === '/new') {
        this.bot?.sendMessage(
          chatId,
          '📝 *Multi-line Task Template*\n\n' +
            'Copy and fill this:\n' +
            '```\n' +
            '/new\n' +
            'Squad: JOSS\n' +
            'Summary: My Task Title\n' +
            'Description: Detailed description here\n' +
            '```',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Parse multi-line
      try {
        const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
        if (!user) {
          this.bot?.sendMessage(chatId, '❌ Your account is not linked. Use /link <email> first.');
          return;
        }

        const lines = text.split('\n');
        let squad = '', summary = '', description = '';

        lines.forEach(line => {
          if (line.toLowerCase().startsWith('squad:')) squad = line.split(':')[1].trim();
          if (line.toLowerCase().startsWith('summary:')) summary = line.split(':')[1].trim();
          if (line.toLowerCase().startsWith('description:')) description = line.split(':')[1].trim();
        });

        if (!squad || !summary) {
          this.bot?.sendMessage(chatId, '❌ Missing required fields (Squad, Summary).');
          return;
        }

        const credentials = await jiraService.getUserCredentials(user);
        if (!credentials) {
          this.bot?.sendMessage(chatId, '❌ Jira credentials not configured. Please set up your Jira account.');
          return;
        }

        this.bot?.sendMessage(chatId, '⏳ Creating Jira task from template...');

        const jiraIssue = await jiraService.createIssue(credentials, {
          projectKey: squad,
          summary,
          description,
          assigneeId: user.jiraAccountId || undefined,
          update: squad === 'JOSS' ? {
            customfield_10553: [{ add: 'nonkak' }]
          } : undefined
        });

        this.lastCreatedIssue[chatId] = jiraIssue.key;

        await prisma.task.create({
          data: {
            title: summary,
            description,
            jiraId: jiraIssue.id,
            jiraKey: jiraIssue.key,
            userId: user.id,
            status: 'TODO',
            priority: 'MEDIUM',
          },
        });

        this.bot?.sendMessage(
          chatId,
          `✅ Task created!\n\n` +
            `Key: *${jiraIssue.key}*\n` +
            `Summary: ${summary}\n\n` +
            `💡 You can now send a photo/file to attach it to this task.`,
          { parse_mode: 'Markdown' }
        );
      } catch (error: any) {
        console.error('Error in /new command:', error);
        this.bot?.sendMessage(chatId, `❌ Failed: ${error.message}`);
      }
    });

    // Handle Attachments (Photos & Documents)
    this.bot.on('photo', async (msg) => {
      const chatId = msg.chat.id.toString();
      const issueKey = this.lastCreatedIssue[chatId];
      
      if (!issueKey) {
        this.bot?.sendMessage(chatId, '❓ Which task should I attach this to? Use `/attach <Key>`', { parse_mode: 'Markdown' });
        return;
      }

      await this.handleFileAttachment(msg, issueKey, 'photo');
    });

    this.bot.on('document', async (msg) => {
      const chatId = msg.chat.id.toString();
      const issueKey = this.lastCreatedIssue[chatId];
      
      if (!issueKey) {
        this.bot?.sendMessage(chatId, '❓ Which task should I attach this to? Use `/attach <Key>`', { parse_mode: 'Markdown' });
        return;
      }

      await this.handleFileAttachment(msg, issueKey, 'document');
    });

    // Manual attach command
    this.bot.onText(/\/attach\s+(.+)/, async (msg, match) => {
      const chatId = msg.chat.id.toString();
      const issueKey = match?.[1]?.trim();
      
      if (!issueKey) return;
      
      this.lastCreatedIssue[chatId] = issueKey;
      this.bot?.sendMessage(chatId, `📎 Ready to attach files to *${issueKey}*. Please send the file now.`, { parse_mode: 'Markdown' });
    });

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      this.bot?.sendMessage(
        chatId,
        'Available commands:\n' +
          '/start - Start the bot\n' +
          '/link <email> - Link your account\n' +
          '/agenda <title> | <date> | <startTime> | <endTime> - Create agenda\n' +
          '/task <projectKey> | <summary> | <description> - Create Jira task\n' +
          '/status <Key> | <Status> - Update task status\n' +
          '/new - Multi-line task creation\n' +
          '/attach <Key> - Set target task for next attachment\n' +
          '/today - See today\'s agendas\n' +
          '/help - Show this help message'
      );
    });

    // Today's agendas
    this.bot.onText(/\/today/, async (msg) => {
      const chatId = msg.chat.id.toString();
      try {
        const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
        if (!user) {
          this.bot?.sendMessage(chatId, '❌ Your account is not linked. Use /link <email> first.');
          return;
        }

        const agendas = await agendaService.getTodayAgendas(user.id);
        if (agendas.length === 0) {
          this.bot?.sendMessage(chatId, '📭 No agendas for today.');
          return;
        }

        let message = '📅 *Today\'s Agendas:*\n\n';
        agendas.forEach((a, i) => {
          message += `${i + 1}. *${a.title}*\n   ⏰ ${a.startTime} - ${a.endTime}\n`;
          if (a.notes) message += `   📝 ${a.notes}\n`;
          message += '\n';
        });

        this.bot?.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Error fetching today agendas via telegram:', error);
        this.bot?.sendMessage(chatId, '❌ Failed to fetch agendas.');
      }
    });
  }

  /**
   * Send notification to user
   */
  async sendNotification(userId: string, message: string) {
    if (!this.bot) return;

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.telegramChatId) {
        await this.bot.sendMessage(user.telegramChatId, message, { parse_mode: 'Markdown' });
      }
    } catch (error) {
      console.error('Error sending telegram notification:', error);
    }
  }

  private async handleFileAttachment(msg: TelegramBot.Message, issueKey: string, type: 'photo' | 'document') {
    const chatId = msg.chat.id.toString();
    if (!this.bot) return;

    try {
      // Get user for Jira credentials
      const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
      if (!user) {
        this.bot.sendMessage(chatId, '❌ Your account is not linked. Use /link <email> first.');
        return;
      }

      const credentials = await jiraService.getUserCredentials(user);
      if (!credentials) {
        this.bot.sendMessage(chatId, '❌ Jira credentials not configured. Please set up your Jira account.');
        return;
      }

      this.bot.sendMessage(chatId, `⏳ Uploading attachment to ${issueKey}...`);

      let fileId = '';
      let fileName = '';
      let mimeType = '';

      if (type === 'photo' && msg.photo) {
        // Get the largest photo
        const photo = msg.photo[msg.photo.length - 1];
        fileId = photo.file_id;
        fileName = `photo_${Date.now()}.jpg`;
        mimeType = 'image/jpeg';
      } else if (type === 'document' && msg.document) {
        fileId = msg.document.file_id;
        fileName = msg.document.file_name || `file_${Date.now()}`;
        mimeType = msg.document.mime_type || 'application/octet-stream';
      }

      if (!fileId) return;

      const fileLink = await this.bot.getFileLink(fileId);
      const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      await jiraService.addAttachment(credentials, issueKey, buffer, fileName, mimeType);

      this.bot.sendMessage(chatId, `✅ Successfully attached *${fileName}* to *${issueKey}*!`, { parse_mode: 'Markdown' });
    } catch (error: any) {
      console.error('Error handling attachment:', error);
      this.bot.sendMessage(chatId, `❌ Failed to upload attachment: ${error.message}`);
    }
  }
}

export default new TelegramBotService();
