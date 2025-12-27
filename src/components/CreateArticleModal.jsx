import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CreateArticleModal({ show, onClose, onSuccess, articleType: propArticleType = 'post' }) {
  const { token, userId } = useAuth();
  const tagInputRef = useRef(null);

  // Type configuration
  const typeConfig = {
    post: { icon: '📝', title: 'Create New Post', subtitle: 'Share an article or blog with the community' },
    question: { icon: '❓', title: 'Ask a Question', subtitle: 'Get answers from the community' },
    poll: { icon: '📊', title: 'Create a Poll', subtitle: 'Gather opinions from the community' },
  };

  const currentTypeConfig = typeConfig[propArticleType] || typeConfig.post;

  const [formState, setFormState] = useState({
    loading: false,
    dataLoading: true,
    errors: {},
    successMessage: '',
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
    audienceTypes: [],
    visibility: 'Public',
    tags: [],
    pollOptions: ['', ''], // For poll type
    attachments: [], // For file attachments
  });

  // Tag input state
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Reset form when modal opens and set article type from prop
  useEffect(() => {
    if (show) {
      setFormData({
        title: '',
        description: '',
        content: '',
        categoryId: '',
        subCategoryId: '',
        articleType: '',
        intentType: '',
        audienceTypes: [],
        visibility: 'Public',
        tags: [],
        pollOptions: ['', ''],
        attachments: [],
      });
      setTagInput('');
      setTagSuggestions([]);
      setFormState(prev => ({ ...prev, errors: {}, successMessage: '', loading: false }));
      fetchMasterData();
    }
  }, [show]);


  // Fetch master data and set ArticleType from prop
  const fetchMasterData = async () => {
    try {
      setFormState(prev => ({ ...prev, dataLoading: true }));

      const [cats, types, intents, audiences] = await Promise.all([
        api.getCategories(),
        api.getMasterDataByType('ArticleType'),
        api.getMasterDataByType('IntentType'),
        api.getMasterDataByType('AudienceType'),
      ]);

      // Find article type based on prop
      const targetType = types.find(t =>
        (t.name || t.Name || '').toLowerCase() === propArticleType.toLowerCase()
      );
      const selectedArticleType = targetType ? (targetType.id || targetType.Id || targetType.value || targetType.Value) : '';

      setFormState(prev => ({
        ...prev,
        categories: Array.isArray(cats) ? cats : [],
        articleTypes: types,
        intentTypes: intents,
        audienceTypes: audiences,
        dataLoading: false,
      }));

      // Set ArticleType based on prop
      if (selectedArticleType) {
        setFormData(prev => ({ ...prev, articleType: selectedArticleType }));
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      setFormState(prev => ({ ...prev, dataLoading: false }));
    }
  };

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubCats = async () => {
      if (!formData.categoryId) {
        setFormState(prev => ({ ...prev, subCategories: [] }));
        return;
      }
      try {
        const subCats = await api.getSubCategories(formData.categoryId);
        setFormState(prev => ({ ...prev, subCategories: subCats }));
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      }
    };
    fetchSubCats();
  }, [formData.categoryId]);

  // Fetch tag suggestions with debounce
  useEffect(() => {
    const fetchTags = async () => {
      if (tagInput.length >= 2) {
        try {
          const suggestions = await api.suggestTags(tagInput);
          setTagSuggestions(suggestions);
          setShowTagSuggestions(true);
        } catch (error) {
          console.error('Error fetching tag suggestions:', error);
        }
      } else {
        setTagSuggestions([]);
        setShowTagSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchTags, 300);
    return () => clearTimeout(debounceTimer);
  }, [tagInput]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formState.errors[name]) {
      setFormState(prev => ({ ...prev, errors: { ...prev.errors, [name]: null } }));
    }
  };

  // Tag handlers
  const addTag = useCallback((tag) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmedTag] }));
    }
    setTagInput('');
    setShowTagSuggestions(false);
    tagInputRef.current?.focus();
  }, [formData.tags]);

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim()) {
        addTag(tagInput);
      }
    } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
      removeTag(formData.tags[formData.tags.length - 1]);
    }
  };

  // Validation - Title, Content, Category, and ArticleType are required by API
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }

    if (!formData.content?.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 50) {
      newErrors.content = 'Content must be at least 50 characters';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.articleType) {
      newErrors.articleType = 'Article Type is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormState(prev => ({ ...prev, errors: newErrors }));
      return false;
    }
    return true;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setFormState(prev => ({ ...prev, loading: true, errors: {} }));

      const articleData = {
        Title: formData.title.trim(),
        Description: formData.description?.trim() || null,
        Content: formData.content.trim(),
        CategoryId: parseInt(formData.categoryId, 10),
        SubCategoryId: formData.subCategoryId ? parseInt(formData.subCategoryId, 10) : null,
        ArticleType: parseInt(formData.articleType, 10),
        IntentType: formData.intentType ? parseInt(formData.intentType, 10) : null,
        AudienceTypes: formData.audienceTypes.length > 0 ? formData.audienceTypes.map(id => parseInt(id, 10)) : null,
        Tags: formData.tags.length > 0 ? formData.tags : ['general'],
        Visibility: formData.visibility,
        AttachmentUrls: formData.attachments.filter(url => url.trim() !== ''),
        PollOptions: formData.pollOptions.filter(opt => opt.trim() !== ''),
      };

      console.log('Submitting article data:', articleData);
      const result = await api.createArticle(token, userId, articleData);

      if (result.success) {
        setFormState(prev => ({
          ...prev,
          loading: false,
          successMessage: 'Article created successfully!',
        }));
        if (onSuccess) onSuccess();
        setTimeout(() => onClose(), 1500);
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

  // Render select options helper
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
    <div className="create-article-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="create-article-container">
        {/* Header */}
        {/* Header */}
        <div className="create-article-header">
          <div className="header-content">
            <div className="header-icon">
              <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{currentTypeConfig.icon}</span>
            </div>
            <div>
              <h2 className="header-title">{currentTypeConfig.title}</h2>
              <p className="header-subtitle">{currentTypeConfig.subtitle}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} disabled={loading}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="create-article-body">
          {successMessage && (
            <div className="alert alert-success">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              {successMessage}
            </div>
          )}

          {errors.submit && (
            <div className="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              {errors.submit}
            </div>
          )}

          {dataLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading options...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Title - Common for all */}
              <div className="form-group">
                <label className="form-label">
                  {propArticleType === 'question' ? 'Question' : 'Title'} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={propArticleType === 'question' ? 'What would you like to ask?' : 'Enter an engaging title...'}
                  autoFocus
                />
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>

              {/* Description - POst Only */}
              {propArticleType === 'post' && (
                <div className="form-group">
                  <label className="form-label">
                    Description <span className="optional">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="A brief summary of your article..."
                    maxLength="1000"
                  />
                  <span className="char-count">{formData.description.length}/1000</span>
                </div>
              )}

              {/* Attachments - Post Only */}
              {propArticleType === 'post' && (
                <div className="form-group">
                  <label className="form-label">
                    Attachments <span className="optional">(Image URLs)</span>
                  </label>
                  {formData.attachments.map((url, idx) => (
                    <div key={idx} className="mb-2 d-flex gap-2">
                      <input
                        type="text"
                        className="form-input"
                        value={url}
                        onChange={(e) => {
                          const newAttachments = [...formData.attachments];
                          newAttachments[idx] = e.target.value;
                          setFormData(prev => ({ ...prev, attachments: newAttachments }));
                        }}
                        placeholder="https://example.com/image.jpg"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => {
                          const newAttachments = formData.attachments.filter((_, i) => i !== idx);
                          setFormData(prev => ({ ...prev, attachments: newAttachments }));
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {formData.attachments.length < 3 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary mt-1"
                      onClick={() => setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ''] }))}
                    >
                      + Add Image URL
                    </button>
                  )}
                </div>
              )}

              {/* Poll Options */}
              {propArticleType === 'poll' && (
                <div className="form-group">
                  <label className="form-label">
                    Poll Options <span className="required">*</span>
                  </label>
                  {formData.pollOptions.map((option, idx) => (
                    <div key={idx} className="mb-2 d-flex gap-2">
                      <input
                        type="text"
                        className="form-input"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.pollOptions];
                          newOptions[idx] = e.target.value;
                          setFormData(prev => ({ ...prev, pollOptions: newOptions }));
                        }}
                        placeholder={`Option ${idx + 1}`}
                      />
                      {formData.pollOptions.length > 2 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => {
                            const newOptions = formData.pollOptions.filter((_, i) => i !== idx);
                            setFormData(prev => ({ ...prev, pollOptions: newOptions }));
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.pollOptions.length < 5 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary mt-1"
                      onClick={() => setFormData(prev => ({ ...prev, pollOptions: [...prev.pollOptions, ''] }))}
                    >
                      + Add Option
                    </button>
                  )}
                </div>
              )}

              {/* Content / Details */}
              <div className="form-group">
                <label className="form-label">
                  {propArticleType === 'question' ? 'Details' : propArticleType === 'poll' ? 'Description' : 'Content'} <span className="required">*</span>
                </label>
                <div className="textarea-wrapper">
                  <textarea
                    className={`form-textarea ${errors.content ? 'error' : ''}`}
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={propArticleType === 'post' ? "10" : "5"}
                    placeholder={
                      propArticleType === 'question'
                        ? "Provide more details about your question..."
                        : propArticleType === 'poll'
                          ? "Explain what you are polling about..."
                          : "Write your article content here... (Minimum 50 characters)"
                    }
                  ></textarea>
                </div>
                {errors.content && <span className="error-text">{errors.content}</span>}
              </div>

              {/* Two column layout for selects */}
              <div className="form-row">
                {/* Category - Required */}
                <div className="form-group half">
                  <label className="form-label">
                    Category <span className="required">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.categoryId ? 'error' : ''}`}
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Category...</option>
                    {renderSelectOptions(categories)}
                  </select>
                  {errors.categoryId && <span className="error-text">{errors.categoryId}</span>}
                </div>

                {/* Sub Category - Optional */}
                <div className="form-group half">
                  <label className="form-label">
                    Sub-Category <span className="optional">(Optional)</span>
                  </label>
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
              </div>

              {/* Intent Type - Optional (Hidden for Polls/Questions to simplify) */}
              {propArticleType === 'post' && (
                <div className="form-row">
                  <div className="form-group half">
                    <label className="form-label">
                      Intent <span className="optional">(Optional)</span>
                    </label>
                    <select
                      className="form-select"
                      name="intentType"
                      value={formData.intentType}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Intent...</option>
                      {renderSelectOptions(intentTypes)}
                    </select>
                  </div>

                  {/* Visibility */}
                  <div className="form-group half">
                    <label className="form-label">Visibility</label>
                    <select
                      className="form-select"
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleInputChange}
                    >
                      <option value="Public">Public</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Audience Types - Post Only */}
              {propArticleType === 'post' && (
                <div className="form-group">
                  <label className="form-label">
                    Target Audience <span className="optional">(Optional)</span>
                  </label>
                  <div className="multi-select-container">
                    {audienceTypes.map((audience, idx) => {
                      const val = String(audience.id || audience.Id || audience.value || audience.Value);
                      const label = audience.name || audience.Name || audience.value || audience.Value;
                      const isSelected = formData.audienceTypes.includes(val);
                      return (
                        <label
                          key={val || idx}
                          className={`multi-select-item ${isSelected ? 'selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  audienceTypes: [...prev.audienceTypes, val]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  audienceTypes: prev.audienceTypes.filter(id => id !== val)
                                }));
                              }
                            }}
                          />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags - Multi-select with free text */}
              <div className="form-group">
                <label className="form-label">
                  Tags <span className="optional">(Press Enter to add)</span>
                </label>
                <div className="tags-container">
                  <div className="tags-input-wrapper">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="tag-pill">
                        {tag}
                        <button
                          type="button"
                          className="tag-remove"
                          onClick={() => removeTag(tag)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      ref={tagInputRef}
                      type="text"
                      className="tag-input"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                      placeholder={formData.tags.length === 0 ? "Type and press Enter to add tags..." : ""}
                    />
                  </div>
                  {showTagSuggestions && tagSuggestions.length > 0 && (
                    <div className="tag-suggestions">
                      {tagSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="suggestion-item"
                          onClick={() => addTag(typeof suggestion === 'string' ? suggestion : suggestion.name || suggestion.Name)}
                        >
                          {typeof suggestion === 'string' ? suggestion : suggestion.name || suggestion.Name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="create-article-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || dataLoading}
          >
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Publishing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Publish Article
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .create-article-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .create-article-container {
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(30px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }

        /* Header */
        .create-article-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 24px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .header-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          letter-spacing: -0.02em;
        }

        .header-subtitle {
          margin: 4px 0 0 0;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          border-radius: 10px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }

        /* Body */
        .create-article-body {
          flex: 1;
          overflow-y: auto;
          padding: 28px;
        }

        /* Alerts */
        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-weight: 500;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .alert-success {
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
          color: #155724;
          border: 1px solid #b1dfbb;
        }

        .alert-error {
          background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        /* Loading */
        .loading-state {
          text-align: center;
          padding: 60px 20px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e9ecef;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-state p {
          color: #6c757d;
          font-size: 1rem;
        }

        /* Form Styles */
        .form-group {
          margin-bottom: 24px;
          position: relative;
        }

        .form-row {
          display: flex;
          gap: 20px;
          margin-bottom: 0;
        }

        .form-group.half {
          flex: 1;
          min-width: 0;
        }

        .form-label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #344054;
          margin-bottom: 8px;
        }

        .required {
          color: #dc3545;
        }

        .optional {
          color: #6c757d;
          font-weight: 400;
          font-size: 0.8rem;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 14px 18px;
          font-size: 1rem;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          background: #fff;
          color: #344054;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .form-input.error,
        .form-select.error,
        .form-textarea.error {
          border-color: #dc3545;
        }

        .form-input.error:focus,
        .form-select.error:focus,
        .form-textarea.error:focus {
          box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 200px;
          font-family: inherit;
        }

        .textarea-wrapper {
          position: relative;
        }

        .markdown-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .char-count {
          display: block;
          text-align: right;
          font-size: 0.8rem;
          color: #6c757d;
          margin-top: 6px;
        }

        .error-text {
          display: block;
          color: #dc3545;
          font-size: 0.85rem;
          margin-top: 6px;
          animation: shake 0.3s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .form-select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 18px;
          padding-right: 42px;
        }

        .form-select:disabled {
          background-color: #f8f9fa;
          cursor: not-allowed;
          opacity: 0.7;
        }

        /* Multi-select (AudienceTypes) */
        .multi-select-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          background: #fff;
          min-height: 50px;
        }

        .multi-select-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          color: #495057;
        }

        .multi-select-item:hover {
          background: #e9ecef;
        }

        .multi-select-item.selected {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .multi-select-item input[type="checkbox"] {
          display: none;
        }

        /* Tags */
        .tags-container {
          position: relative;
        }

        .tags-input-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px 16px;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          background: #fff;
          min-height: 52px;
          align-items: center;
          transition: all 0.2s ease;
        }

        .tags-input-wrapper:focus-within {
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
          animation: popIn 0.2s ease;
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        .tag-remove {
          background: rgba(255, 255, 255, 0.3);
          border: none;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          color: white;
          transition: background 0.2s ease;
        }

        .tag-remove:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .tag-input {
          flex: 1;
          min-width: 120px;
          border: none;
          outline: none;
          font-size: 1rem;
          background: transparent;
          color: #344054;
        }

        .tag-input::placeholder {
          color: #adb5bd;
        }

        .tag-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #e9ecef;
          border-top: none;
          border-radius: 0 0 12px 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 10;
          max-height: 200px;
          overflow-y: auto;
        }

        .suggestion-item {
          display: block;
          width: 100%;
          padding: 12px 16px;
          text-align: left;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.95rem;
          color: #344054;
          transition: background 0.15s ease;
        }

        .suggestion-item:hover {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        }

        /* Footer */
        .create-article-footer {
          padding: 20px 28px;
          background: #f8f9fa;
          border-top: 1px solid #e9ecef;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary {
          background: #fff;
          color: #495057;
          border: 2px solid #dee2e6;
        }

        .btn-secondary:hover {
          background: #f8f9fa;
          border-color: #c1c8ce;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.35);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.45);
        }

        .btn-primary:disabled {
          background: #adb5bd;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .create-article-container {
            max-height: 100vh;
            border-radius: 0;
          }

          .form-row {
            flex-direction: column;
            gap: 0;
          }

          .create-article-header {
            padding: 20px;
          }

          .create-article-body {
            padding: 20px;
          }

          .header-title {
            font-size: 1.25rem;
          }

          .header-icon {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div >
  );
}

export default CreateArticleModal;