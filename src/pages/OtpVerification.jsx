import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './OtpVerification.css';

function OtpVerification() {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const location = useLocation();
    const navigate = useNavigate();
    const { verifyOtp } = useAuth(); // We will implement this in AuthContext

    // Get data passed from Register page
    const { username, email } = location.state || {};

    // Redirect if no context (user accessed page directly)
    useEffect(() => {
        if (!username && !email) {
            navigate('/register');
        }
    }, [username, email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!otp.trim()) return;

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Use email or username as identifier
            const identifier = email || username;
            const result = await verifyOtp(identifier, otp);

            if (result.success) {
                setMessage({ type: 'success', text: 'Verification successful! Redirecting to login...' });
                setTimeout(() => {
                    navigate('/login', {
                        state: { message: 'Account verified successfully. Please log in.' }
                    });
                }, 1500);
            } else {
                setMessage({ type: 'danger', text: result.error || 'Invalid OTP. Please try again.' });
            }
        } catch (error) {
            setMessage({ type: 'danger', text: 'An error occurred during verification.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="otp-container">
            <div className="otp-card">
                <i className="bi bi-shield-lock otp-icon"></i>
                <h2 className="otp-title">Verify Your Account</h2>
                <p className="otp-subtitle">
                    We've sent a verification code to <strong>{email || username}</strong>. Please enter it below.
                </p>

                {message.text && (
                    <div className={`alert alert-${message.type} py-2 mb-3`} role="alert">
                        <small>{message.text}</small>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="otp-form">
                    <div className="form-group">
                        <input
                            type="text"
                            className="form-control otp-input"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="0 0 0 0 0 0"
                            maxLength={6}
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 py-2 fw-bold"
                        disabled={loading || otp.length < 4}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Verifying...
                            </>
                        ) : (
                            'Verify Account'
                        )}
                    </button>
                </form>

                <div className="otp-resend">
                    Didn't receive the code? <a href="#" onClick={(e) => e.preventDefault()}>Resend</a>
                </div>
            </div>
        </div>
    );
}

export default OtpVerification;
