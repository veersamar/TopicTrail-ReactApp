import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CreateArticleModal({ show, onClose, onSuccess }) {
  // ========== AUTH & STATE ==========
  const { token, userId } = useAuth();

  // Wizard Steps: 1: Basics, 2: Content, 3: Classification
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formState, setFormState] = useState({
    loading: false,          // Submitting
    dataLoading: true,       // Fetching master data
    errors: {},
    successMessage: '',
    // Master data
    articleTypes: [],
    categories: [],
    subCategories: [],
    intentTypes: [],
    audienceTypes: [],
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    categoryId: '',
    subCategoryId: '',
    articleType: '',
    intentType: '',
    audienceType: '',
    visibility: 'Public', // Default
    tags: '',
  });

  // ========== RESET ON OPEN ==========
  useEffect(() => {
    if (show) {
      setCurrentStep(1);
      setFormData({
        title: '',
        description: '',
        content: '',
        categoryId: '',
        subCategoryId: '',
        articleType: '',
        intentType: '',
        audienceType: '',
        visibility: 'Public',
        tags: '',
      });
      setFormState(prev => ({ ...prev, errors: {}, successMessage: '', loading: false }));

      // Fetch data if needed (cache handled in api service)
      fetchMasterData();
    }
  }, [show]);

  // ========== FETCH MASTER DATA ==========
  const fetchMasterData = async () => {
    try {
      setFormState(prev => ({ ...prev, dataLoading: true }));

      const [cats, types, intents, audiences] = await Promise.all([
        api.getCategories(),
        api.getMasterDataByType('ArticleType'),
        api.getMasterDataByType('IntentType'),
        api.getMasterDataByType('AudienceType'),
      ]);

      setFormState(prev => ({
        ...prev,
        categories: Array.isArray(cats) ? cats : [],
        articleTypes: types,
        intentTypes: intents,
        audienceTypes: audiences,
        dataLoading: false,
      }));
    } catch (error) {
      console.error('Error loading form data:', error);
      setFormState(prev => ({ ...prev, dataLoading: false }));
    }
  };

  // ========== HANDLE SUB-CATEGORIES ==========
  useEffect(() => {
    const fetchSubCats = async () => {
      if (!formData.categoryId) {
        setFormState(prev => ({ ...prev, subCategories: [] }));
        return;
      }

      try {
        // Find selected category object (optional: to avoid api call if data is embedded)
        // But api.getSubCategories is standard:
        const subCats = await api.getSubCategories(formData.categoryId);
        setFormState(prev => ({ ...prev, subCategories: subCats }));
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      }
    };

    fetchSubCats();
  }, [formData.categoryId]);

  // ========== HANDLERS ==========
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (formState.errors[name]) {
      setFormState(prev => ({
        ...prev,
        errors: { ...prev.errors, [name]: null }
      }));
    }
  };

  // ========== VALIDATION per STEP ==========
  const validateStep = (step) => {
    const newErrors = {};
    let isValid = true;

    if (step === 1) { // Basics
      if (!formData.title?.trim()) newErrors.title = 'Title is required';
      else if (formData.title.length < 5) newErrors.title = 'Title must be at least 5 characters';

      if (!formData.description?.trim()) newErrors.description = 'Description is required';

      if (!formData.articleType) newErrors.articleType = 'Article Type is required';
    }

    if (step === 2) { // Content
      if (!formData.content?.trim()) newErrors.content = 'Content is required';
      else if (formData.content.length < 20) newErrors.content = 'Content is too short';
    }

    if (step === 3) { // Classification
      if (!formData.categoryId) newErrors.categoryId = 'Category is required';
      if (!formData.intentType) newErrors.intentType = 'Intent Type is required';
      if (!formData.audienceType) newErrors.audienceType = 'Audience Type is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormState(prev => ({ ...prev, errors: newErrors }));
      isValid = false;
    }

    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };


  // ========== SUBMIT ==========
  const handleSubmit = async () => {
    if (!validateStep(3)) return; // Validate final step

    try {
      setFormState(prev => ({ ...prev, loading: true, errors: {} }));

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
        visibility: formData.visibility,
      };

      console.log('Submitting article data:', articleData);

      const result = await api.createArticle(token, userId, articleData);

      if (result.success) {
        setFormState(prev => ({
          ...prev,
          loading: false,
          successMessage: 'Article created successfully!',
        }));

        // Notify parent
        if (onSuccess) onSuccess();

        // Close after brief delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setFormState(prev => ({
          ...prev,
          loading: false,
          errors: { submit: result.error || 'Failed to create article' }
        }));
      }

    } catch (error) {
      console.error('Submission error:', error);
      setFormState(prev => ({
        ...prev,
        loading: false,
        errors: { submit: 'An unexpected error occurred.' }
      }));
    }
  };

  // ========== RENDER SELECT OPTIONS ==========
  const renderSelectOptions = (items) => {
    if (!Array.isArray(items)) return null;
    return items.map((item, idx) => {
      const val = item.id || item.Id || item.value || item.Value || item.name || item.Name;
      const label = item.name || item.Name || item.value || item.Value;
      return (
        <option key={val || idx} value={val}>
          {label}
        </option>
      );
    });
  };

  if (!show) return null;

  const { loading, dataLoading, errors, successMessage, articleTypes, categories, subCategories, intentTypes, audienceTypes } = formState;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>

          {/* Header */}
          <div className="modal-header bg-white border-bottom-0 pb-0">
            <div>
              <h5 className="modal-title fw-bold text-primary">
                {currentStep === 1 && 'Step 1: The Basics'}
                {currentStep === 2 && 'Step 2: Content Creation'}
                {currentStep === 3 && 'Step 3: Classification'}
              </h5>
              <p className="text-muted small mb-0">Create a new article for the community</p>
            </div>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>

          {/* Progress Bar */}
          <div className="px-3 pt-3">
            <div className="progress" style={{ height: '6px', borderRadius: '4px' }}>
              <div
                className="progress-bar bg-gradient-primary"
                role="progressbar"
                style={{ width: `${(currentStep / totalSteps) * 100}%`, transition: 'width 0.3s ease' }}
              ></div>
            </div>
          </div>

          {/* Body */}
          <div className="modal-body p-4">

            {successMessage && (
              <div className="alert alert-success border-0 shadow-sm mb-3">
                <i className="bi bi-check-circle-fill me-2"></i> {successMessage}
              </div>
            )}

            {errors.submit && (
              <div className="alert alert-danger border-0 shadow-sm mb-3">
                <i className="bi bi-exclamation-triangle-fill me-2"></i> {errors.submit}
              </div>
            )}

            {dataLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Loading options...</p>
              </div>
            ) : (
              <form>
                {/* STEP 1: BASICS */}
                {currentStep === 1 && (
                  <div className="animate-fade-in">
                    {/* Title */}
                    <div className="mb-3">
                      <label className="form-label fw-600">Title <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., How to Master React Hooks"
                        autoFocus
                      />
                      {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                    </div>

                    {/* Description */}
                    <div className="mb-3">
                      <label className="form-label fw-600">Short Description <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="A brief summary (max 300 chars)"
                        maxLength="300"
                      />
                      {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                    </div>

                    {/* Article Type */}
                    <div className="mb-3">
                      <label className="form-label fw-600">Article Type <span className="text-danger">*</span></label>
                      <select
                        className={`form-select ${errors.articleType ? 'is-invalid' : ''}`}
                        name="articleType"
                        value={formData.articleType}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Type...</option>
                        {renderSelectOptions(articleTypes)}
                      </select>
                      {errors.articleType && <div className="invalid-feedback">{errors.articleType}</div>}
                    </div>
                  </div>
                )}

                {/* STEP 2: CONTENT */}
                {currentStep === 2 && (
                  <div className="animate-fade-in">
                    <div className="mb-3">
                      <label className="form-label fw-600">Content <span className="text-danger">*</span></label>
                      <div className="position-relative">
                        <textarea
                          className={`form-control ${errors.content ? 'is-invalid' : ''}`}
                          name="content"
                          value={formData.content}
                          onChange={handleInputChange}
                          rows="12"
                          placeholder="Write your article here..."
                          style={{ resize: 'vertical', minHeight: '300px' }}
                        ></textarea>
                        {/* Simple toolbar placeholder */}
                        <div className="position-absolute top-0 end-0 p-2 text-muted small opacity-50">
                          Markdown Supported
                        </div>
                      </div>
                      {errors.content && <div className="invalid-feedback d-block">{errors.content}</div>}
                      <div className="text-muted small mt-1 text-end">
                        {formData.content.length} characters
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: CLASSIFICATION */}
                {currentStep === 3 && (
                  <div className="animate-fade-in">
                    <div className="row g-3">
                      {/* Category */}
                      <div className="col-md-6">
                        <label className="form-label fw-600">Category <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`}
                          name="categoryId"
                          value={formData.categoryId}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Category...</option>
                          {renderSelectOptions(categories)}
                        </select>
                        {errors.categoryId && <div className="invalid-feedback">{errors.categoryId}</div>}
                      </div>

                      {/* Sub Category */}
                      <div className="col-md-6">
                        <label className="form-label fw-600">Sub-Category <span className="text-muted">(Optional)</span></label>
                        <select
                          className="form-select"
                          name="subCategoryId"
                          value={formData.subCategoryId}
                          onChange={handleInputChange}
                          disabled={!formData.categoryId || subCategories.length === 0}
                        >
                          <option value="">Select Sub-Category...</option>
                          {renderSelectOptions(subCategories)}
                        </select>
                      </div>

                      {/* Intent Type */}
                      <div className="col-md-6">
                        <label className="form-label fw-600">Intent <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.intentType ? 'is-invalid' : ''}`}
                          name="intentType"
                          value={formData.intentType}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Intent...</option>
                          {renderSelectOptions(intentTypes)}
                        </select>
                        {errors.intentType && <div className="invalid-feedback">{errors.intentType}</div>}
                      </div>

                      {/* Audience Type */}
                      <div className="col-md-6">
                        <label className="form-label fw-600">Target Audience <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.audienceType ? 'is-invalid' : ''}`}
                          name="audienceType"
                          value={formData.audienceType}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Audience...</option>
                          {renderSelectOptions(audienceTypes)}
                        </select>
                        {errors.audienceType && <div className="invalid-feedback">{errors.audienceType}</div>}
                      </div>

                      {/* Visibility */}
                      <div className="col-md-6">
                        <label className="form-label fw-600">Visibility</label>
                        <select
                          className="form-select"
                          name="visibility"
                          value={formData.visibility}
                          onChange={handleInputChange}
                        >
                          <option value="Public">Public (Everyone can see)</option>
                          <option value="Private">Private (Only you)</option>
                        </select>
                      </div>

                      {/* Tags */}
                      <div className="col-md-6">
                        <label className="form-label fw-600">Tags</label>
                        <input
                          type="text"
                          className="form-control"
                          name="tags"
                          value={formData.tags}
                          onChange={handleInputChange}
                          placeholder="e.g. react, tutorial"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </form>
            )}
          </div>

          {/* Footer - Navigation Buttons */}
          <div className="modal-footer border-top-0 pt-0">
            {currentStep > 1 && (
              <button
                type="button"
                className="btn btn-outline-secondary px-4 rounded-pill"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                className="btn btn-primary px-4 rounded-pill"
                onClick={handleNext}
                disabled={loading || dataLoading}
              >
                Next Step <i className="bi bi-arrow-right ms-2"></i>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success px-5 rounded-pill shadow-sm"
                onClick={handleSubmit}
                disabled={loading || dataLoading}
                style={{ fontWeight: 600 }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Publishing...
                  </>
                ) : (
                  'Publish Article'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .bg-gradient-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .animate-fade-in {
            animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default CreateArticleModal;