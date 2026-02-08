import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Alert, Spinner } from '../components/ui';

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
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card auth-card--wide">
        <div className="auth-header">
          <h1 className="auth-brand">Join TopicTrail</h1>
          <p className="text-secondary">Create your account to start sharing knowledge</p>
        </div>

        {message.text && (
          <Alert 
            variant={message.type === 'success' ? 'success' : 'error'} 
            className="mb-4"
            dismissible
            onDismiss={() => setMessage({ type: '', text: '' })}
          >
            {message.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Username"
            type="text"
            name="Username"
            value={formData.Username}
            onChange={handleChange}
            placeholder="johndoe"
            disabled={loading}
            error={errors.Username}
          />

          <Input
            label="Full Name"
            type="text"
            name="Name"
            value={formData.Name}
            onChange={handleChange}
            placeholder="John Doe"
            disabled={loading}
            error={errors.Name}
          />

          <Input
            label="Email"
            type="email"
            name="Email"
            value={formData.Email}
            onChange={handleChange}
            placeholder="name@example.com"
            disabled={loading}
            error={errors.Email}
          />

          <div className="grid grid--2">
            <Input
              label="Mobile"
              type="text"
              name="Mobile"
              value={formData.Mobile}
              onChange={handleChange}
              placeholder="+1234567890"
              disabled={loading}
              error={errors.Mobile}
            />

            <Input
              label="Profession"
              type="text"
              name="Profession"
              value={formData.Profession}
              onChange={handleChange}
              placeholder="Developer"
              disabled={loading}
              error={errors.Profession}
            />
          </div>

          <Input
            label="Password"
            type="password"
            name="Password"
            value={formData.Password}
            onChange={handleChange}
            placeholder="Create a password"
            disabled={loading}
            error={errors.Password}
          />

          <Input
            label="Confirm Password"
            type="password"
            name="ConfirmPassword"
            value={formData.ConfirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            disabled={loading}
            error={errors.ConfirmPassword}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </Button>

          <p className="auth-footer">
            Already have an account? <Link to="/login" className="link font-medium">Log in</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default Register;