import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/articles');
    }
  }, [isAuthenticated, navigate]);

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--light-bg)',
      padding: 'var(--spacing-lg)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: 'var(--spacing-xxl)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
          Welcome Back
        </h2>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 'var(--spacing-md)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-100"
            disabled={loading}
            style={{ marginBottom: 'var(--spacing-md)' }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" style={{ marginRight: '0.5rem' }}></span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>

          <div style={{ textAlign: 'center' }}>
            <span className="text-secondary">Don't have an account? </span>
            <Link to="/register">Register here</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;