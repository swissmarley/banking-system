import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiClient from '../lib/apiClient';

const AuthContext = createContext();

const defaultTwoFactorState = {
  status: 'idle',
  user: null,
  otpauthUrl: null,
  manualCode: null,
  expiresInMinutes: null
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorState, setTwoFactorState] = useState(defaultTwoFactorState);

  const resetTwoFactorState = useCallback(() => {
    setTwoFactorState(defaultTwoFactorState);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/auth/me');
      setUser(response.data);
      return response.data;
    } catch (error) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const startTwoFactorFlow = useCallback(
    (userData, payload) => {
      if (!payload?.status) {
        resetTwoFactorState();
        return;
      }

      setTwoFactorState({
        status: payload.status,
        user: userData,
        otpauthUrl: payload.otpauthUrl || null,
        manualCode: payload.manualCode || null,
        expiresInMinutes: payload.expiresInMinutes || null
      });
    },
    [resetTwoFactorState]
  );

  const login = async (email, password) => {
    resetTwoFactorState();
    try {
      const { data } = await apiClient.post('/api/auth/login', { email, password });
      if (data.twoFactor?.status) {
        startTwoFactorFlow(data.user, data.twoFactor);
        return { success: true, stage: data.twoFactor.status };
      }
      await fetchUser();
      return { success: true, stage: 'authenticated' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const register = async (username, email, password) => {
    resetTwoFactorState();
    try {
      const { data } = await apiClient.post('/api/auth/register', {
        username,
        email,
        password
      });

      if (data.twoFactor?.status) {
        startTwoFactorFlow(data.user, data.twoFactor);
        return { success: true, stage: data.twoFactor.status };
      }

      await fetchUser();
      return { success: true, stage: 'authenticated' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const verifyTwoFactor = async (code) => {
    const trimmedCode = (code || '').toString().replace(/\s+/g, '');
    if (trimmedCode.length !== 6) {
      return { success: false, error: 'The OTP code must be 6 digits' };
    }

    try {
      const { data } = await apiClient.post('/api/auth/two-factor/verify', {
        code: trimmedCode
      });
      resetTwoFactorState();
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Two-factor verification failed'
      };
    }
  };

  const regenerateTwoFactorSecret = async () => {
    if (twoFactorState.status !== 'setup') {
      return { success: false, error: 'Two-factor setup is not in progress' };
    }

    try {
      const { data } = await apiClient.post('/api/auth/two-factor/regenerate');
      if (data.twoFactor?.status === 'setup') {
        setTwoFactorState((previous) => ({
          ...previous,
          status: data.twoFactor.status,
          otpauthUrl: data.twoFactor.otpauthUrl || previous.otpauthUrl,
          manualCode: data.twoFactor.manualCode || previous.manualCode,
          expiresInMinutes: data.twoFactor.expiresInMinutes || previous.expiresInMinutes
        }));
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Unable to generate a new secret'
      };
    }
  };

  const cancelTwoFactorFlow = async () => {
    try {
      await apiClient.post('/api/auth/two-factor/cancel');
    } catch (error) {
      // If the cookie is already gone we can ignore the error.
    } finally {
      resetTwoFactorState();
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      // Ignore network errors while logging out.
    } finally {
      setUser(null);
      resetTwoFactorState();
    }
  };

  const value = {
    user,
    loading,
    twoFactorState,
    login,
    register,
    verifyTwoFactor,
    regenerateTwoFactorSecret,
    cancelTwoFactorFlow,
    logout,
    refreshUser: fetchUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
