import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Google as GoogleIcon,
  Sync as SyncIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { CreateAgendaInput } from '../types/agenda';
import { DateTime } from 'luxon';
import { agendaApi } from '../services/api';

const AgendaPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [formData, setFormData] = useState<CreateAgendaInput>({
    title: '',
    description: '',
    date: DateTime.now().toISODate() || '',
    startTime: '09:00',
    endTime: '10:00',
    isRecurring: false,
    recurrenceRule: '',
    syncWithGoogle: false,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchAgendas = async () => {
    try {
      setLoading(true);
      const agendas: any[] = await agendaApi.getAll();
      const formattedEvents = agendas.map((a) => ({
        id: a.id,
        title: a.title,
        start: a.date + 'T' + a.startTime,
        end: a.date + 'T' + a.endTime,
        extendedProps: {
          description: a.description,
          completed: a.status === 'DONE',
          isRecurring: a.isRecurring,
          workType: a.workType,
          status: a.status,
          priority: a.priority,
        },
        backgroundColor: a.status === 'DONE' ? '#22c55e' : '#2563eb',
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching agendas:', error);
      setSnackbar({ open: true, message: 'Failed to load agendas', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendas();
  }, []);

  const handleDateClick = (arg: any) => {
    setFormData({
      ...formData,
      date: arg.dateStr,
      startTime: '09:00',
      endTime: '10:00',
    });
    setSelectedEvent(null);
    setOpenDialog(true);
  };

  const handleEventClick = (arg: any) => {
    const event = arg.event;
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.extendedProps.description || '',
      date: DateTime.fromISO(event.startStr).toISODate() || '',
      startTime: DateTime.fromISO(event.startStr).toFormat('HH:mm'),
      endTime: DateTime.fromISO(event.endStr).toFormat('HH:mm'),
      isRecurring: event.extendedProps.isRecurring || false,
      recurrenceRule: event.extendedProps.recurrenceRule || '',
      syncWithGoogle: !!event.extendedProps.googleEventId,
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title) return;

    try {
      if (selectedEvent) {
        await agendaApi.update(selectedEvent.id, formData);
        setSnackbar({ open: true, message: 'Agenda updated successfully', severity: 'success' });
      } else {
        await agendaApi.create(formData);
        setSnackbar({ open: true, message: 'Agenda created successfully', severity: 'success' });
      }
      setOpenDialog(false);
      fetchAgendas();
    } catch (error) {
      console.error('Error saving agenda:', error);
      setSnackbar({ open: true, message: 'Failed to save agenda', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (selectedEvent) {
      try {
        await agendaApi.delete(selectedEvent.id);
        setSnackbar({ open: true, message: 'Agenda deleted successfully', severity: 'success' });
        setOpenDialog(false);
        fetchAgendas();
      } catch (error) {
        console.error('Error deleting agenda:', error);
        setSnackbar({ open: true, message: 'Failed to delete agenda', severity: 'error' });
      }
    }
  };

  const handleGoogleSync = async () => {
    try {
      setSnackbar({ open: true, message: 'Syncing with Google Calendar...', severity: 'success' });
      await agendaApi.syncWithGoogle();
      setSnackbar({ open: true, message: 'Google Calendar sync complete', severity: 'success' });
      fetchAgendas();
    } catch (error) {
      console.error('Error syncing with Google:', error);
      setSnackbar({ open: true, message: 'Failed to sync with Google Calendar', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Daily Agenda
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSync}
            sx={{ mr: 2 }}
          >
            Sync Google Calendar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedEvent(null);
              setFormData({
                title: '',
                description: '',
                date: DateTime.now().toISODate() || '',
                startTime: '09:00',
                endTime: '10:00',
                isRecurring: false,
                recurrenceRule: '',
                syncWithGoogle: false,
              });
              setOpenDialog(true);
            }}
          >
            Add Agenda
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 2, borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
            events={events}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            nowIndicator={true}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
              hour12: false
            }}
          />
        </Paper>
      )}

      {/* Agenda Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedEvent ? 'Edit Agenda' : 'New Agenda'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Daily Standup"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                type="time"
                label="Start"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                type="time"
                label="End"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  />
                }
                label="Recurring Event (Daily/Weekly)"
              />
            </Grid>
            {formData.isRecurring && (
              <Grid size={12}>
                <TextField
                  fullWidth
                  select
                  label="Frequency"
                  value={formData.recurrenceRule || 'WEEKLY'}
                  onChange={(e) => setFormData({ ...formData, recurrenceRule: e.target.value })}
                >
                  <MenuItem value="DAILY">Daily</MenuItem>
                  <MenuItem value="WEEKLY">Weekly</MenuItem>
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                </TextField>
              </Grid>
            )}
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.syncWithGoogle}
                    onChange={(e) => setFormData({ ...formData, syncWithGoogle: e.target.checked })}
                  />
                }
                label="Sync with Google Calendar"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Box>
            {selectedEvent && (
              <Button color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
                Delete
              </Button>
            )}
          </Box>
          <Box>
            <Button onClick={() => setOpenDialog(false)} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSave}>
              Save Agenda
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AgendaPage;
