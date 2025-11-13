import { useState } from 'react';
import { Box, Container, Paper, Tabs, Tab } from '@mui/material';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

export const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

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
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label="Вход" value="login" />
            <Tab label="Регистрация" value="signup" />
          </Tabs>

          {activeTab === 'login' ? (
            <LoginForm onSwitchToSignup={() => setActiveTab('signup')} />
          ) : (
            <SignupForm onSwitchToLogin={() => setActiveTab('login')} />
          )}
        </Paper>
      </Container>
    </Box>
  );
};

