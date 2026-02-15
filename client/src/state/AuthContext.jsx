import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setAccessToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('jarvis_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('jarvis_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setAccessToken(token);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      localStorage.setItem('jarvis_user', JSON.stringify(user));
      localStorage.setItem('jarvis_token', token);
    } else {
      localStorage.removeItem('jarvis_user');
      localStorage.removeItem('jarvis_token');
    }
  }, [user, token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user);
      setToken(res.data.accessToken);
      setAccessToken(res.data.accessToken);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.code === 'ERR_NETWORK' ? 'Cannot reach server. Please ensure the backend is running.' : 'Login failed');
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { name, email, password });
      setUser(res.data.user);
      setToken(res.data.accessToken);
      setAccessToken(res.data.accessToken);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.code === 'ERR_NETWORK' ? 'Cannot reach server. Please ensure the backend is running.' : 'Signup failed');
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      setAccessToken(null);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

