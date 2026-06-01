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
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    jiraEmail: '',
    jiraApiToken: '',
    jiraHost: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response: any = await authApi.login(
        formData.email,
        formData.jiraEmail,
        formData.jiraApiToken,
        formData.jiraHost
      );
      if (response.success) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Check if user needs Jira setup
        if (response.data.user.needsJiraSetup) {
          navigate('/jira-setup');
        } else {
          navigate('/');
        }
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
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
        {/* Logo & Title */}
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
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in with your Jira credentials
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label="Account Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              autoFocus
              disabled={loading}
              helperText="This email identifies your account"
            />

            <TextField
              fullWidth
              label="Jira Email"
              type="email"
              value={formData.jiraEmail}
              onChange={(e) => setFormData({ ...formData, jiraEmail: e.target.value })}
              required
              disabled={loading}
              helperText="Email registered in Jira"
            />

            <TextField
              fullWidth
              label="Jira API Token"
              type={showPassword ? 'text' : 'password'}
              value={formData.jiraApiToken}
              onChange={(e) => setFormData({ ...formData, jiraApiToken: e.target.value })}
              required
              disabled={loading}
              helperText="Generate at id.atlassian.com/manage-profile/security/api-tokens"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
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
              helperText="Your Jira instance URL"
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
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>
        </form>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            New User?
          </Typography>
        </Divider>

        {/* Footer */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            First time? Enter your details above and an account will be created automatically.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Login;
