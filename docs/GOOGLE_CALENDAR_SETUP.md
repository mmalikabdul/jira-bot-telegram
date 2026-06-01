# Google Calendar Integration Setup Guide

This guide explains how to set up the Google Calendar API for the Jira Task Monitor project.

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on the project dropdown and select "New Project".
3. Give your project a name (e.g., `jira-task-monitor`) and click "Create".

## 2. Enable Google Calendar API

1. In the Google Cloud Console, navigate to **APIs & Services > Library**.
2. Search for "Google Calendar API".
3. Click on it and then click "Enable".

## 3. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**.
2. Select "External" and click "Create".
3. Fill in the required app information:
   - App name: `Jira Task Monitor`
   - User support email: Your email
   - Developer contact information: Your email
4. Click "Save and Continue".
5. In the "Scopes" step, click "Add or Remove Scopes".
6. Add the following scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
7. Click "Update" and then "Save and Continue".
8. Add yourself as a test user in the "Test users" step.
9. Click "Save and Continue" and then "Back to Dashboard".

## 4. Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**.
2. Click "Create Credentials" and select "OAuth client ID".
3. Select "Web application" as the application type.
4. Add a name (e.g., `Jira Task Monitor Web`).
5. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/agendas/google/callback`
6. Click "Create".
7. You will see your **Client ID** and **Client Secret**. Copy these.

## 5. Update Environment Variables

Update your `backend/.env` file with the credentials:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/agendas/google/callback
```

## 6. Usage in the App

1. Go to the **Agenda** page in the application.
2. Click the **Sync Google Calendar** button.
3. You will be redirected to the Google login page.
4. After authorizing, you will be redirected back to the app.
5. Now, when you create or edit an agenda, you can check the **Sync with Google Calendar** option to automatically sync it with your Google Calendar.
6. Recurring events (Daily, Weekly, Monthly) are also supported and will be synced as recurring events in Google Calendar.
