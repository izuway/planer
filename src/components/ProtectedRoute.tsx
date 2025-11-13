import { ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { AuthPage } from './Auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Component that protects routes requiring authentication
 * Shows loading spinner while checking auth state
 * Redirects to login page if user is not authenticated
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

  if (!user) {
    return <AuthPage />;
  }

  return <>{children}</>;
};

