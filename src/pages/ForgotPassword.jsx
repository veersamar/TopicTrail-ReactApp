import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css'; // Reuse Login CSS for consistency

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { forgotPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const result = await forgotPassword(email);
            if (result.success) {
                // Navigate to reset password page with email
                navigate('/reset-password', { state: { email } });
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card glass-panel fade-in">
                <div className="text-center mb-4">
                    <h2 className="brand-title">Forgot Password</h2>
                    <p className="text-muted">Enter your email to receive an OTP</p>
                </div>

                {error && (
                    <div className="alert alert-danger fade-in">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-4">
                        <label className="form-label">Email Address</label>
                        <div className="input-with-icon">
                            <i className="bi bi-envelope"></i>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 btn-lg mb-3"
                        disabled={loading}
                    >
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>

                    <div className="text-center">
                        <Link to="/login" className="text-decoration-none text-secondary">
                            <i className="bi bi-arrow-left me-1"></i> Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ForgotPassword;
