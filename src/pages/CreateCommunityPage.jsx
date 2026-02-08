import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function CreateCommunityPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Community name is required');
      return;
    }

    if (formData.name.trim().length < 3) {
      setError('Community name must be at least 3 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.createCommunity(token, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        // API expects isPrivate (inverted logic)
        isPrivate: !formData.isPublic,
      });

      if (result.success) {
        const communitySlug = result.community?.slug || result.community?.Slug || result.community?.id || result.community?.Id;
        navigate(`/communities/${communitySlug}`);
      } else {
        setError(result.error || 'Failed to create community');
      }
    } catch (err) {
      console.error('Error creating community:', err);
      setError('Failed to create community. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-community-page">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          {/* Header */}
          <div className="mb-4">
            <Link to="/communities" className="text-decoration-none text-muted small">
              <i className="bi bi-arrow-left me-1"></i>
              Back to Communities
            </Link>
            <h2 className="mt-2 mb-1">Create a Community</h2>
            <p className="text-muted">
              Build a space for like-minded people to share and discuss content.
            </p>
          </div>

          {/* Form Card */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                  <button 
                    type="button" 
                    className="btn-close ms-auto" 
                    onClick={() => setError(null)}
                  ></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Name */}
                <div className="mb-4">
                  <label htmlFor="name" className="form-label fw-medium">
                    Community Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., React Developers, Photography Enthusiasts"
                    maxLength={100}
                    required
                  />
                  <div className="form-text">
                    Choose a unique and descriptive name (3-100 characters)
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label htmlFor="description" className="form-label fw-medium">
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe what your community is about..."
                    maxLength={500}
                  />
                  <div className="form-text d-flex justify-content-between">
                    <span>Help members understand the purpose of your community</span>
                    <span>{formData.description.length}/500</span>
                  </div>
                </div>

                {/* Visibility Toggle */}
                <div className="mb-4">
                  <label className="form-label fw-medium d-block">Visibility</label>
                  <div className="btn-group w-100" role="group">
                    <input 
                      type="radio" 
                      className="btn-check" 
                      name="visibilityOption" 
                      id="publicOption"
                      checked={formData.isPublic}
                      onChange={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                    />
                    <label 
                      className="btn btn-outline-primary" 
                      htmlFor="publicOption"
                    >
                      <i className="bi bi-globe me-2"></i>
                      Public
                    </label>

                    <input 
                      type="radio" 
                      className="btn-check" 
                      name="visibilityOption" 
                      id="privateOption"
                      checked={!formData.isPublic}
                      onChange={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                    />
                    <label 
                      className="btn btn-outline-primary" 
                      htmlFor="privateOption"
                    >
                      <i className="bi bi-lock me-2"></i>
                      Private
                    </label>
                  </div>
                  <div className="form-text mt-2">
                    {formData.isPublic 
                      ? 'Anyone can discover, view, and join this community' 
                      : 'Only invited members can view and join this community'}
                  </div>
                </div>

                {/* Community Guidelines Preview */}
                <div className="bg-light rounded p-3 mb-4">
                  <h6 className="mb-2">
                    <i className="bi bi-info-circle me-1"></i>
                    As a community owner, you will be able to:
                  </h6>
                  <ul className="mb-0 small text-muted ps-3">
                    <li>Manage community settings and visibility</li>
                    <li>Promote members to admins or moderators</li>
                    <li>Remove members or content</li>
                    <li>Delete the community</li>
                  </ul>
                </div>

                {/* Submit Buttons */}
                <div className="d-flex gap-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg flex-grow-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-plus-lg me-2"></i>
                        Create Community
                      </>
                    )}
                  </button>
                  <Link 
                    to="/communities" 
                    className="btn btn-outline-secondary btn-lg"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateCommunityPage;
