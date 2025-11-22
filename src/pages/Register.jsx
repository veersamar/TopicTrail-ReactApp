import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData.username, formData.email, formData.password);

      if (result.success) {
        setMessage({ type: 'success', text: 'Registration successful! Redirecting...' });
        setTimeout(() => {
          navigate('/articles');
        }, 1500);
      } else {
        setMessage({ type: 'danger', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'An unexpected error occurred' });
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
        maxWidth: '450px',
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: 'var(--spacing-xxl)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
          Create Account
        </h2>

        {message.text && (
          <div className={`alert alert-${message.type}`} style={{ marginBottom: 'var(--spacing-md)' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              disabled={loading}
              style={{
                borderColor: errors.username ? 'var(--danger-color)' : undefined
              }}
            />
            {errors.username && (
              <small style={{ color: 'var(--danger-color)', marginTop: 'var(--spacing-xs)' }}>
                {errors.username}
              </small>
            )}
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              disabled={loading}
              style={{
                borderColor: errors.email ? 'var(--danger-color)' : undefined
              }}
            />
            {errors.email && (
              <small style={{ color: 'var(--danger-color)', marginTop: 'var(--spacing-xs)' }}>
                {errors.email}
              </small>
            )}
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              disabled={loading}
              style={{
                borderColor: errors.password ? 'var(--danger-color)' : undefined
              }}
            />
            {errors.password && (
              <small style={{ color: 'var(--danger-color)', marginTop: 'var(--spacing-xs)' }}>
                {errors.password}
              </small>
            )}
          </div>

          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              disabled={loading}
              style={{
                borderColor: errors.confirmPassword ? 'var(--danger-color)' : undefined
              }}
            />
            {errors.confirmPassword && (
              <small style={{ color: 'var(--danger-color)', marginTop: 'var(--spacing-xs)' }}>
                {errors.confirmPassword}
              </small>
            )}
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
                Registering...
              </>
            ) : (
              'Register'
            )}
          </button>

          <div style={{ textAlign: 'center' }}>
            <span className="text-secondary">Already have an account? </span>
            <Link to="/login">Login here</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;