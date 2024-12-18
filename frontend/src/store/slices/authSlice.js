import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/users/token/`, {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({
          error: 'Network Error',
          message: 'Unable to connect to the server. Please check your connection and try again.',
          details: error.message
        });
      }
      return rejectWithValue(error.response.data);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ username, email, password, password2 }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/users/register/`, {
        username,
        email,
        password,
        password2,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const setupMFA = createAsyncThunk(
  'auth/setupMFA',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_URL}/users/mfa/setup/`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      return response.data;
    } catch (error) {
      console.error('MFA setup error:', error);
      return rejectWithValue(error.response?.data || { detail: error.message });
    }
  }
);

export const verifyMFA = createAsyncThunk(
  'auth/verifyMFA',
  async ({ token: mfaToken }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Ensure the token is exactly 6 digits
      const cleanToken = mfaToken.toString().trim();
      if (!/^\d{6}$/.test(cleanToken)) {
        return rejectWithValue({ detail: 'MFA token must be exactly 6 digits' });
      }

      const response = await axios.post(
        `${API_URL}/users/mfa/verify/`,
        { token: cleanToken },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data) {
        throw new Error('Invalid response from server');
      }

      return response.data;
    } catch (error) {
      console.error('MFA verification error:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data || { detail: 'Failed to verify MFA token' }
      );
    }
  }
);

const initialState = {
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  mfaRequired: true,
  mfaSecret: null,
  mfaQRCode: null,
  mfaVerified: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.user = null;
      state.mfaRequired = false;
      state.mfaSecret = null;
      state.mfaQRCode = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.mfaVerified = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.mfaRequired = true;
        state.mfaVerified = false;
        localStorage.setItem('token', action.payload.access);
        localStorage.setItem('refreshToken', action.payload.refresh);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.mfaRequired = true;
        state.mfaVerified = false;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Setup MFA
      .addCase(setupMFA.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setupMFA.fulfilled, (state, action) => {
        state.loading = false;
        state.mfaSecret = action.payload.secret;
        state.mfaQRCode = action.payload.qr_code;
      })
      .addCase(setupMFA.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Verify MFA
      .addCase(verifyMFA.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyMFA.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.mfaRequired = false;
        state.mfaVerified = true;
        state.mfaSecret = null;
        state.mfaQRCode = null;
        localStorage.setItem('token', action.payload.access);
        localStorage.setItem('refreshToken', action.payload.refresh);
      })
      .addCase(verifyMFA.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.mfaVerified = false;
      });
  },
});

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer; 