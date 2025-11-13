import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { auth, subscribeToAuthChanges, getCurrentUserToken } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  emailVerified: boolean;
  token: string | null;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const refreshToken = async () => {
    if (auth.currentUser) {
      const newToken = await getCurrentUserToken();
      setToken(newToken);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Get and store the token
        const userToken = await getCurrentUserToken();
        setToken(userToken);
        
        // Refresh token periodically (every 55 minutes, as Firebase tokens expire after 1 hour)
        const tokenRefreshInterval = setInterval(async () => {
          await refreshToken();
        }, 55 * 60 * 1000);

        return () => clearInterval(tokenRefreshInterval);
      } else {
        setToken(null);
        localStorage.removeItem('firebase_token');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    emailVerified: user?.emailVerified || false,
    token,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

