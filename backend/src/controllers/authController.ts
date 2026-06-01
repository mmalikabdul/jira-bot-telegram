import { Request, Response } from 'express';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import jiraCredentialService from '../services/jiraCredentialService';

export class AuthController {
  // Login with Jira email and API token
  async login(req: Request, res: Response) {
    try {
      const { email, jiraEmail, jiraApiToken, jiraHost } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      // Check if user exists
      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        // Auto-register user with Jira credentials
        if (!jiraEmail || !jiraApiToken || !jiraHost) {
          return res.status(400).json({
            success: false,
            error: 'Jira email, API token, and host are required for new users'
          });
        }

        // Verify Jira credentials
        try {
          const jiraAuth = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64');
          await axios.get(`${jiraHost}/rest/api/3/myself`, {
            headers: {
              Authorization: `Basic ${jiraAuth}`,
              Accept: 'application/json',
            },
          });
        } catch (error) {
          return res.status(401).json({
            success: false,
            error: 'Invalid Jira credentials'
          });
        }

        // Encrypt Jira API token
        const encryptedToken = await jiraCredentialService.encrypt(jiraApiToken);

        // Create user
        user = await prisma.user.create({
          data: {
            name: email.split('@')[0],
            email,
            password: '', // No password for Jira login
            jiraEmail,
            jiraApiToken: encryptedToken,
            jiraHost,
            role: 'USER'
          }
        });
      } else {
        // User exists - if they have Jira credentials, verify the token
        if (jiraEmail && jiraApiToken && jiraHost) {
          // Verify and update Jira credentials
          try {
            const jiraAuth = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64');
            await axios.get(`${jiraHost}/rest/api/3/myself`, {
              headers: {
                Authorization: `Basic ${jiraAuth}`,
                Accept: 'application/json',
              },
            });

            const encryptedToken = await jiraCredentialService.encrypt(jiraApiToken);
            await prisma.user.update({
              where: { id: user.id },
              data: { jiraEmail, jiraApiToken: encryptedToken, jiraHost }
            });
          } catch (error) {
            return res.status(401).json({
              success: false,
              error: 'Invalid Jira credentials'
            });
          }
        } else if (!user.jiraEmail || !user.jiraApiToken) {
          // User exists but no Jira credentials - prompt for Jira setup
          const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
          );

          return res.json({
            success: true,
            data: {
              token,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                needsJiraSetup: true
              }
            }
          });
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            needsJiraSetup: false
          }
        }
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to login'
      });
    }
  }

  // Update Jira credentials for existing user
  async updateJiraCredentials(req: Request, res: Response) {
    try {
      const { jiraEmail, jiraApiToken, jiraHost } = req.body;
      const userId = (req as any).userId;

      if (!jiraEmail || !jiraApiToken || !jiraHost) {
        return res.status(400).json({
          success: false,
          error: 'Jira email, API token, and host are required'
        });
      }

      // Verify Jira credentials
      try {
        const jiraAuth = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64');
        const response = await axios.get(`${jiraHost}/rest/api/3/myself`, {
          headers: {
            Authorization: `Basic ${jiraAuth}`,
            Accept: 'application/json',
          },
        });

        const encryptedToken = await jiraCredentialService.encrypt(jiraApiToken);

        // Update user
        const user = await prisma.user.update({
          where: { id: userId },
          data: {
            jiraEmail,
            jiraApiToken: encryptedToken,
            jiraHost,
            jiraAccountId: response.data.accountId
          }
        });

        res.json({
          success: true,
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            jiraEmail: user.jiraEmail,
            jiraAccountId: user.jiraAccountId
          }
        });
      } catch (error: any) {
        return res.status(401).json({
          success: false,
          error: 'Invalid Jira credentials: ' + (error.response?.data?.errorMessages?.[0] || error.message)
        });
      }
    } catch (error) {
      console.error('Error updating Jira credentials:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update Jira credentials'
      });
    }
  }

  async register(req: Request, res: Response) {
    return res.status(403).json({
      success: false,
      error: 'Registration is disabled. Please login with your Jira credentials.'
    });
  }
}

export default new AuthController();
