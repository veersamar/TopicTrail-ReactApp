import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

function Navigation({ onCreateClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);
  };

  const handleCreateClick = () => {
    onCreateClick();
    setIsMenuOpen(false);
  };

  // Robust User Name Display Logic
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    // Check all possible properties
    return user.name || user.firstName || user.userName || user.username || user.fullName || user.email?.split('@')[0] || 'User';
  };

  const getUserAvatar = () => {
    if (user?.avatar) return user.avatar;
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <nav className="navbar-custom">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/articles" className="navbar-brand">
          <span className="brand-icon">📰</span>
          <span className="brand-text">ArticleHub</span>
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
        >
          <span className="toggle-icon">☰</span>
        </button>

        {/* Nav Items */}
        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          {/* Search Bar */}
          <div className="search-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search articles..."
              aria-label="Search articles"
            />
            <button className="search-btn" aria-label="Search">
              🔍
            </button>
          </div>

          {/* Nav Links */}
          <ul className="nav-links">
            <li>
              <Link to="/articles" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                🏠 Feed
              </Link>
            </li>
            <li>
              <Link to="/my-articles" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                ✍️ My Articles
              </Link>
            </li>
          </ul>

          {/* CTA Button */}
          <button className="btn-create-primary" onClick={handleCreateClick}>
            + Create Article
          </button>

          {/* User Menu */}
          <div className="user-menu-wrapper" ref={dropdownRef}>
            <button
              className="user-profile-btn"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              aria-expanded={isUserDropdownOpen}
            >
              <span className="profile-avatar">
                {getUserAvatar()}
              </span>
              <span className="profile-name">{getUserDisplayName()}</span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {/* Dropdown Menu */}
            <div className={`dropdown-menu ${isUserDropdownOpen ? 'show' : ''}`}>
              <div className="dropdown-item-text text-muted small px-3 py-2 border-bottom">
                Signed in as <br />
                <strong>{getUserDisplayName()}</strong>
              </div>
              <Link
                to="/profile"
                className="dropdown-item"
                onClick={() => setIsUserDropdownOpen(false)}
              >
                👤 Profile
              </Link>
              <Link
                to="/settings"
                className="dropdown-item"
                onClick={() => setIsUserDropdownOpen(false)}
              >
                ⚙️ Settings
              </Link>
              <div className="dropdown-divider"></div>
              <button
                className="dropdown-item logout"
                onClick={handleLogout}
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;