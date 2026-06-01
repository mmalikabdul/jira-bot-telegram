import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  Assignment as JiraIcon,
  CalendarMonth as DateIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { mockTasks, filterTasks } from '../utils/mockData';
import { taskApi } from '../services/api';
import type { Task, TaskStatus, TaskPriority } from '../types/task';

const Backlog = () => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Initialize status filter from URL params (from Dashboard click)
  const initialStatus = searchParams.get('status')?.toUpperCase() || 'ALL';
  const jiraKey = searchParams.get('jiraKey');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  
  // Apply URL params on mount
  useEffect(() => {
    if (jiraKey) {
      // Filter by specific Jira key
      setSearch(jiraKey);
    }
    if (initialStatus !== 'ALL') {
      setStatusFilter(initialStatus);
    }
  }, [jiraKey, initialStatus]);

  // Sync with Jira
  const handleSyncWithJira = async () => {
    try {
      setSyncing(true);
      const response: any = await taskApi.getJiraTasks();
      const jiraIssues = response.data || [];
      
      // Map Jira issues to local tasks
      const syncedTasks = jiraIssues.map((issue: any) => {
        const fields = issue.fields || issue;
        const statusName = fields.status?.name || 'Unknown';
        
        // Map Jira status to local TaskStatus (fixed: "to do" -> TODO)
        let localStatus: TaskStatus = 'BACKLOG';
        const statusLower = statusName.toLowerCase();
        if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('completed')) localStatus = 'DONE';
        else if (statusLower.includes('progress')) localStatus = 'IN_PROGRESS';
        else if (statusLower.includes('review')) localStatus = 'IN_REVIEW';
        else if (statusLower.includes('to do') || statusLower.includes('todo') || statusLower.includes('open') || statusLower.includes('new')) localStatus = 'TODO';
        else if (statusLower.includes('backlog')) localStatus = 'BACKLOG';
        else if (statusLower.includes('cancel')) localStatus = 'CANCELLED';
        
        return {
          id: issue.id || Math.random().toString(36).substr(2, 9),
          title: fields.summary || fields.title || 'No title',
          description: fields.description?.content?.[0]?.content?.[0]?.text || '',
          status: localStatus,
          priority: (fields.priority?.name?.toUpperCase() || 'MEDIUM') as TaskPriority,
          jiraKey: issue.key || '',
          jiraId: issue.id,
          createdAt: fields.created || new Date().toISOString(),
          updatedAt: fields.updated || new Date().toISOString(),
        };
      });
      
      // Merge with existing mock tasks - keep local tasks and add synced ones
      const existingJiraKeys = tasks.filter(t => t.jiraKey).map(t => t.jiraKey);
      const newSyncedTasks = syncedTasks.filter((t: any) => !existingJiraKeys.includes(t.jiraKey));
      
      setTasks([...newSyncedTasks, ...tasks]);
      setSnackbar({ open: true, message: `Synced ${newSyncedTasks.length} Jira issues`, severity: 'success' });
    } catch (error: any) {
      console.error('Error syncing with Jira:', error);
      setSnackbar({ open: true, message: 'Failed to sync with Jira', severity: 'error' });
    } finally {
      setSyncing(false);
    }
  };
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    jiraKey: '',
    estimatedHours: '',
    dueDate: '',
  });

  const filteredTasks = filterTasks(tasks, {
    search,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        jiraKey: task.jiraKey || '',
        estimatedHours: task.estimatedHours?.toString() || '',
        dueDate: task.dueDate || '',
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        jiraKey: '',
        estimatedHours: '',
        dueDate: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTask(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? {
        ...t,
        ...formData,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        updatedAt: new Date().toISOString(),
      } : t));
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks([newTask, ...tasks]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'DONE': return 'success';
      case 'IN_PROGRESS': return 'primary';
      case 'IN_REVIEW': return 'warning';
      case 'TODO': return 'info';
      case 'BACKLOG': return 'default';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT': return theme.palette.error.main;
      case 'HIGH': return theme.palette.warning.main;
      case 'MEDIUM': return theme.palette.info.main;
      case 'LOW': return theme.palette.success.main;
      default: return theme.palette.text.secondary;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Backlog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and prioritize your tasks
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<SyncIcon />}
          onClick={handleSyncWithJira}
          disabled={syncing}
          sx={{ mr: 2 }}
        >
          {syncing ? <CircularProgress size={20} /> : 'Sync Jira'}
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ px: 3, py: 1.25, borderRadius: 2 }}
        >
          Create Task
        </Button>
      </Box>

      {/* Status Filter Chips */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {['ALL', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BACKLOG'].map((status) => (
          <Chip
            key={status}
            label={status.replace('_', ' ')}
            onClick={() => setStatusFilter(status)}
            color={statusFilter === status ? 'primary' : 'default'}
            variant={statusFilter === status ? 'filled' : 'outlined'}
            size="small"
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: { xs: '1', md: '1' } }}>
              <TextField
                fullWidth
                placeholder="Search tasks by title, description, or Jira key..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                slotProps={{
                  input: {
                    startAdornment: (
                      <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    ),
                  },
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    backgroundColor: 'background.paper',
                  }
                }}
              />
            </Box>
            <Box sx={{ width: { xs: '150px', md: '150px' } }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="BACKLOG">Backlog</MenuItem>
                <MenuItem value="TODO">To Do</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="IN_REVIEW">In Review</MenuItem>
                <MenuItem value="DONE">Done</MenuItem>
              </TextField>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Task List */}
      <Stack spacing={2}>
        {filteredTasks.map((task) => (
          <Card 
            key={task.id}
            sx={{ 
              borderRadius: 3,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4],
              },
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {/* Priority Indicator */}
                <Box 
                  sx={{ 
                    width: 4, 
                    borderRadius: 2, 
                    bgcolor: getPriorityColor(task.priority),
                    alignSelf: 'stretch',
                    flexShrink: 0,
                  }} 
                />
                
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={task.status} 
                        size="small" 
                        color={getStatusColor(task.status)}
                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                      />
                      {task.jiraKey && (
                        <Chip 
                          icon={<JiraIcon />}
                          label={task.jiraKey} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => handleOpenDialog(task)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(task.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {task.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {task.description}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {task.dueDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DateIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                    {task.estimatedHours && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimeIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {task.estimatedHours}h est.
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {task.tags?.map(tag => (
                        <Chip 
                          key={tag.id} 
                          label={tag.name} 
                          size="small" 
                          sx={{ 
                            height: 20, 
                            fontSize: '0.65rem', 
                            bgcolor: alpha(tag.color, 0.1),
                            color: tag.color,
                            borderColor: alpha(tag.color, 0.2),
                            border: '1px solid',
                          }} 
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No tasks found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters
            </Typography>
          </Box>
        )}
      </Stack>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Task Title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  >
                    <MenuItem value="BACKLOG">Backlog</MenuItem>
                    <MenuItem value="TODO">To Do</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="IN_REVIEW">In Review</MenuItem>
                    <MenuItem value="DONE">Done</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </TextField>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    select
                    fullWidth
                    label="Priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                  >
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="URGENT">Urgent</MenuItem>
                  </TextField>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="Jira Key (e.g. PROJ-123)"
                    value={formData.jiraKey}
                    onChange={(e) => setFormData({ ...formData, jiraKey: e.target.value })}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="Est. Hours"
                    type="number"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  />
                </Box>
              </Box>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ px: 3 }}>
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Backlog;