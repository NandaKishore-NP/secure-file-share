import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
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
} from '@mui/material';
import { login, verifyMFA } from '../../store/slices/authSlice';

const validationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

const mfaValidationSchema = Yup.object({
  token: Yup.string()
    .required('MFA token is required')
    .matches(/^[0-9]{6}$/, 'Must be exactly 6 digits'),
});

const Login = () => {
  const [showMFA, setShowMFA] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && token && !showMFA) {
      console.log('Login - Redirecting to MFA setup');
      navigate('/mfa-setup');
    }
  }, [isAuthenticated, token, showMFA, navigate]);

  const handleLogin = async (values) => {
    console.log('Login - Attempting login');
    const result = await dispatch(login(values));
    console.log('Login - Result:', result);
    
    if (result.meta.requestStatus === 'fulfilled') {
      console.log('Login - Success, redirecting to MFA setup');
      navigate('/mfa-setup');
    }
  };

  const handleMFAVerify = async (values) => {
    try {
      const result = await dispatch(verifyMFA({ token: values.token }));
      if (result.meta.requestStatus === 'fulfilled') {
        navigate('/dashboard');
      } else if (result.meta.requestStatus === 'rejected') {
        console.error('MFA verification failed:', result.payload);
      }
    } catch (error) {
      console.error('Error during MFA verification:', error);
    }
  };

  if (showMFA) {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
            <Typography component="h1" variant="h5" align="center" gutterBottom>
              Enter MFA Code
            </Typography>
            <Formik
              initialValues={{ token: '' }}
              validationSchema={mfaValidationSchema}
              onSubmit={handleMFAVerify}
            >
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form>
                  <TextField
                    fullWidth
                    id="token"
                    name="token"
                    label="MFA Token"
                    value={values.token}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.token && Boolean(errors.token)}
                    helperText={touched.token && errors.token}
                    margin="normal"
                  />
                  {error && <Alert severity="error">{error.detail}</Alert>}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Verify'}
                  </Button>
                </Form>
              )}
            </Formik>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message || error.detail || 'An error occurred during login'}
            </Alert>
          )}

          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={handleLogin}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <TextField
                  fullWidth
                  id="username"
                  name="username"
                  label="Username"
                  value={values.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  margin="normal"
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Login'}
                </Button>
                <Box sx={{ textAlign: 'center' }}>
                  <Link to="/register" style={{ textDecoration: 'none' }}>
                    <Typography color="primary">
                      Don't have an account? Register
                    </Typography>
                  </Link>
                </Box>
              </Form>
            )}
          </Formik>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 