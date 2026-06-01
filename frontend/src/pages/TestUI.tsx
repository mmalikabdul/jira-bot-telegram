import { Box, Typography, Paper, Chip, Button, Card, CardContent, Stack } from '@mui/material';

const TestUI = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        🎨 UI Test Page
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Jika Anda bisa melihat halaman ini, berarti React dan MUI sudah berfungsi dengan baik!
      </Typography>

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Status Chips
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="To Do" color="default" />
              <Chip label="In Progress" color="primary" />
              <Chip label="Done" color="success" />
              <Chip label="Warning" color="warning" />
              <Chip label="Error" color="error" />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Buttons
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained">Primary</Button>
              <Button variant="contained" color="secondary">Secondary</Button>
              <Button variant="outlined">Outlined</Button>
              <Button variant="text">Text</Button>
            </Box>
          </CardContent>
        </Card>

        <Paper sx={{ p: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            ✅ Aplikasi Berjalan Normal
          </Typography>
          <Typography variant="body1">
            Ini adalah halaman test untuk memastikan UI components berfungsi.
            Jika Anda bisa melihat ini, berarti tidak ada masalah dengan setup MUI dan React.
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
};

export default TestUI;
