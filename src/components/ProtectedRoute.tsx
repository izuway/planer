import type { ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { AuthPage } from './Auth';
import { EmailVerification } from './EmailVerification';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Component that protects routes requiring authentication and email verification
 * Shows loading spinner while checking auth state
 * Redirects to login page if user is not authenticated
 * Shows email verification page if email is not verified
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Not authenticated - show login page
  if (!user) {
    return <AuthPage />;
  }

  // Authenticated but email not verified - show verification page
  if (!user.emailVerified) {
    return <EmailVerification />;
  }

  // Authenticated and verified - show app
  return <>{children}</>;
};

