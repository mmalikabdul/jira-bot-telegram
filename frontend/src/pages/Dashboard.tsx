import { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, CircularProgress, Alert, Chip, Divider, Stack, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Assignment,
  CheckCircle,
  Schedule,
  Refresh,
  Warning,
  Link,
} from '@mui/icons-material';
import { taskApi } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [jiraTasks, setJiraTasks] = useState<any[]>([]);
  const [jiraError, setJiraError] = useState<string>('');
  const [needsJiraSetup, setNeedsJiraSetup] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'weekly' | 'monthly' | 'all'>('all');
  const [fetchingJira, setFetchingJira] = useState(false);

  const fetchJiraTasks = async (filter: 'today' | 'weekly' | 'monthly' | 'all') => {
    setFetchingJira(true);
    setJiraError('');
    setNeedsJiraSetup(false);
    
    try {
      const jiraRes: any = await taskApi.getJiraTasks(filter);
      setJiraTasks(jiraRes.data || []);
    } catch (error: any) {
      console.error('Error fetching Jira tasks:', error);
      const errorMsg = error.message || 'Failed to fetch Jira tasks';
      
      // Check if user needs Jira setup
      if (errorMsg.includes('Jira credentials not configured') || errorMsg.includes('needsJiraSetup') || errorMsg.includes('401') || errorMsg.includes('400')) {
        setNeedsJiraSetup(true);
        setJiraError('');
      } else {
        setJiraError(errorMsg);
        setNeedsJiraSetup(false);
      }
    } finally {
      setFetchingJira(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats independently
        try {
          const statsRes: any = await taskApi.getStats();
          setStats(statsRes.data);
        } catch (error) {
          console.error('Error fetching stats:', error);
          // Set default stats if fetch fails
          setStats({ total: 0, byStatus: { todo: 0, inProgress: 0, done: 0 } });
        }

        // Fetch Jira tasks
        await fetchJiraTasks(timeFilter);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFilter]);

  // Redirect to Jira setup if needed
  useEffect(() => {
    if (needsJiraSetup) {
      // Don't redirect immediately, show warning first
      const timer = setTimeout(() => {
        navigate('/jira-setup', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [needsJiraSetup, navigate]);

  const handleFilterChange = (filter: 'today' | 'weekly' | 'monthly' | 'all') => {
    setTimeFilter(filter);
  };

  const handleRefresh = () => {
    fetchJiraTasks(timeFilter);
  };

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats?.total || '0',
      change: 'From database',
      icon: <Assignment />,
      color: '#2563eb',
    },
    {
      title: 'Completed',
      value: stats?.byStatus?.done || '0',
      change: 'Done status',
      icon: <CheckCircle />,
      color: '#10b981',
    },
    {
      title: 'In Progress',
      value: stats?.byStatus?.inProgress || '0',
      change: 'Active tasks',
      icon: <Schedule />,
      color: '#f59e0b',
    },
    {
      title: 'Jira Issues',
      value: jiraTasks.length.toString(),
      change: fetchingJira ? 'Loading...' : timeFilter === 'all' ? 'All time' : `This ${timeFilter}`,
      icon: <TrendingUp />,
      color: needsJiraSetup ? '#ef4444' : jiraError ? '#f59e0b' : '#8b5cf6',
    },
  ];

  const getStatusColor = (status: string) => {
    const lower = status.toLowerCase();
    if (lower.includes('done') || lower.includes('closed') || lower.includes('selesai')) return { bg: '#dcfce7', color: '#166534' };
    if (lower.includes('progress') || lower.includes('review') || lower.includes('progres')) return { bg: '#fef3c7', color: '#92400e' };
    if (lower.includes('todo') || lower.includes('open') || lower.includes('baru')) return { bg: '#dbeafe', color: '#1e40af' };
    if (lower.includes('backlog')) return { bg: '#f3f4f6', color: '#374151' };
    return { bg: '#f3f4f6', color: '#374151' };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's what's happening with your tasks.
        </Typography>
      </Box>

      {/* Jira Setup Warning */}
      {needsJiraSetup && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/jira-setup')}>
              Setup Now
            </Button>
          }
        >
          Jira credentials not configured. Please set up your Jira account to see issues.
        </Alert>
      )}

      {/* Jira Error Alert */}
      {jiraError && !needsJiraSetup && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Tooltip title="Retry">
              <IconButton size="small" color="inherit" onClick={handleRefresh}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        >
          {jiraError}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3}>
        {statCards.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: stat.color, fontWeight: 600 }}>
                      {stat.change}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: `${stat.color}15`,
                      color: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Jira Issues */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Jira Issues
            {fetchingJira && <CircularProgress size={20} sx={{ ml: 1 }} />}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {(['all', 'today', 'weekly', 'monthly'] as const).map((filter) => (
              <Chip
                key={filter}
                label={filter.charAt(0).toUpperCase() + filter.slice(1)}
                size="small"
                onClick={() => handleFilterChange(filter)}
                color={timeFilter === filter ? 'primary' : 'default'}
                variant={timeFilter === filter ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
            <Tooltip title="Refresh Jira data">
              <IconButton onClick={handleRefresh} size="small" disabled={fetchingJira}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {jiraTasks.length === 0 && !jiraError && !needsJiraSetup ? (
          <Card elevation={0} sx={{ border: '1px dashed', borderColor: 'divider', p: 4, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Assignment sx={{ fontSize: 48, color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary">
                No Jira issues found for this time period.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Try changing the filter or check your Jira project.
              </Typography>
            </Box>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {jiraTasks.slice(0, 10).map((issue: any) => {
              // Handle different Jira API response structures
              const fields = issue.fields || issue;
              const summary = fields.summary || fields.title || 'No title';
              const status = fields.status?.name || fields.status || 'Unknown';
              const issueKey = issue.key || fields.key || 'N/A';
              const priority = fields.priority?.name || fields.priority || '';
              const issueType = fields.issuetype?.name || fields.issuetype || '';
              
              // Map Jira status to Backlog filter
              const getBacklogFilter = (s: string) => {
                const lower = s.toLowerCase();
                if (lower.includes('done') || lower.includes('closed') || lower.includes('selesai')) return 'done';
                if (lower.includes('progress') || lower.includes('review') || lower.includes('progres')) return 'in_progress';
                return 'todo';
              };
              
              const statusColors = getStatusColor(status);
              
              return (
                <Grid size={12} key={issue.id || issueKey || Math.random()}>
                  <Card
                    elevation={0}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }
                    }}
                    onClick={() => {
                      const filter = getBacklogFilter(status);
                      navigate(`/backlog?jiraKey=${issueKey}&status=${filter}`);
                    }}
                  >
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
                              {issueKey}
                            </Typography>
                            {issueType && (
                              <Chip label={issueType} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                            )}
                            {priority && (
                              <Chip 
                                label={priority} 
                                size="small" 
                                sx={{ 
                                  height: 20, 
                                  fontSize: '0.65rem',
                                  bgcolor: priority.toLowerCase().includes('high') || priority.toLowerCase().includes('critical') ? '#fee2e2' : '#f3f4f6',
                                  color: priority.toLowerCase().includes('high') || priority.toLowerCase().includes('critical') ? '#991b1b' : '#374151'
                                }} 
                              />
                            )}
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                            {summary}
                          </Typography>
                        </Box>
                        <Box sx={{ flexShrink: 0 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              bgcolor: statusColors.bg,
                              color: statusColors.color,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              fontSize: '0.7rem'
                            }}
                          >
                            {status}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<Link />}
            onClick={() => navigate('/jira-setup')}
          >
            Configure Jira
          </Button>
          <Button 
            variant="outlined" 
            size="large" 
            onClick={handleRefresh}
            disabled={fetchingJira}
            startIcon={fetchingJira ? <CircularProgress size={20} /> : <Refresh />}
          >
            Sync with Jira
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;