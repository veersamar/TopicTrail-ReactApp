import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function CreateArticleModal({ show, onClose, onSuccess }) {
  const { token } = useAuth();

  // ========== STATE ==========
  const [formData, setFormData] = useState({
    articleType: '',
    title: '',
    description: '',
    content: '',
    categoryId: '',
    subCategoryId: '',
    intentType: '',
    contentType: '',
    audienceType: '',
    tags: '',
  });

  const [articleTypes, setArticleTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [intentTypes, setIntentTypes] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [audienceTypes, setAudienceTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  // ========== FETCH MASTER DATA ON MOUNT ==========
  useEffect(() => {
    if (show) {
      fetchAllData();
    }
  }, [show]);

  const fetchAllData = async () => {
    setDataLoading(true);
    setDebugInfo('Loading data...');
    try {
      console.log('Starting to fetch all data...');

      
      // Fetch articleTypes
      console.log('Fetching article types...');
      const articleTypesData = await api.getCategories();      
      if (articleTypesData){        
        console.log('ArticleTypes received:', articleTypesData);
        setArticleTypes(articleTypesData);
      }

      // Fetch Categories
      console.log('Fetching categories...');
      const categoriesData = await api.getCategories();      
      if (categoriesData){        
        console.log('Categories received:', categoriesData);
        setCategories(categoriesData);
      }
      

      // Fetch Master Data for dropdowns
      console.log('Fetching master data...');
      const masterData = await api.getMasterData();
      console.log('Master data received:', masterData);
      
      if (masterData && masterData.data) {
        // IMPORTANT: Extract arrays from the nested structure
        const intents = masterData.data.IntentType || [];
        const contents = masterData.data.ContentType || [];
        const audiences = masterData.data.AudienceType || [];

        console.log('Extracted IntentTypes:', intents);
        console.log('Extracted ContentTypes:', contents);
        console.log('Extracted AudienceTypes:', audiences);

        // Verify the data structure
        if (Array.isArray(intents) && intents.length > 0) {
          console.log('Sample IntentType:', intents[0]);
          console.log('IntentType properties:', Object.keys(intents[0]));
        }

        setIntentTypes(intents);
        setContentTypes(contents);
        setAudienceTypes(audiences);

        setDebugInfo(
          `✓ Loaded: ${intents.length} Intent Types, ${contents.length} Content Types, ${audiences.length} Audience Types`
        );
      } else {
        setDebugInfo('❌ Master data structure invalid');
        console.error('Master data structure:', masterData);
      }

      setDataLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setDebugInfo('❌ Error: ' + error.message);
      setDataLoading(false);
    }
  };

  // ========== FETCH SUB-CATEGORIES WHEN CATEGORY CHANGES ==========
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (formData.categoryId) {
        console.log('Fetching sub-categories for category:', formData.categoryId);
        const data = await api.getSubCategories(formData.categoryId);
        console.log('Sub-categories received:', data);
        setSubCategories(Array.isArray(data) ? data : []);
        setFormData(prev => ({ ...prev, subCategoryId: '' }));
      } else {
        setSubCategories([]);
      }
    };
    fetchSubCategories();
  }, [formData.categoryId]);

  // ========== FORM VALIDATION ==========
  const validateForm = () => {
    const newErrors = {};

    if (!formData.articleType) {
      newErrors.articleType = 'Article Type is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 20) {
      newErrors.content = 'Content must be at least 20 characters';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.intentType) {
      newErrors.intentType = 'Intent Type is required';
    }

    if (!formData.contentType) {
      newErrors.contentType = 'Content Type is required';
    }

    if (!formData.audienceType) {
      newErrors.audienceType = 'Audience Type is required';
    }

    return newErrors;
  };

  // ========== HANDLE INPUT CHANGE ==========
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = ${value}`);
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // ========== HANDLE FORM SUBMISSION ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setSuccessMessage('');

    try {
      const articleData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        categoryId: parseInt(formData.categoryId),
        subCategoryId: formData.subCategoryId ? parseInt(formData.subCategoryId) : 0,
        articleType: formData.articleType,
        contentType: formData.contentType,
        intentType: formData.intentType,
        audienceType: formData.audienceType,
        tags: formData.tags || 'general',
        status: 'Published',
        visibility: 'Public'
      };

      console.log('Submitting article:', articleData);

      // Call API to create article
      const result = await api.createArticle(token, articleData);
      console.log('API response:', result);

      if (result.success || result.id) {
        setSuccessMessage(`✅ Article "${formData.title}" published successfully!`);
        
        // Reset form
        setFormData({
          articleType: '',
          title: '',
          description: '',
          content: '',
          categoryId: '',
          subCategoryId: '',
          intentType: '',
          contentType: '',
          audienceType: '',
          tags: '',
          visibility: '',
        });
        setErrors({});

        // Wait 2 seconds then close
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrors({ submit: result.error || 'Failed to create article' });
      }
    } catch (error) {
      console.error('Submit error:', error);
      setErrors({ submit: 'Error: ' + (error.message || 'Failed to create article') });
    } finally {
      setLoading(false);
    }
  };

  // ========== RENDER DROPDOWN HELPER ==========
  const renderSelectOptions = (dataArray) => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return null;
    }

    return dataArray.map(item => (
      <option key={item.Code} value={item.Id}>
        {item.Name}
      </option>
    ));
  };

  // ========== IF MODAL NOT SHOWN ==========
  if (!show) return null;

  // ========== RENDER ==========
  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          {/* ========== HEADER ========== */}
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-pen me-2"></i>Create New Article
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          {/* ========== BODY ========== */}
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Debug Info */}
            {debugInfo && (
              <div className={`alert ${debugInfo.startsWith('✓') ? 'alert-success' : 'alert-info'} small mb-2`}>
                <strong>Debug:</strong> {debugInfo}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                {successMessage}
                <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {errors.submit}
                <button type="button" className="btn-close" onClick={() => setErrors(prev => ({ ...prev, submit: '' }))}></button>
              </div>
            )}

            {/* Data Loading Alert */}
            {dataLoading && (
              <div className="alert alert-warning" role="alert">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Loading categories and master data...
              </div>
            )}

            {/* ========== ARTICLE TYPE ========== */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                Article Type <span className="text-danger">*</span>
              </label>
              <select
                className={`form-select ${errors.articleType ? 'is-invalid' : ''}`}
                name="articleType"
                value={formData.articleType}
                onChange={handleInputChange}
                disabled={loading || dataLoading || articleTypes.length === 0}
              >
                <option value="">
                  {articleTypes.length === 0 ? 'Loading...' : 'Select Article Type'}
                </option>
                {renderSelectOptions(articleTypes)}
              </select>
              {errors.articleType && (
                <div className="invalid-feedback d-block">{errors.articleType}</div>
              )}
              {articleTypes.length > 0 && (
                <small className="text-success">✓ {articleTypes.length} article types available</small>
              )}
              {articleTypes.length === 0 && !dataLoading && (
                <small className="text-warning">⚠ No article types found</small>
              )}
              <small className="text-muted d-block mt-1">
                <i className="bi bi-info-circle"></i> Purpose of the article type
              </small>
            </div>

            {/* ========== TITLE FIELD ========== */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter article title (min 5 characters)"
                disabled={loading}
              />
              {errors.title && (
                <div className="invalid-feedback d-block">{errors.title}</div>
              )}
              <small className="text-muted">
                {formData.title.length}/5 minimum
              </small>
            </div>

            {/* ========== DESCRIPTION FIELD ========== */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                Description <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief summary of your article (min 10 characters)"
                disabled={loading}
              />
              {errors.description && (
                <div className="invalid-feedback d-block">{errors.description}</div>
              )}
              <small className="text-muted">
                {formData.description.length}/10 minimum
              </small>
            </div>

            {/* ========== CONTENT FIELD ========== */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                Content <span className="text-danger">*</span>
              </label>
              <textarea
                className={`form-control ${errors.content ? 'is-invalid' : ''}`}
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows="6"
                placeholder="Write your article content here... (min 20 characters)"
                disabled={loading}
              />
              {errors.content && (
                <div className="invalid-feedback d-block">{errors.content}</div>
              )}
              <small className="text-muted">
                {formData.content.length}/20 minimum | Word count: {formData.content.split(/\s+/).filter(w => w).length}
              </small>
            </div>

            {/* ========== CATEGORY & SUB-CATEGORY ROW ========== */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">
                  Category <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`}
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  disabled={loading || dataLoading || categories.length === 0}
                >
                  <option value="">
                    {categories.length === 0 ? 'Loading...' : 'Select Category'}
                  </option>
                  {renderSelectOptions(categories)}
                </select>
                {errors.categoryId && (
                  <div className="invalid-feedback d-block">{errors.categoryId}</div>
                )}
                {categories.length > 0 && (
                  <small className="text-success">✓ {categories.length} categories available</small>
                )}
                {categories.length === 0 && !dataLoading && (
                  <small className="text-warning">⚠ No categories found</small>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold">
                  Sub-Category <span className="text-muted">(Optional)</span>
                </label>
                <select
                  className="form-select"
                  name="subCategoryId"
                  value={formData.subCategoryId}
                  onChange={handleInputChange}
                  disabled={loading || !formData.categoryId || subCategories.length === 0}
                >
                  <option value="">
                    {!formData.categoryId ? 'Select category first' : 'Select Sub-Category (optional)'}
                  </option>
                  {renderSelectOptions(subCategories)}
                </select>
                {formData.categoryId && subCategories.length > 0 && (
                  <small className="text-success">✓ {subCategories.length} sub-categories available</small>
                )}
              </div>
            </div>

            {/* ========== INTENT TYPE ========== */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                Intent Type <span className="text-danger">*</span>
              </label>
              <select
                className={`form-select ${errors.intentType ? 'is-invalid' : ''}`}
                name="intentType"
                value={formData.intentType}
                onChange={handleInputChange}
                disabled={loading || dataLoading || intentTypes.length === 0}
              >
                <option value="">
                  {intentTypes.length === 0 ? 'Loading...' : 'Select Intent Type'}
                </option>
                {renderSelectOptions(intentTypes)}
              </select>
              {errors.intentType && (
                <div className="invalid-feedback d-block">{errors.intentType}</div>
              )}
              {intentTypes.length > 0 && (
                <small className="text-success">✓ {intentTypes.length} intent types available</small>
              )}
              {intentTypes.length === 0 && !dataLoading && (
                <small className="text-warning">⚠ No intent types found</small>
              )}
              <small className="text-muted d-block mt-1">
                <i className="bi bi-info-circle"></i> Purpose of the article
              </small>
            </div>

            {/* ========== CONTENT TYPE ========== */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                Content Type <span className="text-danger">*</span>
              </label>
              <select
                className={`form-select ${errors.contentType ? 'is-invalid' : ''}`}
                name="contentType"
                value={formData.contentType}
                onChange={handleInputChange}
                disabled={loading || dataLoading || contentTypes.length === 0}
              >
                <option value="">
                  {contentTypes.length === 0 ? 'Loading...' : 'Select Content Type'}
                </option>
                {renderSelectOptions(contentTypes)}
              </select>
              {errors.contentType && (
                <div className="invalid-feedback d-block">{errors.contentType}</div>
              )}
              {contentTypes.length > 0 && (
                <small className="text-success">✓ {contentTypes.length} content types available</small>
              )}
              {contentTypes.length === 0 && !dataLoading && (
                <small className="text-warning">⚠ No content types found</small>
              )}
              <small className="text-muted d-block mt-1">
                <i className="bi bi-info-circle"></i> Format of the article
              </small>
            </div>

            {/* ========== AUDIENCE TYPE ========== */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                Audience Type <span className="text-danger">*</span>
              </label>
              <select
                className={`form-select ${errors.audienceType ? 'is-invalid' : ''}`}
                name="audienceType"
                value={formData.audienceType}
                onChange={handleInputChange}
                disabled={loading || dataLoading || audienceTypes.length === 0}
              >
                <option value="">
                  {audienceTypes.length === 0 ? 'Loading...' : 'Select Audience Type'}
                </option>
                {renderSelectOptions(audienceTypes)}
              </select>
              {errors.audienceType && (
                <div className="invalid-feedback d-block">{errors.audienceType}</div>
              )}
              {audienceTypes.length > 0 && (
                <small className="text-success">✓ {audienceTypes.length} audience types available</small>
              )}
              {audienceTypes.length === 0 && !dataLoading && (
                <small className="text-warning">⚠ No audience types found</small>
              )}
              <small className="text-muted d-block mt-1">
                <i className="bi bi-info-circle"></i> Target audience
              </small>
            </div>

            {/* ========== TAGS ========== */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                Tags <span className="text-muted">(comma-separated, optional)</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., technology, tutorial, news, productivity"
                disabled={loading}
              />
              <small className="text-muted">
                Help readers find your article with relevant keywords
              </small>
            </div>
          </div>

          {/* ========== FOOTER ========== */}
          <div className="modal-footer bg-light">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              <i className="bi bi-x-circle me-2"></i>Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || dataLoading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Publishing...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>Publish Article
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