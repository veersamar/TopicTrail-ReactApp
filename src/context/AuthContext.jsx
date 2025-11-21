import React, { useState, useContext, useCallback, useEffect } from 'react';

const AuthContext = React.createContext();

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
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUserId = localStorage.getItem('userId');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUserId) {
          setToken(storedToken);
          setUserId(parseInt(storedUserId, 10));
          
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (e) {
              console.error('Failed to parse stored user:', e);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        // Clear invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://localhost:7083/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token && data.userId) {
        const userObj = {
          id: data.userId,
          email: data.email,
          name: data.name || 'User',
        };

        // Store in state
        setToken(data.token);
        setUserId(data.userId);
        setUser(userObj);

        // Persist to localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', String(data.userId));
        localStorage.setItem('user', JSON.stringify(userObj));

        return { success: true };
      }

      const errorMsg = data.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } catch (err) {
      const errorMsg = err.message || 'Network error during login';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setUserId(null);
    setError(null);
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    user,
    token,
    userId,
    loading,
    error,
    login,
    logout,
    setUser,
    updateUser,
    isAuthenticated: !!token && !!userId,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};