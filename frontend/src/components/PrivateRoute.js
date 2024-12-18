import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, token, mfaRequired, mfaVerified } = useSelector((state) => state.auth);
  const location = useLocation();
  
  // Allow access to MFA setup without full authentication
  if (location.pathname === '/mfa-setup') {
    return isAuthenticated && token ? children : <Navigate to="/login" />;
  }

  // Redirect to MFA setup if authenticated but MFA is required
  if (isAuthenticated && token && mfaRequired && !mfaVerified) {
    return <Navigate to="/mfa-setup" />;
  }

  // Require both authentication and MFA verification for all other routes
  if (!isAuthenticated || !token || !mfaVerified) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute; 