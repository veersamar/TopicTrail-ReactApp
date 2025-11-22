import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Components
import Navbar from './components/Navigation';
import ArticlesFeed from './components/ArticlesFeed';
import ArticleDetail from './components/ArticleDetail';
import CreateArticleModal from './components/CreateArticleModal';
import TrendingSidebar from './components/TrendingSidebar';

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
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const handleCreateSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Show loading while checking auth state
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
          <span className="visually-hidden">Loading authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Show Navbar only when authenticated */}
      {isAuthenticated && (
        <>
          <Navbar onCreateClick={() => setShowCreateModal(true)} />

          {/* Create Article Modal */}
          <CreateArticleModal
            show={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
          />
        </>
      )}

      {/* Routes */}
      <Routes>
        {/* ========== AUTH ROUTES ========== */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />

        {/* ========== PROTECTED ARTICLES ROUTES ========== */}
        <Route
          path="/articles"
          element={
            <ProtectedRoute>
              <div className="articles-layout">
                <ArticlesFeed refreshTrigger={refreshTrigger} />
                {isAuthenticated && <TrendingSidebar />}
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/articles/:id"
          element={
            <ProtectedRoute>
              <ArticleDetail />
            </ProtectedRoute>
          }
        />

        {/* ========== PROTECTED USER ROUTES ========== */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-articles"
          element={
            <ProtectedRoute>
              <ArticlesFeed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <div className="container-lg my-5">
                <h2>Settings</h2>
                <p>Coming soon...</p>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ========== DEFAULT ROUTES ========== */}
        {/* Redirect root based on auth status */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/articles" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 404 NOT FOUND */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
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