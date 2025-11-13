import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export const SignupForm = ({ onSwitchToLogin }: SignupFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);
    
    try {
      await signup(email, password, displayName);
      // Success - user will be redirected by auth state change
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Handle common Firebase errors
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Этот email уже используется');
          break;
        case 'auth/invalid-email':
          setError('Некорректный email адрес');
          break;
        case 'auth/weak-password':
          setError('Слишком слабый пароль. Минимум 6 символов');
          break;
        case 'auth/operation-not-allowed':
          setError('Регистрация отключена администратором');
          break;
        default:
          setError('Ошибка регистрации. Попробуйте еще раз');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight={600}>
        Регистрация
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Имя (необязательно)"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        margin="normal"
        autoComplete="name"
        disabled={loading}
      />

      <TextField
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        margin="normal"
        required
        autoComplete="email"
        disabled={loading}
      />

      <TextField
        fullWidth
        label="Пароль"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        required
        autoComplete="new-password"
        disabled={loading}
        helperText="Минимум 6 символов"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        label="Подтвердите пароль"
        type={showPassword ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        margin="normal"
        required
        autoComplete="new-password"
        disabled={loading}
        error={confirmPassword !== '' && password !== confirmPassword}
        helperText={
          confirmPassword !== '' && password !== confirmPassword
            ? 'Пароли не совпадают'
            : ''
        }
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
      >
        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
      </Button>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2">
          Уже есть аккаунт?{' '}
          <Link
            component="button"
            type="button"
            onClick={onSwitchToLogin}
            sx={{ cursor: 'pointer' }}
          >
            Войдите
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

