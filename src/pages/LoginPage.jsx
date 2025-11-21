import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setShowAlert(true);
      return;
    }
    await login(email, password);
  };

  return (
    <div className="login-container">
      <div className="card login-card" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="card-body p-5">
          {/* Logo */}
          <div className="text-center mb-4">
            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto" 
                 style={{ width: '50px', height: '50px' }}>
              <span className="text-white fw-bold" style={{ fontSize: '28px' }}>T</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="card-title text-center mb-1 fw-bold">Welcome Back</h2>
          <p className="text-center text-muted mb-4">Login to TopicTrail</p>

          {/*} In your Login component */}
          <p className="text-center mb-3">
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{ color: '#667eea', textDecoration: 'none' }}
            >
              Sign Up
            </Link>
          </p>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-circle me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
            </div>
          )}

          {/* Empty Fields Alert */}
          {showAlert && (
            <div className="alert alert-warning alert-dismissible fade show" role="alert">
              Please fill in all fields
              <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
            </div>
          )}

          {/* Form */}
          <div className="mb-3">
            <label className="form-label fw-500">Email Address</label>
            <input
              type="email"
              className="form-control form-control-lg"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-500">Password</label>
            <div className="input-group input-group-lg">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="form-check mb-3">
            <input className="form-check-input" type="checkbox" id="rememberMe" />
            <label className="form-check-label" htmlFor="rememberMe">
              Remember me
            </label>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary btn-lg w-100 mb-3"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Logging In...
              </>
            ) : (
              'Login'
            )}
          </button>

          {/* Demo Credentials */}
          <div className="alert alert-info small mb-0">
            <strong>Demo:</strong> john@example.com / password
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;