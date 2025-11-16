import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';
import apiClient, { setAuthToken as setApiAuthToken } from '../lib/apiClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    setApiAuthToken(null);
    setToken(null);
    setUser(null);
    setAuthError(null);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setApiAuthToken(token);
      const response = await apiClient.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [token, clearSession]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const persistSession = (sessionToken, sessionUser) => {
    localStorage.setItem('token', sessionToken);
    setApiAuthToken(sessionToken);
    setToken(sessionToken);
    setUser(sessionUser);
  };

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      persistSession(response.data.token, response.data.user);
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.error || 'Login failed. Please verify your credentials.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password) => {
    setAuthError(null);
    try {
      const response = await apiClient.post('/api/auth/register', {
        username,
        email,
        password
      });
      persistSession(response.data.token, response.data.user);
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.error || 'Registration failed. Please try again.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    clearSession();
  };

  const value = {
    user,
    token,
    loading,
    authError,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
