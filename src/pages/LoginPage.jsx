import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/articles');
    }
  }, [isAuthenticated, navigate]);

  // Check for success message from other pages (e.g. OTP verification)
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      // Optional: clear state so refresh doesn't show it again, but usually fine
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        navigate('/articles');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel fade-in">
        <div className="text-center mb-4">
          <h1 className="brand-title">TopicTrail</h1>
          <p className="text-muted">Welcome back! Please login to your account.</p>
        </div>

        {message && (
          <div className="alert alert-success fade-in mb-3">
            <i className="bi bi-check-circle-fill me-2"></i>
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger fade-in">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <i className="bi bi-envelope"></i>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <i className="bi bi-lock"></i>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 btn-lg mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-border spinner-border-sm me-2"></div>
                Logging in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="text-center">
            <span className="text-secondary">New to TopicTrail? </span>
            <Link to="/register" className="fw-600">Create an account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;