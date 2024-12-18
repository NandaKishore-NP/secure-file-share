import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Download, Visibility, Close } from '@mui/icons-material';
import { fetchSharedFiles } from '../../store/slices/fileSlice';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const SharedFiles = () => {
  const dispatch = useDispatch();
  const { sharedFiles, loading, error } = useSelector((state) => state.files);
  const { token } = useSelector((state) => state.auth);
  const [viewFile, setViewFile] = useState(null);
  const [viewError, setViewError] = useState(null);
  const [fileContent, setFileContent] = useState(null);

  useEffect(() => {
    dispatch(fetchSharedFiles());
  }, [dispatch]);

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await axios.get(`${API_URL}/files/${fileId}/download/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleView = async (fileId, fileName) => {
    try {
      setViewFile({ id: fileId, name: fileName });
      setViewError(null);
      setFileContent(null);

      const response = await axios.get(`${API_URL}/files/${fileId}/download/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          download: false
        },
        responseType: 'blob',
      });

      // Read the blob as text
      const reader = new FileReader();
      reader.onload = () => {
        setFileContent(reader.result);
      };
      reader.onerror = () => {
        setViewError('Error reading file content');
      };
      reader.readAsText(response.data);
    } catch (error) {
      console.error('View error:', error);
      setViewError(error.response?.data?.detail || 'Error loading file');
    }
  };

  const handleCloseView = () => {
    setViewFile(null);
    setFileContent(null);
    setViewError(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatExpiryDate = (dateString) => {
    if (!dateString) return 'Never';
    const expiryDate = new Date(dateString);
    if (expiryDate < new Date()) return 'Expired';
    return formatDate(dateString);
  };

  const isShareExpired = (share) => {
    if (!share.expires_at) return false;
    return new Date(share.expires_at) < new Date();
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
        Shared With Me
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message || error.detail || 'Error loading shared files'}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Shared By</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Permission</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!sharedFiles || sharedFiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1" color="textSecondary">
                    No files have been shared with you
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sharedFiles.map((share) => {
                const expired = isShareExpired(share);
                return (
                  <TableRow 
                    key={share.id}
                    sx={expired ? { backgroundColor: 'rgba(0, 0, 0, 0.04)' } : {}}
                  >
                    <TableCell>{share.file.name}</TableCell>
                    <TableCell>{share.shared_by}</TableCell>
                    <TableCell>{formatFileSize(share.file.size)}</TableCell>
                    <TableCell>
                      <Chip
                        label={share.permission}
                        color={share.permission === 'DOWNLOAD' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={expired ? 'Expired' : (share.expires_at ? 'Active' : 'Never Expires')}
                        color={expired ? 'error' : (share.expires_at ? 'success' : 'primary')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {!expired && (
                        share.permission === 'DOWNLOAD' ? (
                          <IconButton
                            color="primary"
                            onClick={() => handleDownload(share.file.id, share.file.name)}
                          >
                            <Download />
                          </IconButton>
                        ) : (
                          <IconButton 
                            color="primary"
                            onClick={() => handleView(share.file.id, share.file.name)}
                          >
                            <Visibility />
                          </IconButton>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={Boolean(viewFile)}
        onClose={handleCloseView}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {viewFile?.name}
            </Typography>
            <IconButton onClick={handleCloseView} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewError ? (
            <Alert severity="error">{viewError}</Alert>
          ) : !fileContent ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordWrap: 'break-word',
              maxHeight: '500px',
              overflow: 'auto'
            }}>
              {fileContent}
            </pre>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SharedFiles; 