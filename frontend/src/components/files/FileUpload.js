import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  LinearProgress,
  Alert,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import {
  uploadFile,
  generateEncryptionKey,
  encryptFile,
} from '../../store/slices/fileSlice';

const FileUpload = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.files);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        setUploadProgress(10);
        
        // Generate a random encryption key
        const encryptionKey = await generateEncryptionKey();
        setUploadProgress(30);

        // Encrypt the file
        const encryptedFile = await encryptFile(file, encryptionKey);
        setUploadProgress(50);

        // Create form data and upload
        const result = await dispatch(
          uploadFile({
            file: encryptedFile,
            encryptedKey: encryptionKey,
            name: file.name,
          })
        );

        setUploadProgress(100);

        if (result.meta.requestStatus === 'fulfilled') {
          navigate('/files');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        // You might want to show an error message to the user here
      }
    },
    [dispatch, navigate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
  });

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Upload File
      </Typography>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box
          {...getRootProps()}
          sx={{
            width: '100%',
            height: 200,
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'grey.50',
            },
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload
            sx={{ fontSize: 48, color: isDragActive ? 'primary.main' : 'grey.500' }}
          />
          <Typography variant="h6" color="textSecondary" align="center" mt={2}>
            {isDragActive
              ? 'Drop the file here'
              : 'Drag and drop a file here, or click to select'}
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            Files will be encrypted before upload
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2" color="textSecondary" align="center" mt={1}>
              {uploadProgress < 50
                ? 'Encrypting file...'
                : 'Uploading encrypted file...'}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error.detail || 'Error uploading file'}
          </Alert>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/files')}
          sx={{ mt: 3 }}
        >
          View My Files
        </Button>
      </Paper>
    </Container>
  );
};

export default FileUpload; 