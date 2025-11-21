import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navigation({ onCreateClick }) {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ========== HANDLE LOGOUT ==========
  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  return (
    <nav
      className="navbar sticky-top"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)',
      }}
    >
      <div className="container-lg d-flex align-items-center justify-content-between py-3" style={{ maxWidth: '1200px' }}>
        {/* Logo/Brand */}
        <Link
          to="/articles"
          className="text-white text-decoration-none d-flex align-items-center gap-2"
          style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
        >
          <i className="bi bi-newspaper" style={{ fontSize: '1.8rem' }}></i>
          ArticleHub
        </Link>

        {/* Center Navigation */}
        <div className="d-flex align-items-center gap-4">
          <Link
            to="/articles"
            className="text-white text-decoration-none"
            style={{ fontSize: '0.95rem', transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => (e.target.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.target.style.opacity = '1')}
          >
            <i className="bi bi-house-fill me-2"></i>
            Home
          </Link>
        </div>

        {/* Right Actions */}
        {isAuthenticated ? (
          <div className="d-flex align-items-center gap-3">
            {/* Create Article Button */}
            <button
              className="btn btn-light btn-sm"
              onClick={onCreateClick}
              style={{
                borderRadius: '6px',
                fontWeight: '500',
                padding: '0.5rem 1rem',
              }}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Create Article
            </button>

            {/* User Menu Dropdown */}
            <div className="position-relative">
              <button
                className="btn btn-light btn-sm d-flex align-items-center gap-2"
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  borderRadius: '6px',
                  padding: '0.5rem 0.75rem',
                }}
              >
                <i className="bi bi-person-circle" style={{ fontSize: '1.2rem' }}></i>
                <span className="d-none d-sm-inline" style={{ fontSize: '0.9rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'Account'}
                </span>
                <i className={`bi bi-chevron-down ${showUserMenu ? 'bi-chevron-up' : ''}`}></i>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div
                  className="position-absolute end-0 mt-2"
                  style={{
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    minWidth: '200px',
                    zIndex: 1000,
                  }}
                >
                  {/* User Info */}
                  <div className="p-3 border-bottom">
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2c3e50' }}>
                      {user?.name || 'User'}
                    </div>
                    <small style={{ color: '#6c757d' }}>{user?.email || 'No email'}</small>
                  </div>

                  {/* Menu Items */}
                  <button
                    className="w-100 text-start px-3 py-2"
                    onClick={() => {
                      navigate('/profile');
                      setShowUserMenu(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2c3e50',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <i className="bi bi-person me-2" style={{ color: '#667eea' }}></i>
                    Profile
                  </button>

                  <button
                    className="w-100 text-start px-3 py-2"
                    onClick={() => {
                      navigate('/my-articles');
                      setShowUserMenu(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2c3e50',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <i className="bi bi-file-text me-2" style={{ color: '#667eea' }}></i>
                    My Articles
                  </button>

                  <button
                    className="w-100 text-start px-3 py-2"
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2c3e50',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <i className="bi bi-gear me-2" style={{ color: '#667eea' }}></i>
                    Settings
                  </button>

                  {/* Divider */}
                  <div style={{ height: '1px', background: '#e9ecef' }}></div>

                  {/* Logout */}
                  <button
                    className="w-100 text-start px-3 py-2"
                    onClick={handleLogout}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#ffe6e6')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Not Authenticated */
          <div className="d-flex align-items-center gap-2">
            <Link
              to="/login"
              className="btn btn-outline-light btn-sm"
              style={{ borderRadius: '6px' }}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="btn btn-light btn-sm"
              style={{ borderRadius: '6px', fontWeight: '500' }}
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* Close menu when clicking outside */}
      {showUserMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
}

export default Navigation;