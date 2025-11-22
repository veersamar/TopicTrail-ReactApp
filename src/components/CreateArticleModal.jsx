import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import axios from 'axios';

function CreateArticleModal({ show, onClose, onSuccess }) {
  const { token, userId } = useAuth();

  // ========== STATE ==========
  const [formData, setFormData] = useState({
    articleType: '',
    title: '',
    description: '',
    content: '',
    categoryId: '',
    subCategoryId: '',
    intentType: '',
    audienceType: '',
    tags: ''
  });

  const [formState, setFormState] = useState({
    articleTypes: [],
    categories: [],
    subCategories: [],
    intentTypes: [],
    audienceTypes: [],
    loading: false,
    dataLoading: true,
    errors: {},
    successMessage: '',
  });

  // ========== FETCH MASTER DATA ON MOUNT ==========
  useEffect(() => {
    if (show) {
      fetchAllData();
    }
  }, [show]);

  const fetchAllData = useCallback(async () => {
    setFormState(prev => ({ ...prev, dataLoading: true }));
    
    try {
      const [categoriesData, masterData] = await Promise.all([
        api.getCategories(),
        api.getMasterData(),
      ]);

      setFormState(prev => ({
        ...prev,
        categories: categoriesData || [],
        articleTypes: masterData?.data?.ArticleType || [],
        intentTypes: masterData?.data?.IntentType || [],
        audienceTypes: masterData?.data?.AudienceType || [],
        dataLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      setFormState(prev => ({
        ...prev,
        errors: { fetch: 'Failed to load form data. Please try again.' },
        dataLoading: false,
      }));
    }
  }, []);

  // ========== FETCH SUB-CATEGORIES WHEN CATEGORY CHANGES ==========
  useEffect(() => {
    if (formData.categoryId) {
      const fetchSubCategories = async () => {
        try {
          const data = await api.getSubCategories(formData.categoryId);
          setFormState(prev => ({
            ...prev,
            subCategories: data || [],
          }));
        } catch (error) {
          console.error('Error fetching subcategories:', error);
          setFormState(prev => ({
            ...prev,
            subCategories: [],
          }));
        }
      };
      fetchSubCategories();
      
      // Reset sub-category selection
      setFormData(prev => ({ ...prev, subCategoryId: '' }));
    } else {
      setFormState(prev => ({ ...prev, subCategories: [] }));
    }
  }, [formData.categoryId]);

  // ========== FORM VALIDATION ==========
  const validateForm = useCallback(() => {
    const newErrors = {};
    const validations = {
      articleType: { required: true, message: 'Article Type is required' },
      title: { required: true, minLength: 5, message: 'Title must be at least 5 characters' },
      description: { required: true, minLength: 10, message: 'Description must be at least 10 characters' },
      content: { required: true, minLength: 20, message: 'Content must be at least 20 characters' },
      categoryId: { required: true, message: 'Category is required' },
      intentType: { required: true, message: 'Intent Type is required' },
      audienceType: { required: true, message: 'Audience Type is required' },
    };

    Object.entries(validations).forEach(([field, rules]) => {
      const value = formData[field];
      const trimmedValue = typeof value === 'string' ? value.trim() : value;

      if (rules.required && !trimmedValue) {
        newErrors[field] = rules.message;
      } else if (rules.minLength && trimmedValue.length < rules.minLength) {
        newErrors[field] = rules.message;
      }
    });

    return newErrors;
  }, [formData]);

  // ========== HANDLE INPUT CHANGE ==========
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [name]: '' },
    }));
  }, []);

  // ========== HANDLE FORM SUBMISSION ==========
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setFormState(prev => ({
        ...prev,
        errors: newErrors,
      }));
      return;
    }

    setFormState(prev => ({
      ...prev,
      loading: true,
      successMessage: '',
    }));

    try {
      const articleData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        categoryId: parseInt(formData.categoryId, 10),
        subCategoryId: formData.subCategoryId ? parseInt(formData.subCategoryId, 10) : 0,
        articleType: formData.articleType,
        intentType: formData.intentType,
        audienceType: formData.audienceType,
        tags: formData.tags || 'general',
        status: 'Published',
        visibility: 'Public',
      };

      console.log('Submitting article:', articleData);
      const userId = localStorage.getItem('userId');      
      const result = await api.createArticle(token, userId, articleData);
      console.log('Article creation result:', result);

      // Check if article was created successfully
      // Success can be indicated by:
      // 1. result.success === true
      // 2. result.status === 200 or 201
      // 3. result.id or result.articleId is present
      if (result.success || result.status === 200 || result.status === 201 || result.id) {
        setFormState(prev => ({
          ...prev,
          successMessage: `✓ Article "${formData.title}" published successfully!`,
          loading: false,
        }));

        // Reset form
        setFormData({
          articleType: '',
          title: '',
          description: '',
          content: '',
          categoryId: '',
          subCategoryId: '',
          intentType: '',
          audienceType: '',
          tags: '',
        });

        setTimeout(() => {
          onSuccess();
          onClose();
          setFormState(prev => ({
            ...prev,
            successMessage: '',
            errors: {},
          }));
        }, 2000);
      } else {
        // Article creation failed
        const errorMsg = result.error || result.message || 'Failed to create article';
        setFormState(prev => ({
          ...prev,
          errors: { submit: errorMsg },
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Submit error:', error);
      setFormState(prev => ({
        ...prev,
        errors: { submit: error.message || 'Failed to create article' },
        loading: false,
      }));
    }
  }, [formData, token, userId, validateForm, onSuccess, onClose]);

  // ========== RENDER DROPDOWN HELPER ==========
  const renderSelectOptions = (dataArray) => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return null;
    }

    return dataArray.map(item => (
      <option key={item.Code || item.Id} value={item.Id}>
        {item.Name}
      </option>
    ));
  };

  // ========== IF MODAL NOT SHOWN ==========
  if (!show) return null;

  const { 
    loading, 
    dataLoading, 
    errors, 
    successMessage,
    articleTypes,
    categories,
    subCategories,
    intentTypes,
    audienceTypes,
  } = formState;

  // ========== RENDER ==========
  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content shadow-lg" style={{ borderRadius: '8px' }}>
          {/* ========== HEADER ========== */}
          <div 
            className="modal-header border-0 text-white"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px 8px 0 0',
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-pen-fill" style={{ fontSize: '1.25rem' }}></i>
              <div>
                <h5 className="modal-title mb-0">Create New Article</h5>
                <small className="text-light" style={{ opacity: 0.9 }}>Share your knowledge with the community</small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          {/* ========== BODY ========== */}
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Success Message */}
            {successMessage && (
              <div 
                className="alert alert-success alert-dismissible fade show border-0 mb-3"
                role="alert"
                style={{ background: '#d4edda', borderLeft: '4px solid #28a745' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle" style={{ color: '#28a745' }}></i>
                  <span>{successMessage}</span>
                </div>
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div 
                className="alert alert-danger alert-dismissible fade show border-0 mb-3"
                role="alert"
                style={{ background: '#f8d7da', borderLeft: '4px solid #dc3545' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-circle" style={{ color: '#dc3545' }}></i>
                  <span>{errors.submit}</span>
                </div>
                <button type="button" className="btn-close" onClick={() => setFormState(prev => ({ ...prev, errors: {} }))}></button>
              </div>
            )}

            {/* Data Loading Alert */}
            {dataLoading && (
              <div 
                className="alert alert-info border-0 mb-3"
                style={{ background: '#d1ecf1', borderLeft: '4px solid #17a2b8' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm" role="status" style={{ color: '#17a2b8' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span>Loading form data...</span>
                </div>
              </div>
            )}

            {/* ========== FORM FIELDS ========== */}
            <form>
              {/* Article Type */}
              <div className="mb-4">
                <label className="form-label fw-600" style={{ color: '#333' }}>
                  <i className="bi bi-bookmark-fill me-2" style={{ color: '#667eea' }}></i>
                  Article Type <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select form-select-sm ${errors.articleType ? 'is-invalid' : ''}`}
                  name="articleType"
                  value={formData.articleType}
                  onChange={handleInputChange}
                  disabled={loading || dataLoading || articleTypes.length === 0}
                  style={{ borderRadius: '6px' }}
                >
                  <option value="">
                    {articleTypes.length === 0 ? 'Loading...' : 'Select Article Type'}
                  </option>
                  {renderSelectOptions(articleTypes)}
                </select>
                {errors.articleType && (
                  <div className="invalid-feedback d-block small">{errors.articleType}</div>
                )}
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="form-label fw-600" style={{ color: '#333' }}>
                  <i className="bi bi-type me-2" style={{ color: '#667eea' }}></i>
                  Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${errors.title ? 'is-invalid' : ''}`}
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter a compelling title..."
                  disabled={loading}
                  style={{ borderRadius: '6px' }}
                  maxLength="200"
                />
                {errors.title && (
                  <div className="invalid-feedback d-block small">{errors.title}</div>
                )}
                <small className="text-muted d-block mt-1">
                  {formData.title.length}/200 characters
                </small>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="form-label fw-600" style={{ color: '#333' }}>
                  <i className="bi bi-file-text me-2" style={{ color: '#667eea' }}></i>
                  Description <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${errors.description ? 'is-invalid' : ''}`}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief summary of your article..."
                  disabled={loading}
                  style={{ borderRadius: '6px' }}
                  maxLength="300"
                />
                {errors.description && (
                  <div className="invalid-feedback d-block small">{errors.description}</div>
                )}
                <small className="text-muted d-block mt-1">
                  {formData.description.length}/300 characters
                </small>
              </div>

              {/* Content */}
              <div className="mb-4">
                <label className="form-label fw-600" style={{ color: '#333' }}>
                  <i className="bi bi-pencil-square me-2" style={{ color: '#667eea' }}></i>
                  Content <span className="text-danger">*</span>
                </label>
                <textarea
                  className={`form-control form-control-sm ${errors.content ? 'is-invalid' : ''}`}
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows="6"
                  placeholder="Write your article content here..."
                  disabled={loading}
                  style={{ borderRadius: '6px', fontFamily: '"Segoe UI", sans-serif' }}
                  maxLength="5000"
                />
                {errors.content && (
                  <div className="invalid-feedback d-block small">{errors.content}</div>
                )}
                <small className="text-muted d-block mt-1">
                  {formData.content.length}/5000 characters | {formData.content.split(/\s+/).filter(w => w).length} words
                </small>
              </div>

              {/* Category & Sub-Category Row */}
              <div className="row mb-4 g-3">
                <div className="col-md-6">
                  <label className="form-label fw-600" style={{ color: '#333' }}>
                    <i className="bi bi-folder me-2" style={{ color: '#667eea' }}></i>
                    Category <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select form-select-sm ${errors.categoryId ? 'is-invalid' : ''}`}
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    disabled={loading || dataLoading || categories.length === 0}
                    style={{ borderRadius: '6px' }}
                  >
                    <option value="">
                      {categories.length === 0 ? 'Loading...' : 'Select Category'}
                    </option>
                    {renderSelectOptions(categories)}
                  </select>
                  {errors.categoryId && (
                    <div className="invalid-feedback d-block small">{errors.categoryId}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-600" style={{ color: '#333' }}>
                    <i className="bi bi-folder-check me-2" style={{ color: '#667eea' }}></i>
                    Sub-Category <span className="text-muted">(Optional)</span>
                  </label>
                  <select
                    className="form-select form-select-sm"
                    name="subCategoryId"
                    value={formData.subCategoryId}
                    onChange={handleInputChange}
                    disabled={loading || !formData.categoryId || subCategories.length === 0}
                    style={{ borderRadius: '6px' }}
                  >
                    <option value="">
                      {!formData.categoryId ? 'Select category first' : 'Select Sub-Category'}
                    </option>
                    {renderSelectOptions(subCategories)}
                  </select>
                </div>
              </div>

              {/* Intent Type */}
              <div className="mb-4">
                <label className="form-label fw-600" style={{ color: '#333' }}>
                  <i className="bi bi-lightbulb me-2" style={{ color: '#667eea' }}></i>
                  Intent Type <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select form-select-sm ${errors.intentType ? 'is-invalid' : ''}`}
                  name="intentType"
                  value={formData.intentType}
                  onChange={handleInputChange}
                  disabled={loading || dataLoading || intentTypes.length === 0}
                  style={{ borderRadius: '6px' }}
                >
                  <option value="">
                    {intentTypes.length === 0 ? 'Loading...' : 'Select Intent Type'}
                  </option>
                  {renderSelectOptions(intentTypes)}
                </select>
                {errors.intentType && (
                  <div className="invalid-feedback d-block small">{errors.intentType}</div>
                )}
                <small className="text-muted d-block mt-1">Purpose of your article</small>
              </div>

              {/* Audience Type */}
              <div className="mb-4">
                <label className="form-label fw-600" style={{ color: '#333' }}>
                  <i className="bi bi-people me-2" style={{ color: '#667eea' }}></i>
                  Audience Type <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select form-select-sm ${errors.audienceType ? 'is-invalid' : ''}`}
                  name="audienceType"
                  value={formData.audienceType}
                  onChange={handleInputChange}
                  disabled={loading || dataLoading || audienceTypes.length === 0}
                  style={{ borderRadius: '6px' }}
                >
                  <option value="">
                    {audienceTypes.length === 0 ? 'Loading...' : 'Select Audience Type'}
                  </option>
                  {renderSelectOptions(audienceTypes)}
                </select>
                {errors.audienceType && (
                  <div className="invalid-feedback d-block small">{errors.audienceType}</div>
                )}
                <small className="text-muted d-block mt-1">Target audience for this article</small>
              </div>

              {/* Tags */}
              <div className="mb-4">
                <label className="form-label fw-600" style={{ color: '#333' }}>
                  <i className="bi bi-tags me-2" style={{ color: '#667eea' }}></i>
                  Tags <span className="text-muted">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., technology, tutorial, news"
                  disabled={loading}
                  style={{ borderRadius: '6px' }}
                  maxLength="200"
                />
                <small className="text-muted d-block mt-1">
                  Comma-separated keywords to help readers find your article
                </small>
              </div>
            </form>
          </div>

          {/* ========== FOOTER ========== */}
          <div className="modal-footer border-top-0 bg-light" style={{ borderRadius: '0 0 8px 8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              disabled={loading}
              style={{ borderRadius: '6px' }}
            >
              <i className="bi bi-x-circle me-1"></i>Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || dataLoading}
              className="btn btn-primary btn-sm"
              style={{
                borderRadius: '6px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Publishing...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-1"></i>Publish Article
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateArticleModal;