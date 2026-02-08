import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function Profile() {
  const navigate = useNavigate();
  const { user, token, userId } = useAuth();
  const [profileState, setProfileState] = useState({
    loading: true,
    error: null,
    profile: null,
    editMode: false,
    formData: {
      name: '',
      email: '',
      bio: '',
    },
    saving: false,
  });

  // ========== FETCH PROFILE ON MOUNT ==========
  useEffect(() => {
    if (userId && token) {
      fetchProfile();
    } else {
      navigate('/login');
    }
  }, [userId, token]);

  // ========== FETCH USER PROFILE ==========
  const fetchProfile = async () => {
    try {
      setProfileState(prev => ({ ...prev, loading: true, error: null }));

      const profile = await api.getUserProfile(token, userId);

      setProfileState(prev => ({
        ...prev,
        profile: profile || user,
        formData: {
          name: profile?.name || user?.name || '',
          email: profile?.email || user?.email || '',
          bio: profile?.bio || '',
        },
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileState(prev => ({
        ...prev,
        error: 'Failed to load profile',
        loading: false,
      }));
    }
  };

  // ========== HANDLE INPUT CHANGE ==========
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [name]: value,
      },
    }));
  };

  // ========== HANDLE SAVE ==========
  const handleSave = async () => {
    try {
      setProfileState(prev => ({ ...prev, saving: true, error: null }));

      const result = await api.updateProfile(token, userId, profileState.formData);

      if (result.success) {
        setProfileState(prev => ({
          ...prev,
          profile: { ...prev.profile, ...profileState.formData },
          editMode: false,
          saving: false,
        }));
      } else {
        setProfileState(prev => ({
          ...prev,
          error: result.error || 'Failed to save profile',
          saving: false,
        }));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setProfileState(prev => ({
        ...prev,
        error: 'Failed to save profile',
        saving: false,
      }));
    }
  };

  const { loading, error, profile, editMode, formData, saving } = profileState;

  // ========== RENDER LOADING ==========
  if (loading) {
    return (
      <div className="profile-page py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // ========== RENDER MAIN CONTENT ==========
  return (
    <div className="profile-page py-4">
      {/* Back Button */}
      <button
        className="btn btn-outline-primary mb-4"
        onClick={() => navigate('/articles')}
        style={{ borderRadius: '6px' }}
      >
        <i className="bi bi-arrow-left me-2"></i>Back to Articles
      </button>

      {/* Error Alert */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show border-0 mb-4"
          style={{ background: '#f8d7da', borderLeft: '4px solid #dc3545' }}
        >
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-circle" style={{ color: '#dc3545' }}></i>
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setProfileState(prev => ({ ...prev, error: null }))}
          ></button>
        </div>
      )}

      {/* Profile Card */}
      <div className="card shadow-sm border-0" style={{ borderRadius: '8px' }}>
        <div className="card-body p-5">
          {/* Header */}
          <div className="d-flex align-items-start justify-content-between mb-4">
            <div>
              <h2 style={{ color: '#2c3e50', fontWeight: '700' }}>Profile</h2>
              <p className="text-muted mb-0">Manage your profile information</p>
            </div>
            {!editMode ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setProfileState(prev => ({ ...prev, editMode: true }))}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '6px',
                }}
              >
                <i className="bi bi-pencil me-2"></i>Edit Profile
              </button>
            ) : null}
          </div>

          {/* Divider */}
          <hr style={{ color: '#e9ecef' }} />

          {/* Profile Content */}
          {editMode ? (
            // Edit Mode
            <form>
              {/* Name Field */}
              <div className="mb-4">
                <label className="form-label fw-600" style={{ color: '#333' }}>
                  <i className="bi bi-person me-2" style={{ color: '#667eea' }}></i>
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  disabled={saving}
                  style={{ borderRadius: '6px' }}
                />
              </div>

              {/* Email Field */}
              <div className="mb-4">
                <label className="form-label fw-600" style={{ color: '#333' }}>
                  <i className="bi bi-envelope me-2" style={{ color: '#667eea' }}></i>
                  Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  disabled={saving}
                  style={{ borderRadius: '6px' }}
                />
              </div>

              {/* Bio Field */}
              <div className="mb-4">
                <label className="form-label fw-600" style={{ color: '#333' }}>
                  <i className="bi bi-chat me-2" style={{ color: '#667eea' }}></i>
                  Bio
                </label>
                <textarea
                  className="form-control"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself"
                  rows="4"
                  disabled={saving}
                  maxLength="500"
                  style={{ borderRadius: '6px' }}
                />
                <small className="text-muted d-block mt-1">
                  {formData.bio.length}/500 characters
                </small>
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setProfileState(prev => ({ ...prev, editMode: false }))}
                  disabled={saving}
                  style={{ borderRadius: '6px' }}
                >
                  <i className="bi bi-x-circle me-2"></i>Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '6px',
                  }}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // View Mode
            <div>
              {/* Name */}
              <div className="mb-4 pb-3 border-bottom">
                <small className="text-muted fw-600 text-uppercase" style={{ fontSize: '0.75rem', color: '#667eea' }}>
                  Full Name
                </small>
                <p style={{ fontSize: '1.1rem', color: '#2c3e50', fontWeight: '500', marginBottom: 0 }}>
                  {formData.name || 'Not set'}
                </p>
              </div>

              {/* Email */}
              <div className="mb-4 pb-3 border-bottom">
                <small className="text-muted fw-600 text-uppercase" style={{ fontSize: '0.75rem', color: '#667eea' }}>
                  Email
                </small>
                <p style={{ fontSize: '1.1rem', color: '#2c3e50', fontWeight: '500', marginBottom: 0 }}>
                  {formData.email || 'Not set'}
                </p>
              </div>

              {/* Bio */}
              <div className="mb-4">
                <small className="text-muted fw-600 text-uppercase" style={{ fontSize: '0.75rem', color: '#667eea' }}>
                  Bio
                </small>
                <p style={{ fontSize: '1rem', color: '#555', lineHeight: '1.6', marginBottom: 0 }}>
                  {formData.bio || 'No bio added yet'}
                </p>
              </div>

              {/* User ID */}
              <div className="mt-4 pt-3 border-top">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  User ID: {userId}
                </small>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;