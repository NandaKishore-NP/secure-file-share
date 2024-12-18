import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload,
  Folder,
  Share,
  Storage,
} from '@mui/icons-material';
import { fetchFiles, fetchSharedFiles } from '../store/slices/fileSlice';

const StatCard = ({ icon, title, value, color }) => (
  <Paper
    elevation={3}
    sx={{
      p: 3,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      bgcolor: `${color}.light`,
      color: `${color}.dark`,
    }}
  >
    <Box sx={{ mb: 2 }}>{icon}</Box>
    <Typography variant="h6" component="div" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h4" component="div">
      {value}
    </Typography>
  </Paper>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { files, sharedFiles, loading } = useSelector((state) => state.files);

  useEffect(() => {
    dispatch(fetchFiles());
    dispatch(fetchSharedFiles());
  }, [dispatch]);

  const getTotalStorage = () => {
    const totalBytes = files.reduce((acc, file) => acc + file.size, 0);
    if (totalBytes < 1024 * 1024) {
      return `${(totalBytes / 1024).toFixed(2)} KB`;
    }
    return `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Folder sx={{ fontSize: 40 }} />}
            title="My Files"
            value={files.length}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Share sx={{ fontSize: 40 }} />}
            title="Shared With Me"
            value={sharedFiles.length}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CloudUpload sx={{ fontSize: 40 }} />}
            title="Uploads Today"
            value={files.filter(
              (file) =>
                new Date(file.created_at).toDateString() ===
                new Date().toDateString()
            ).length}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Storage sx={{ fontSize: 40 }} />}
            title="Total Storage"
            value={getTotalStorage()}
            color="warning"
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 