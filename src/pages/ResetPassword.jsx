import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css'; // Reuse Login CSS

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  // Initialize email from location
  const [formData, setFormData] = useState({
    Email: location.state?.email || '',
    OtpCode: '',
    NewPassword: '',
    ConfirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.Email || !formData.OtpCode || !formData.NewPassword || !formData.ConfirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.NewPassword !== formData.ConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Send payload with exact keys requested by user
      const result = await resetPassword({
        Email: formData.Email,
        OtpCode: formData.OtpCode,
        NewPassword: formData.NewPassword,
        ConfirmPassword: formData.ConfirmPassword
      });

      if (result.success) {
        navigate('/login', {
          state: { message: 'Password reset successful. Please log in with your new password.' }
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel fade-in">
        <div className="text-center mb-3">
          <h2 className="brand-title">New Password</h2>
          <p className="text-muted">Enter OTP and create a new password</p>
        </div>

        {error && (
          <div className="alert alert-danger fade-in">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label className="form-label">Email</label>
            <div className="input-with-icon">
              <i className="bi bi-envelope"></i>
              <input
                type="email"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group mb-3">
            <label className="form-label">OTP Code</label>
            <div className="input-with-icon">
              <i className="bi bi-shield-lock"></i>
              <input
                type="text"
                name="OtpCode"
                value={formData.OtpCode}
                onChange={handleChange}
                placeholder="Enter verification code"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group mb-3">
            <label className="form-label">New Password</label>
            <div className="input-with-icon">
              <i className="bi bi-lock"></i>
              <input
                type="password"
                name="NewPassword"
                value={formData.NewPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Confirm Password</label>
            <div className="input-with-icon">
              <i className="bi bi-lock-fill"></i>
              <input
                type="password"
                name="ConfirmPassword"
                value={formData.ConfirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 btn-lg mb-3"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
