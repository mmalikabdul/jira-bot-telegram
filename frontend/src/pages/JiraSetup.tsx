import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const JiraSetup = () => {
  const navigate = useNavigate();
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    jiraEmail: '',
    jiraApiToken: '',
    jiraHost: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response: any = await authApi.updateJiraCredentials(
        formData.jiraEmail,
        formData.jiraApiToken,
        formData.jiraHost
      );

      if (response.success) {
        // Update stored user data
        const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...existingUser,
          needsJiraSetup: false
        }));
        navigate('/');
      } else {
        setError(response.error || 'Failed to connect Jira account');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '1.75rem',
              mb: 2,
            }}
          >
            J
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Connect Your Jira Account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Link your Jira account to access your tasks and projects
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label="Jira Email"
              type="email"
              value={formData.jiraEmail}
              onChange={(e) => setFormData({ ...formData, jiraEmail: e.target.value })}
              required
              autoFocus
              disabled={loading}
              helperText="Email registered in Jira"
            />

            <TextField
              fullWidth
              label="Jira API Token"
              type={showToken ? 'text' : 'password'}
              value={formData.jiraApiToken}
              onChange={(e) => setFormData({ ...formData, jiraApiToken: e.target.value })}
              required
              disabled={loading}
              helperText="Generate at id.atlassian.com/manage-profile/security/api-tokens"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowToken(!showToken)} edge="end">
                        {showToken ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
            />

            <TextField
              fullWidth
              label="Jira Host"
              value={formData.jiraHost}
              onChange={(e) => setFormData({ ...formData, jiraHost: e.target.value })}
              required
              disabled={loading}
              placeholder="https://your-domain.atlassian.net"
              helperText="Your Jira instance URL (e.g., https://your-company.atlassian.net)"
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              {loading ? 'Connecting...' : 'Connect Jira Account'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default JiraSetup;
