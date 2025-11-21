import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/LoginPage';
import Register from './pages/Register';
import Profile from './pages/Profile'; // Optional: Create this later
import NotFound from './pages/NotFound';

// Components
import Navbar from './components/Navigation'; // ✅ NEW: Import Navbar
import ArticlesFeed from './components/ArticlesFeed';
import ArticleDetail from './components/ArticleDetail';
import CreateArticleModal from './components/CreateArticleModal';

// ========== MAIN APP CONTENT ==========
function AppContent() {
  const { isAuthenticated } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
      {/* ✅ NEW: Navbar Component */}
      {isAuthenticated && (
        <Navbar onCreateClick={() => setShowCreateModal(true)} />
      )}

      {/* Create Article Modal */}
      <CreateArticleModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Routes */}
      <Routes>
        {/* ========== AUTH ROUTES ========== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ========== ARTICLES ROUTES ========== */}
        <Route path="/articles" element={<ArticlesFeed refreshTrigger={refreshTrigger} />} />
        <Route path="/articles/:id" element={<ArticleDetail />} />

        {/* ========== USER ROUTES ========== */}
        <Route path="/profile" element={<Profile />} /> {/* Optional */}
        <Route path="/my-articles" element={<ArticlesFeed />} /> {/* Optional */}
        <Route path="/settings" element={<div className="container-lg my-5"><h2>Settings</h2><p>Coming soon...</p></div>} /> {/* Optional */}

        {/* ========== DEFAULT ROUTES ========== */}
        <Route path="/" element={<Navigate to="/articles" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

// ========== 404 NOT FOUND PAGE ==========
function NotFoundPage() {
  const navigate = require('react-router-dom').useNavigate();

  return (
    <div className="container-lg my-5" style={{ maxWidth: '900px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2c3e50' }}>404</h1>
      <p className="text-muted mb-4" style={{ fontSize: '1.2rem' }}>
        The page you're looking for doesn't exist.
      </p>
      <button
        className="btn btn-primary"
        onClick={() => navigate('/articles')}
        style={{ borderRadius: '6px' }}
      >
        <i className="bi bi-arrow-left me-2"></i>Back to Articles
      </button>
    </div>
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