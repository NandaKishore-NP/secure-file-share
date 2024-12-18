import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from './store';
import theme from './theme';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import MFASetup from './components/auth/MFASetup';
import Dashboard from './components/Dashboard';
import FileUpload from './components/files/FileUpload';
import FileList from './components/files/FileList';
import SharedFiles from './components/files/SharedFiles';
import FileShare from './components/files/FileShare';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="files" element={<FileList />} />
              <Route path="upload" element={<FileUpload />} />
              <Route path="shared" element={<SharedFiles />} />
              <Route path="share/:fileId" element={<FileShare />} />
              <Route path="mfa-setup" element={<MFASetup />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App; 