import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { Email as EmailIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

/**
 * Email verification page
 * Shown to users who haven't verified their email yet
 */
export const EmailVerification = () => {
  const { user, sendVerificationEmail, reloadUser, logout } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendEmail = async () => {
    try {
      setSending(true);
      setError('');
      setMessage('');
      
      await sendVerificationEmail();
      
      setMessage('Письмо с подтверждением отправлено! Проверьте вашу почту.');
      setCooldown(60); // 60 seconds cooldown
    } catch (err: any) {
      console.error('Error sending verification email:', err);
      
      if (err.code === 'auth/too-many-requests') {
        setError('Слишком много попыток. Подождите немного.');
      } else {
        setError('Ошибка отправки письма. Попробуйте еще раз.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setChecking(true);
      setError('');
      
      await reloadUser();
      
      // Check if email is now verified
      if (user?.emailVerified) {
        setMessage('Email подтвержден! Перенаправление...');
        // The ProtectedRoute will handle the redirect automatically
      } else {
        setError('Email еще не подтвержден. Проверьте почту и нажмите на ссылку в письме.');
      }
    } catch (err: any) {
      console.error('Error checking verification:', err);
      setError('Ошибка проверки. Попробуйте еще раз.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <EmailIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
              Подтвердите email
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Мы отправили письмо с подтверждением на адрес:
            </Typography>
            <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>
              {user?.email}
            </Typography>
          </Box>

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

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Проверьте папку "Спам" если не видите письмо в основной папке.
              Письмо может прийти в течение нескольких минут.
            </Typography>
          </Alert>

          <Box sx={{ mb: 2 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleCheckVerification}
              disabled={checking}
              startIcon={checking ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              sx={{ mb: 2 }}
            >
              {checking ? 'Проверка...' : 'Я подтвердил email'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleSendEmail}
              disabled={sending || cooldown > 0}
              startIcon={sending ? <CircularProgress size={20} /> : <EmailIcon />}
            >
              {sending
                ? 'Отправка...'
                : cooldown > 0
                ? `Отправить повторно (${cooldown}с)`
                : 'Отправить письмо повторно'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Неправильный email?{' '}
              <Link
                component="button"
                type="button"
                onClick={handleLogout}
                sx={{ cursor: 'pointer' }}
              >
                Выйти и зарегистрироваться заново
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

