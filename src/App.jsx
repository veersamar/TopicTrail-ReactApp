import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import Register from './pages/Register';
import OtpVerification from './pages/OtpVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Components
// Components
import MainLayout from './components/MainLayout';
import ArticlesFeed from './components/ArticlesFeed';
import ArticleDetail from './components/ArticleDetail';

// ========== PROTECTED ROUTE COMPONENT ==========
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ========== MAIN APP CONTENT ==========
function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-body)'
      }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* ========== AUTH ROUTES ========== */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/articles" replace />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/articles" replace />} />
      <Route path="/verify-otp" element={<OtpVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ========== PROTECTED APP ROUTES ========== */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/articles" element={<ArticlesFeed />} />
        <Route path="/questions" element={<ArticlesFeed />} /> {/* Alias for now */}
        <Route path="/articles/:id" element={<ArticleDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-articles" element={<ArticlesFeed />} />
        <Route path="/tags" element={<div className="p-4">Tags (Coming Soon)</div>} />
        <Route path="/users" element={<div className="p-4">Users (Coming Soon)</div>} />
        <Route path="/settings" element={
          <div className="container-lg my-5">
            <h2>Settings</h2>
            <p>Coming soon...</p>
          </div>
        } />
      </Route>

      {/* ========== DEFAULT ROUTES ========== */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/articles" : "/login"} replace />}
      />

      {/* 404 NOT FOUND */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// ========== MAIN APP WITH ROUTER ==========
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;