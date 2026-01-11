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
      const response = await axios.post(`http://localhost:5064/api/auth/login`, {
        email,
        password
      });

      const res = response?.data || {};
      console.log('Login Response Raw:', res);

      // Helper to find value by case-insensitive key
      const getCaseInsensitive = (obj, key) => {
        if (!obj) return null;
        const k = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
        return k ? obj[k] : null;
      };

      // 1. Try to find Token
      let respToken = getCaseInsensitive(res, 'token') ||
        getCaseInsensitive(res, 'accessToken') ||
        getCaseInsensitive(res, 'jwt'); // common names

      // Check inside 'data' or 'result' wrapper
      if (!respToken) {
        const dataObj = getCaseInsensitive(res, 'data') || getCaseInsensitive(res, 'result');
        if (dataObj) {
          respToken = getCaseInsensitive(dataObj, 'token') || getCaseInsensitive(dataObj, 'accessToken');
        }
      }

      // 2. Try to find User object
      let userData = getCaseInsensitive(res, 'user') || getCaseInsensitive(res, 'userProfile');

      if (!userData) {
        const dataObj = getCaseInsensitive(res, 'data') || getCaseInsensitive(res, 'result');
        if (dataObj) {
          userData = getCaseInsensitive(dataObj, 'user') || getCaseInsensitive(dataObj, 'userProfile');
          // If dataObj itself looks like a user (has 'email' or 'id'/'userId'), use it
          if (!userData && (getCaseInsensitive(dataObj, 'email') || getCaseInsensitive(dataObj, 'id') || getCaseInsensitive(dataObj, 'userId'))) {
            userData = dataObj;
          }
        }
      }

      // Fallback: if we have a token but no user object, maybe the top level res is the user?
      if (!userData && respToken && (getCaseInsensitive(res, 'email') || getCaseInsensitive(res, 'id'))) {
        userData = res;
      }

      console.log('Parsed Auth Data:', { respToken, userData });

      // Persist token if present
      if (respToken) {
        localStorage.setItem('authToken', respToken);
        setToken(respToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${respToken}`;
      }

      // Persist user if present
      if (userData) {
        try {
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (e) {
          console.warn('Failed to stringify user for localStorage', e);
        }
        setUser(userData);
      }

      setIsAuthenticated(!!respToken);

      return { success: !!respToken, user: userData, token: respToken };
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

      const baseUrl = process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== 'undefined' && process.env.REACT_APP_API_URL.startsWith('http')
        ? process.env.REACT_APP_API_URL
        : 'http://localhost:5064';

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

  // Helper to extract nested properties case-insensitively
  const getNestedValue = (obj, key) => {
    if (!obj) return null;
    // Direct
    const k = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
    if (k) return obj[k];
    return null;
  };

  const extractUserId = (u) => {
    if (!u) return null;
    // 1. Direct Id/UserId
    let id = getNestedValue(u, 'id') || getNestedValue(u, 'userId') || getNestedValue(u, 'user_id');
    if (id) return id;

    // 2. Nested User object? (u.User.Id)
    const cachedUserObj = getNestedValue(u, 'user');
    if (cachedUserObj) {
      id = getNestedValue(cachedUserObj, 'id') || getNestedValue(cachedUserObj, 'userId');
      if (id) return id;
    }

    // 3. Nested Data object?
    const cachedDataObj = getNestedValue(u, 'data');
    if (cachedDataObj) {
      id = getNestedValue(cachedDataObj, 'id') || getNestedValue(cachedDataObj, 'userId');
      if (id) return id;
    }

    return null;
  };

  const value = {
    user,
    token,
    // Robust extraction of ID
    userId: extractUserId(user),
    isAuthenticated,
    loading,
    login,
    register,
    verifyOtp: api.verifyOtp, // Direct mapping since api.js handles it well
    forgotPassword: api.forgotPassword,
    resetPassword: api.resetPassword,
    logout,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;