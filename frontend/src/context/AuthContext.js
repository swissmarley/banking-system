import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiClient, { setAuthToken as setApiAuthToken } from '../lib/apiClient';
import * as OTPAuth from 'otpauth';

const AuthContext = createContext();

// Secrets are stored client-side because backend changes are out of scope for this task.
const SECRET_STORAGE_KEY = 'twoFactorSecrets';
const APP_NAME = 'Banking System';

const defaultTwoFactorState = {
  status: 'idle',
  user: null,
  secret: null,
  otpauthUrl: null,
  manualCode: null
};

const OTP_DIGITS = 6;
const OTP_PERIOD = 30;
const SECRET_BYTE_SIZE = 20;
const TOKEN_WINDOW = 1;

const getStoredSecrets = () => {
  try {
    const data = localStorage.getItem(SECRET_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to parse two-factor secrets from storage:', error);
    return {};
  }
};

const persistSecrets = (secrets) => {
  localStorage.setItem(SECRET_STORAGE_KEY, JSON.stringify(secrets));
};

const getSecretForUser = (userId) => {
  const secrets = getStoredSecrets();
  return secrets?.[String(userId)] || null;
};

const saveSecretForUser = (userId, secret) => {
  const secrets = getStoredSecrets();
  secrets[String(userId)] = secret;
  persistSecrets(secrets);
};

const removeSecretForUser = (userId) => {
  const secrets = getStoredSecrets();
  if (secrets[String(userId)]) {
    delete secrets[String(userId)];
    persistSecrets(secrets);
  }
};

const formatSecret = (secret) => secret.replace(/(.{4})/g, '$1 ').trim().toUpperCase();

const getUserLabel = (userData) => {
  if (!userData) {
    return 'unknown-user';
  }
  return userData.email || userData.username || `user-${userData.id}`;
};

const createSetupStateForUser = (userData) => {
  const secret = new OTPAuth.Secret({ size: SECRET_BYTE_SIZE });
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: getUserLabel(userData),
    digits: OTP_DIGITS,
    period: OTP_PERIOD,
    secret
  });

  return {
    status: 'setup',
    user: userData,
    secret: secret.base32,
    otpauthUrl: totp.toString(),
    manualCode: formatSecret(secret.base32)
  };
};

const createTotpForUser = (userData, secretBase32) =>
  new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: getUserLabel(userData),
    digits: OTP_DIGITS,
    period: OTP_PERIOD,
    secret: OTPAuth.Secret.fromBase32(secretBase32)
  });

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
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [pendingToken, setPendingToken] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);
  const [twoFactorState, setTwoFactorState] = useState(defaultTwoFactorState);

  const fetchUser = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setApiAuthToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      setApiAuthToken(token);
      fetchUser();
    } else {
      setLoading(false);
      setApiAuthToken(null);
    }
  }, [token, fetchUser]);

  const resetTwoFactorFlow = useCallback(() => {
    setTwoFactorState(defaultTwoFactorState);
    setPendingToken(null);
    setPendingUser(null);
  }, []);

  const finalizeAuthentication = useCallback(() => {
    if (!pendingToken || !pendingUser) {
      return;
    }

    localStorage.setItem('token', pendingToken);
    setApiAuthToken(pendingToken);
    setToken(pendingToken);
    setUser(pendingUser);
    setPendingToken(null);
    setPendingUser(null);
    setTwoFactorState(defaultTwoFactorState);
  }, [pendingToken, pendingUser]);

  const beginTwoFactorSetup = useCallback((userData, tokenValue) => {
    setPendingToken(tokenValue);
    setPendingUser(userData);
    setTwoFactorState(createSetupStateForUser(userData));
  }, []);

  const beginTwoFactorVerification = useCallback((userData, tokenValue, secret) => {
    setPendingToken(tokenValue);
    setPendingUser(userData);

    setTwoFactorState({
      status: 'verify',
      user: userData,
      secret,
      otpauthUrl: null,
      manualCode: formatSecret(secret)
    });
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;

      const existingSecret = getSecretForUser(userData.id);
      if (existingSecret) {
        beginTwoFactorVerification(userData, newToken, existingSecret);
        return { success: true, stage: 'verify' };
      }

      beginTwoFactorSetup(userData, newToken);
      return { success: true, stage: 'setup' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await apiClient.post('/api/auth/register', {
        username,
        email,
        password
      });
      const { token: newToken, user: userData } = response.data;

      beginTwoFactorSetup(userData, newToken);
      return { success: true, stage: 'setup' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const verifyTwoFactor = async (code) => {
    if (!twoFactorState.user || !twoFactorState.secret) {
      return { success: false, error: 'No active two-factor challenge' };
    }

    const trimmedToken = (code || '').toString().replace(/\s+/g, '');
    if (trimmedToken.length !== OTP_DIGITS) {
      return { success: false, error: 'The OTP code must be 6 digits' };
    }

    try {
      const totp = createTotpForUser(twoFactorState.user, twoFactorState.secret);
      const delta = totp.validate({ token: trimmedToken, window: TOKEN_WINDOW });
      if (delta === null) {
        return { success: false, error: 'Invalid or expired OTP code' };
      }
    } catch (error) {
      console.error('Two-factor verification failed:', error);
      return { success: false, error: 'Unable to verify the OTP code' };
    }

    if (twoFactorState.status === 'setup') {
      saveSecretForUser(twoFactorState.user.id, twoFactorState.secret);
    }

    finalizeAuthentication();
    return { success: true };
  };

  const regenerateTwoFactorSecret = () => {
    if (twoFactorState.status !== 'setup' || !twoFactorState.user) {
      return { success: false, error: 'Two-factor setup is not in progress' };
    }

    setTwoFactorState(createSetupStateForUser(twoFactorState.user));
    return { success: true };
  };

  const cancelTwoFactorFlow = () => {
    resetTwoFactorFlow();
  };

  const disableTwoFactorForUser = (userId) => {
    removeSecretForUser(userId);
    if (user && String(user.id) === String(userId)) {
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setPendingToken(null);
    setPendingUser(null);
    setTwoFactorState(defaultTwoFactorState);
    setApiAuthToken(null);
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
    disableTwoFactorForUser,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

