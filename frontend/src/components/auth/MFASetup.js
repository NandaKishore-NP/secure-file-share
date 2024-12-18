import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
import { setupMFA, verifyMFA } from '../../store/slices/authSlice';

const validationSchema = Yup.object({
  token: Yup.string()
    .required('MFA token is required')
    .matches(/^[0-9]{6}$/, 'Must be exactly 6 digits'),
});

const MFASetup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, mfaSecret, mfaQRCode, mfaRequired } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    dispatch(setupMFA());
  }, [dispatch]);

  const handleVerify = async (values, { setSubmitting, setFieldError }) => {
    try {
      const cleanToken = values.token.trim();
      
      const result = await dispatch(verifyMFA({ token: cleanToken }));
      
      if (result.meta.requestStatus === 'fulfilled') {
        navigate('/dashboard');
      } else if (result.meta.requestStatus === 'rejected') {
        console.error('MFA verification failed:', result.payload);
        const errorMessage = result.payload?.detail || 'Invalid MFA token. Please try again.';
        setFieldError('token', errorMessage);
      }
    } catch (error) {
      console.error('Error during MFA verification:', error);
      setFieldError('token', 'An error occurred during verification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
            Setup MFA
          </Typography>
          {loading && !mfaQRCode ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="body1" gutterBottom>
                1. Install Google Authenticator or any TOTP-compatible app on your
                mobile device.
              </Typography>
              <Typography variant="body1" gutterBottom>
                2. Scan the QR code below or manually enter the secret key:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  wordBreak: 'break-all',
                  my: 2,
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                }}
              >
                {mfaSecret}
              </Typography>
              {mfaQRCode && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    my: 2,
                  }}
                >
                  <img
                    src={`data:image/png;base64,${mfaQRCode}`}
                    alt="MFA QR Code"
                    style={{ maxWidth: '200px' }}
                  />
                </Box>
              )}
              <Typography variant="body1" gutterBottom>
                3. Enter the 6-digit code from your authenticator app:
              </Typography>
              <Formik
                initialValues={{ token: '' }}
                validationSchema={validationSchema}
                onSubmit={handleVerify}
              >
                {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
                  <Form>
                    <TextField
                      fullWidth
                      id="token"
                      name="token"
                      label="MFA Token"
                      value={values.token}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        handleChange({ target: { name: 'token', value } });
                      }}
                      onBlur={handleBlur}
                      error={touched.token && Boolean(errors.token)}
                      helperText={touched.token && errors.token}
                      margin="normal"
                      inputProps={{
                        maxLength: 6,
                        inputMode: 'numeric',
                        pattern: '[0-9]*'
                      }}
                    />
                    {error && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {error.detail || 'Error verifying MFA token'}
                      </Alert>
                    )}
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3 }}
                      disabled={isSubmitting || loading || values.token.length !== 6}
                    >
                      {loading || isSubmitting ? <CircularProgress size={24} /> : 'Verify & Enable MFA'}
                    </Button>
                  </Form>
                )}
              </Formik>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default MFASetup; 