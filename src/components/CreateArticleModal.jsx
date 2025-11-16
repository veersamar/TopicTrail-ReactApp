import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function CreateArticleModal({ show, onClose, onSuccess }) {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await api.getCategories();
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (categoryId) {
        const data = await api.getSubCategories(categoryId);
        setSubCategories(data || []);
        setSubCategoryId('');
      }
    };
    fetchSubCategories();
  }, [categoryId]);

  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!content.trim()) newErrors.content = 'Content is required';
    if (!categoryId) newErrors.categoryId = 'Category is required';
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await api.createArticle(token, {
        title,
        description,
        content,
        categoryId: parseInt(categoryId),
        subCategoryId: subCategoryId ? parseInt(subCategoryId) : 0,
        articleType: 'Post',
        contentType: 'Article',
        tags: tags || 'general',
      });

      if (result.success) {
        alert('✅ Article published successfully!');
        setTitle('');
        setDescription('');
        setContent('');
        setCategoryId('');
        setSubCategoryId('');
        setTags('');
        setErrors({});
        onSuccess();
      } else {
        alert('❌ Failed to create article: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-pen me-2"></i>Create New Article
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {/* Title */}
            <div className="mb-3">
              <label className="form-label fw-bold">Title *</label>
              <input
                type="text"
                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter article title"
              />
              {errors.title && <div className="invalid-feedback d-block">{errors.title}</div>}
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="form-label fw-bold">Description *</label>
              <input
                type="text"
                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of your article"
              />
              {errors.description && <div className="invalid-feedback d-block">{errors.description}</div>}
            </div>

            {/* Content */}
            <div className="mb-3">
              <label className="form-label fw-bold">Content *</label>
              <textarea
                className={`form-control ${errors.content ? 'is-invalid' : ''}`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="6"
                placeholder="Write your article content here..."
              />
              {errors.content && <div className="invalid-feedback d-block">{errors.content}</div>}
            </div>

            {/* Category & SubCategory */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Category *</label>
                <select
                  className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && <div className="invalid-feedback d-block">{errors.categoryId}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Sub-Category</label>
                <select
                  className="form-select"
                  value={subCategoryId}
                  onChange={(e) => setSubCategoryId(e.target.value)}
                  disabled={!categoryId}
                >
                  <option value="">Select Sub-Category (Optional)</option>
                  {subCategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-3">
              <label className="form-label fw-bold">Tags (comma-separated)</label>
              <input
                type="text"
                className="form-control"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., technology, tutorial, news"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Publishing...
                </>
              ) : (
                '✓ Publish Article'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateArticleModal;