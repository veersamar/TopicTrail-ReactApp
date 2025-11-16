import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import './App.css';

function AppContent() {
  const { token, isAuthenticated } = useAuth();
  const [apiHealthy, setApiHealthy] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('https://localhost:7083/api/health');
        setApiHealthy(res.ok);
      } catch (error) {
        setApiHealthy(false);
      }
    };
    checkHealth();
  }, []);

  if (!apiHealthy) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        <h4 className="alert-heading">⚠️ Backend Unavailable</h4>
        <p>Backend API is not running. Make sure your .NET server is running on http://localhost:7083</p>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <LoginPage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;