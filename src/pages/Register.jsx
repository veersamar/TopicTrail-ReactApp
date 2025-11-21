import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function Register() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // ========== REDIRECT IF ALREADY LOGGED IN ==========
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/articles');
    }
  }, [isAuthenticated, navigate]);

  // ========== STATE ==========
  const [registerState, setRegisterState] = useState({
    formData: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    errors: {},
    loading: false,
    successMessage: '',
    showPassword: false,
    showConfirmPassword: false,
  });

  // ========== FORM VALIDATION ==========
  const validateForm = () => {
    const newErrors = {};
    const { name, email, password, confirmPassword } = registerState.formData;

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    } else if (name.trim().length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (password.length > 50) {
      newErrors.password = 'Password must be less than 50 characters';
    }

    // Password strength check
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    if (password && !(hasUpperCase && hasLowerCase && hasNumber)) {
      newErrors.passwordStrength =
        'Password should contain uppercase, lowercase, and numbers for better security';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  // ========== HANDLE INPUT CHANGE ==========
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setRegisterState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [name]: value,
      },
      // Clear error for this field
      errors: {
        ...prev.errors,
        [name]: '',
        passwordStrength: '',
      },
    }));
  };

  // ========== HANDLE FORM SUBMISSION ==========
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setRegisterState(prev => ({
        ...prev,
        errors: newErrors,
      }));
      return;
    }

    setRegisterState(prev => ({
      ...prev,
      loading: true,
      successMessage: '',
    }));

    try {
      const result = await api.register({
        name: registerState.formData.name.trim(),
        email: registerState.formData.email.trim().toLowerCase(),
        password: registerState.formData.password,
      });

      console.log('Register result:', result);

      if (result.success) {
        setRegisterState(prev => ({
          ...prev,
          successMessage: '✓ Registration successful! Redirecting to login...',
          loading: false,
        }));

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setRegisterState(prev => ({
          ...prev,
          errors: { submit: result.error || result.message || 'Registration failed' },
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Register error:', error);
      setRegisterState(prev => ({
        ...prev,
        errors: {
          submit: error.message || 'An error occurred during registration. Please try again.',
        },
        loading: false,
      }));
    }
  };

  const { formData, errors, loading, successMessage, showPassword, showConfirmPassword } =
    registerState;

  // ========== RENDER ==========
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="card shadow-lg border-0"
        style={{
          maxWidth: '450px',
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h2 className="mb-2" style={{ fontWeight: '700' }}>
            <i className="bi bi-person-plus-fill me-2"></i>
            Create Account
          </h2>
          <p className="mb-0" style={{ opacity: 0.9, fontSize: '0.95rem' }}>
            Join our community and start sharing articles
          </p>
        </div>

        {/* Form Container */}
        <div className="card-body p-4" style={{ background: 'white' }}>
          {/* Success Message */}
          {successMessage && (
            <div
              className="alert alert-success alert-dismissible fade show border-0 mb-3"
              style={{ background: '#d4edda', borderLeft: '4px solid #28a745' }}
            >
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-check-circle" style={{ color: '#28a745', fontSize: '1.2rem' }}></i>
                <span>{successMessage}</span>
              </div>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div
              className="alert alert-danger alert-dismissible fade show border-0 mb-3"
              style={{ background: '#f8d7da', borderLeft: '4px solid #dc3545' }}
            >
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-circle" style={{ color: '#dc3545', fontSize: '1.2rem' }}></i>
                <span>{errors.submit}</span>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() =>
                  setRegisterState(prev => ({
                    ...prev,
                    errors: { ...prev.errors, submit: '' },
                  }))
                }
              ></button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className="mb-3">
              <label className="form-label fw-600" style={{ color: '#333' }}>
                <i className="bi bi-person me-2" style={{ color: '#667eea' }}></i>
                Full Name
              </label>
              <input
                type="text"
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                disabled={loading}
                style={{ borderRadius: '6px' }}
              />
              {errors.name && (
                <div className="invalid-feedback d-block small mt-1">{errors.name}</div>
              )}
            </div>

            {/* Email Field */}
            <div className="mb-3">
              <label className="form-label fw-600" style={{ color: '#333' }}>
                <i className="bi bi-envelope me-2" style={{ color: '#667eea' }}></i>
                Email Address
              </label>
              <input
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                disabled={loading}
                style={{ borderRadius: '6px' }}
              />
              {errors.email && (
                <div className="invalid-feedback d-block small mt-1">{errors.email}</div>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-3">
              <label className="form-label fw-600" style={{ color: '#333' }}>
                <i className="bi bi-lock me-2" style={{ color: '#667eea' }}></i>
                Password
              </label>
              <div className="input-group" style={{ borderRadius: '6px' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter a strong password"
                  disabled={loading}
                  style={{ borderRadius: '6px 0 0 6px' }}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    setRegisterState(prev => ({
                      ...prev,
                      showPassword: !prev.showPassword,
                    }))
                  }
                  disabled={loading}
                  style={{ borderRadius: '0 6px 6px 0' }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {errors.password && (
                <div className="invalid-feedback d-block small mt-1">{errors.password}</div>
              )}
              {errors.passwordStrength && (
                <div className="alert alert-info alert-sm mt-2 py-2 px-3 mb-0" style={{ fontSize: '0.85rem' }}>
                  <i className="bi bi-info-circle me-1"></i>
                  {errors.passwordStrength}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="mb-3">
              <label className="form-label fw-600" style={{ color: '#333' }}>
                <i className="bi bi-lock-check me-2" style={{ color: '#667eea' }}></i>
                Confirm Password
              </label>
              <div className="input-group" style={{ borderRadius: '6px' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter your password"
                  disabled={loading}
                  style={{ borderRadius: '6px 0 0 6px' }}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    setRegisterState(prev => ({
                      ...prev,
                      showConfirmPassword: !prev.showConfirmPassword,
                    }))
                  }
                  disabled={loading}
                  style={{ borderRadius: '0 6px 6px 0' }}
                >
                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="invalid-feedback d-block small mt-1">{errors.confirmPassword}</div>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="mb-4 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="terms"
                required
                style={{
                  cursor: 'pointer',
                  width: '18px',
                  height: '18px',
                }}
              />
              <label className="form-check-label" htmlFor="terms" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                I agree to the{' '}
                <a href="#" style={{ color: '#667eea', textDecoration: 'none' }}>
                  Terms & Conditions
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn w-100 btn-lg text-white"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                padding: '0.75rem 1.5rem',
              }}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="bi bi-person-check me-2"></i>
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="d-flex align-items-center gap-3 my-4">
            <hr style={{ flex: 1, margin: 0 }} />
            <span style={{ color: '#6c757d', fontSize: '0.85rem' }}>OR</span>
            <hr style={{ flex: 1, margin: 0 }} />
          </div>

          {/* Already Have Account */}
          <p className="text-center mb-3" style={{ color: '#6c757d', fontSize: '0.95rem' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              Sign In
            </Link>
          </p>

          {/* Additional Info */}
          <div
            className="alert alert-info border-0 mb-0"
            style={{
              background: '#f0f4ff',
              borderLeft: '4px solid #667eea',
              fontSize: '0.85rem',
            }}
          >
            <i className="bi bi-shield-check me-2" style={{ color: '#667eea' }}></i>
            Your data is secure and encrypted
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;