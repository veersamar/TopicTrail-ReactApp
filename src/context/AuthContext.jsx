import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('user');

        if (storedToken && savedUser) {
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

          setToken(storedToken);
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`https://localhost:7083/api/auth/login`, {
        email,
        password
      });
      // Normalize response shapes: some backends return { token, user }, others return { accessToken, data: { user } }, etc.
      const res = response?.data || {};
      const respToken = res.token || res.accessToken || res.access_token || res.data?.token || res.data?.accessToken;
      const userData = res.user || res.data?.user || res.data || res.userProfile || res.data?.userProfile || null;

      // Persist token if present
      if (respToken) {
        localStorage.setItem('authToken', respToken);
        setToken(respToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${respToken}`;
      }

      // Persist user if present (try to normalize common shapes)
      if (userData) {
        try {
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (e) {
          console.warn('Failed to stringify user for localStorage', e);
        }
        setUser(userData);
      }

      // Update auth flag if we have a token (or at least user)
      setIsAuthenticated(!!respToken || !!userData);

      return { success: !!respToken || !!userData, user: userData, token: respToken };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userDataOrUsername, email, password) => {
    try {
      let payload = {};

      if (typeof userDataOrUsername === 'object') {
        // New usage: register({ ...allFields })
        payload = userDataOrUsername;
      } else {
        // Legacy usage: register(username, email, password)
        payload = {
          username: userDataOrUsername,
          email,
          password
        };
      }

      console.log('Registration Payload:', payload); // Debug

      // Use the API service URL resolution by accessing env var in same way or just use the same URL logic
      // Ideally we should use the api.service here, but let's stick to axios for minimal diff, just fixing the payload.
      const baseUrl = process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== 'undefined' && process.env.REACT_APP_API_URL.startsWith('http')
        ? process.env.REACT_APP_API_URL
        : 'https://localhost:7083';

      const response = await axios.post(`${baseUrl}/api/auth/register`, payload);

      // For OTP flow, we don't expect a token immediately.
      // If the request succeeds (2xx), we consider it a success.
      return {
        success: response.status === 200 || response.status === 201,
        data: response.data
      };
    } catch (error) {
      console.error('Registration error:', error);
      // Construct a useful error message from likely backend shapes
      const msg = error.response?.data?.message
        || (typeof error.response?.data === 'string' ? error.response?.data : '')
        || error.message
        || 'Registration failed';

      return {
        success: false,
        error: msg
      };
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    // Clear axios default header
    delete axios.defaults.headers.common['Authorization'];

    // Update state
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    token,
    // Provide a normalized userId for consumers
    userId: user?.id || user?.Id || user?.userId || user?.user?.id || null,
    isAuthenticated,
    loading,
    login,
    register,
    verifyOtp: api.verifyOtp, // Direct mapping since api.js handles it well
    logout,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;