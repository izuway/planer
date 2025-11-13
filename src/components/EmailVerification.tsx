import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { MailOutline as MailIcon } from '@mui/icons-material';
import { auth, resendVerificationEmail, logOut } from '../firebase';

export const EmailVerification = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResendEmail = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    setMessage('');
    setError('');

    try {
      await resendVerificationEmail(auth.currentUser);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      console.error('Resend email error:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else {
        setError('Failed to send verification email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      // Reload user to get updated email verification status
      await auth.currentUser.reload();
      
      // Force a token refresh
      await auth.currentUser.getIdToken(true);
      
      if (auth.currentUser.emailVerified) {
        window.location.reload();
      } else {
        setError('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setError('Failed to check verification status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <MailIcon sx={{ fontSize: 64, color: 'primary.main' }} />
          </Box>

          <Typography variant="h4" component="h1" gutterBottom>
            Verify Your Email
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            We've sent a verification email to <strong>{auth.currentUser?.email}</strong>.
            Please check your inbox and click the verification link.
          </Typography>

          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'I\'ve Verified My Email'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleResendEmail}
              disabled={loading}
            >
              Resend Verification Email
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={handleLogout}
              disabled={loading}
            >
              Logout
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
            After verifying your email, click "I've Verified My Email" to continue.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

