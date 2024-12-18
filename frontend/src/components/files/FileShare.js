import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { shareFile } from '../../store/slices/fileSlice';

const validationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  permission: Yup.string().required('Permission is required'),
  expiresAt: Yup.date().nullable(),
});

const FileShare = () => {
  const { fileId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.files);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [currentFile] = useSelector((state) => 
    state.files.files.filter(file => file.id === parseInt(fileId))
  );

  useEffect(() => {
    if (!currentFile) {
      navigate('/files');
    }
  }, [currentFile, navigate]);

  const handleShare = async (values) => {
    try {
      const result = await dispatch(
        shareFile({
          fileId: parseInt(fileId),
          username: values.username,
          permission: values.permission,
          expiresAt: values.expiresAt,
          encryptedKey: currentFile.encrypted_key
        })
      );

      if (result.meta.requestStatus === 'fulfilled') {
        setShareSuccess(true);
        setTimeout(() => {
          navigate('/files');
        }, 2000);
      }
    } catch (err) {
      console.error('Error sharing file:', err);
    }
  };

  if (!currentFile) {
    return null;
  }

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>
        Share File: {currentFile.name}
      </Typography>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Formik
          initialValues={{
            username: '',
            permission: 'VIEW',
            expiresAt: null,
          }}
          validationSchema={validationSchema}
          onSubmit={handleShare}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            setFieldValue,
          }) => (
            <Form>
              <TextField
                fullWidth
                id="username"
                name="username"
                label="Username to share with"
                value={values.username}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.username && Boolean(errors.username)}
                helperText={touched.username && errors.username}
                margin="normal"
              />

              <FormControl
                fullWidth
                margin="normal"
                error={touched.permission && Boolean(errors.permission)}
              >
                <InputLabel>Permission</InputLabel>
                <Select
                  name="permission"
                  value={values.permission}
                  label="Permission"
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <MenuItem value="VIEW">View Only</MenuItem>
                  <MenuItem value="DOWNLOAD">Download</MenuItem>
                </Select>
                {touched.permission && errors.permission && (
                  <FormHelperText>{errors.permission}</FormHelperText>
                )}
              </FormControl>

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Expires At (Optional)"
                  value={values.expiresAt}
                  onChange={(date) => setFieldValue('expiresAt', date)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      margin="normal"
                      error={touched.expiresAt && Boolean(errors.expiresAt)}
                      helperText={touched.expiresAt && errors.expiresAt}
                    />
                  )}
                  minDateTime={new Date()}
                />
              </LocalizationProvider>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error.message || error.detail || 'Error sharing file'}
                </Alert>
              )}

              {shareSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  File shared successfully! Redirecting...
                </Alert>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Share File'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  onClick={() => navigate('/files')}
                >
                  Cancel
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};

export default FileShare; 