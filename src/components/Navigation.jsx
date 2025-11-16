import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Navigation({ onNewArticle }) {
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom sticky-top">
      <div className="container-fluid">
        {/* Brand */}
        <a className="navbar-brand fw-bold" href="#/">
          <i className="bi bi-rocket-fill me-2"></i>TopicTrail
        </a>

        {/* Toggler */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-controls="navbarNav"
          aria-expanded={expanded}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Nav Items */}
        <div className={`collapse navbar-collapse ${expanded ? 'show' : ''}`} id="navbarNav">
          {/* Search */}
          <form className="d-flex mx-auto my-2 my-lg-0 w-100" style={{ maxWidth: '400px' }}>
            <input
              className="form-control me-2"
              type="search"
              placeholder="Search articles..."
              aria-label="Search"
            />
          </form>

          {/* Right Items */}
          <div className="d-flex gap-2 ms-auto align-items-center">
            {/* New Article Button */}
            <button
              className="btn btn-light btn-sm"
              onClick={onNewArticle}
            >
              <i className="bi bi-plus-circle me-2"></i>New Article
            </button>

            {/* User Dropdown */}
            <div className="dropdown">
              <button
                className="btn btn-outline-light btn-sm dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-person-circle me-2"></i>{user?.email}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <a className="dropdown-item" href="#/">
                    <i className="bi bi-person me-2"></i>Profile
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="#/">
                    <i className="bi bi-gear me-2"></i>Settings
                  </a>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;