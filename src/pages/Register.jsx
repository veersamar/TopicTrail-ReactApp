import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css'; // We will update this CSS file to match the new theme

function Register() {
  const [formData, setFormData] = useState({
    Username: '',
    Name: '',
    Email: '',
    Mobile: '',
    Profession: '',
    Password: '',
    ConfirmPassword: ''
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

    if (!formData.Username.trim()) {
      newErrors.Username = 'Username is required';
    } else if (formData.Username.length < 3) {
      newErrors.Username = 'Username must be at least 3 characters';
    }

    if (!formData.Name.trim()) {
      newErrors.Name = 'Full Name is required';
    }

    if (!formData.Mobile.trim()) {
      newErrors.Mobile = 'Mobile number is required';
    }

    if (!formData.Profession.trim()) {
      newErrors.Profession = 'Profession is required';
    }

    if (!formData.Email.trim()) {
      newErrors.Email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.Email)) {
      newErrors.Email = 'Email is invalid';
    }

    if (!formData.Password) {
      newErrors.Password = 'Password is required';
    } else if (formData.Password.length < 6) {
      newErrors.Password = 'Password must be at least 6 characters';
    }

    if (formData.Password !== formData.ConfirmPassword) {
      newErrors.ConfirmPassword = 'Passwords do not match';
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
      // Pass the whole formData object which now matches API expectations
      const result = await register(formData);

      if (result.success) {
        setMessage({ type: 'success', text: 'Registration successful! Redirecting to verification...' });
        setTimeout(() => {
          navigate('/verify-otp', {
            state: {
              username: formData.Username,
              email: formData.Email
            }
          });
        }, 1500);
      } else {
        setMessage({ type: 'danger', text: result.error });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'danger', text: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-bg-decoration d-none d-md-block"></div>

      <div className="register-card">
        <div className="register-logo">
          <i className="bi bi-chat-square-text logo-icon" style={{ color: 'var(--primary-color)' }}></i>
          <h1 className="logo-text">Join TopicTrail</h1>
          <p className="logo-tagline">Create your account to start sharing knowledge</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
            <div className="d-flex align-items-center gap-2">
              <i className={`bi ${message.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`}></i>
              <span>{message.text}</span>
            </div>
            <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="Username"
              className={`form-control ${errors.Username ? 'is-invalid' : ''}`}
              value={formData.Username}
              onChange={handleChange}
              placeholder="johndoe"
              disabled={loading}
            />
            {errors.Username && <div className="invalid-feedback">{errors.Username}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="Name"
              className={`form-control ${errors.Name ? 'is-invalid' : ''}`}
              value={formData.Name}
              onChange={handleChange}
              placeholder="John Doe"
              disabled={loading}
            />
            {errors.Name && <div className="invalid-feedback">{errors.Name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="Email"
              className={`form-control ${errors.Email ? 'is-invalid' : ''}`}
              value={formData.Email}
              onChange={handleChange}
              placeholder="name@example.com"
              disabled={loading}
            />
            {errors.Email && <div className="invalid-feedback">{errors.Email}</div>}
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label">Mobile</label>
                <input
                  type="text"
                  name="Mobile"
                  className={`form-control ${errors.Mobile ? 'is-invalid' : ''}`}
                  value={formData.Mobile}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  disabled={loading}
                />
                {errors.Mobile && <div className="invalid-feedback">{errors.Mobile}</div>}
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label">Profession</label>
                <input
                  type="text"
                  name="Profession"
                  className={`form-control ${errors.Profession ? 'is-invalid' : ''}`}
                  value={formData.Profession}
                  onChange={handleChange}
                  placeholder="Developer"
                  disabled={loading}
                />
                {errors.Profession && <div className="invalid-feedback">{errors.Profession}</div>}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="Password"
              className={`form-control ${errors.Password ? 'is-invalid' : ''}`}
              value={formData.Password}
              onChange={handleChange}
              placeholder="Create a password"
              disabled={loading}
            />
            {errors.Password && <div className="invalid-feedback">{errors.Password}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              name="ConfirmPassword"
              className={`form-control ${errors.ConfirmPassword ? 'is-invalid' : ''}`}
              value={formData.ConfirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              disabled={loading}
            />
            {errors.ConfirmPassword && <div className="invalid-feedback">{errors.ConfirmPassword}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-bold"
            disabled={loading}
            style={{ fontSize: '1rem', marginTop: '1rem' }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>

          <div className="register-footer mt-4">
            <p className="footer-text">
              Already have an account? <Link to="/login" className="fw-bold">Log in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;