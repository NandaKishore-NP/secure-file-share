import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import fileReducer from './slices/fileSlice';

// Load persisted state from localStorage
const loadState = () => {
  try {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    if (token && refreshToken) {
      return {
        auth: {
          token,
          refreshToken,
          isAuthenticated: true,
          mfaRequired: false,
          mfaVerified: true,
          loading: false,
          error: null,
          user: null,
          mfaSecret: null,
          mfaQRCode: null
        }
      };
    }
  } catch (err) {
    console.error('Error loading auth state:', err);
  }
  return undefined;
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    files: fileReducer,
  },
  preloadedState: loadState(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
}); 