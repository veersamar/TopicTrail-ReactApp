import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

function CreateArticlePage() {
    const { token, userId } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const articleTypeParam = searchParams.get('type') || 'post';

    const tagInputRef = useRef(null);

    // Type configuration
    const typeConfig = {
        post: { icon: '📝', title: 'Create New Post', subtitle: 'Share an article or blog with the community' },
        question: { icon: '❓', title: 'Ask a Question', subtitle: 'Get answers from the community' },
        poll: { icon: '📊', title: 'Create a Poll', subtitle: 'Gather opinions from the community' },
    };

    const currentTypeConfig = typeConfig[articleTypeParam] || typeConfig.post;

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

    const [activeTab, setActiveTab] = useState('basics');
    const [activeContentPage, setActiveContentPage] = useState(0);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        pages: [''], // Changed from content to pages array
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

    // Tag input state
    const [tagInput, setTagInput] = useState('');
    const [tagSuggestions, setTagSuggestions] = useState([]);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);

    // Fetch master data on mount
    useEffect(() => {
        fetchMasterData();
    }, [articleTypeParam]);

    // Fetch master data and set ArticleType from prop
    const fetchMasterData = async () => {
        try {
            setFormState(prev => ({ ...prev, dataLoading: true, errors: {} }));

            // Reset form data slightly when type changes, but maybe keep some? 
            // Safe to re-init for clean slate
            // setFormData (reset if needed, but simplified here)

            const [cats, types, intents, audiences] = await Promise.all([
                api.getCategories(),
                api.getMasterDataByType('ArticleType'),
                api.getMasterDataByType('IntentType'),
                api.getMasterDataByType('AudienceType'),
            ]);

            // Find article type based on prop
            const targetType = types.find(t =>
                (t.name || t.Name || '').toLowerCase() === articleTypeParam.toLowerCase()
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

    // Handle page content change
    const handlePageChange = (index, value) => {
        setFormData(prev => {
            const newPages = [...prev.pages];
            newPages[index] = value;
            return { ...prev, pages: newPages };
        });

        // Clear content error if any
        if (formState.errors.content) {
            setFormState(prev => ({ ...prev, errors: { ...prev.errors, content: null } }));
        }
    };

    const addPage = () => {
        setFormData(prev => {
            const newPages = [...prev.pages, ''];
            setActiveContentPage(newPages.length - 1);
            return { ...prev, pages: newPages };
        });
    };

    const removePage = (index) => {
        setFormData(prev => {
            if (prev.pages.length <= 1) return prev;
            const newPages = prev.pages.filter((_, i) => i !== index);
            if (activeContentPage >= newPages.length) {
                setActiveContentPage(newPages.length - 1);
            }
            return { ...prev, pages: newPages };
        });
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

    // Validation
    const validateForm = () => {
        const newErrors = {};

        if (!formData.title?.trim()) {
            newErrors.title = 'Title is required';
            setActiveTab('basics'); // Switch to basics tab to show error
        } else if (formData.title.length < 10) {
            newErrors.title = 'Title must be at least 10 characters';
            setActiveTab('basics');
        }

        const totalContent = formData.pages.join('').trim();
        if (!totalContent) {
            newErrors.content = 'Content is required';
            setActiveTab('content');
        } else if (totalContent.length < 50) {
            newErrors.content = 'Total content must be at least 50 characters';
            setActiveTab('content');
        }

        if (!formData.categoryId) {
            newErrors.categoryId = 'Category is required';
            setActiveTab('basics');
        }

        if (!formData.articleType) {
            newErrors.articleType = 'Article Type is required';
            setActiveTab('basics'); // Should not happen usually as it is set from URL
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
                Content: formData.pages.join('<!-- PAGE_BREAK -->'), // Join pages
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

                setTimeout(() => {
                    navigate('/articles');
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

    const { loading, dataLoading, errors, successMessage, categories, subCategories, intentTypes, audienceTypes } = formState;

    if (dataLoading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Loading options...</p>
            </div>
        );
    }

    return (
        <div className="create-article-page pb-5">
            <div className="d-flex align-items-center mb-4">
                <div className="me-3 p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{currentTypeConfig.icon}</span>
                </div>
                <div>
                    <h2 className="mb-1 fw-bold">{currentTypeConfig.title}</h2>
                    <p className="text-muted mb-0">{currentTypeConfig.subtitle}</p>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-bottom-0 pt-4 px-4 pb-0">
                    <ul className="nav nav-tabs card-header-tabs">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'basics' ? 'active fw-bold' : ''}`}
                                onClick={() => setActiveTab('basics')}
                            >
                                1. Basics
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'content' ? 'active fw-bold' : ''}`}
                                onClick={() => setActiveTab('content')}
                            >
                                2. Content
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'settings' ? 'active fw-bold' : ''}`}
                                onClick={() => setActiveTab('settings')}
                            >
                                3. Settings
                            </button>
                        </li>
                    </ul>
                </div>

                <div className="card-body p-4">
                    {successMessage && (
                        <div className="alert alert-success d-flex align-items-center mb-4">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            {successMessage}
                        </div>
                    )}
                    {errors.submit && (
                        <div className="alert alert-danger d-flex align-items-center mb-4">
                            <i className="bi bi-exclamation-circle-fill me-2"></i>
                            {errors.submit}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        {/* TAB: BASICS */}
                        {activeTab === 'basics' && (
                            <div className="animate__animated animate__fadeIn">
                                {/* Title */}
                                <div className="mb-3">
                                    <label className="form-label fw-bold">
                                        {articleTypeParam === 'question' ? 'Question' : 'Title'} <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder={articleTypeParam === 'question' ? 'What would you like to ask?' : 'Enter an engaging title...'}
                                    />
                                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                </div>

                                {/* Description (Post Only) */}
                                {articleTypeParam === 'post' && (
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">
                                            Description <span className="text-muted fw-normal">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="A brief summary..."
                                            maxLength="1000"
                                        />
                                        <div className="text-end form-text">{formData.description.length}/1000</div>
                                    </div>
                                )}

                                {/* Category & Subcategory */}
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Category <span className="text-danger">*</span></label>
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
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Sub-Category</label>
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

                                {/* Tags */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold">Tags</label>
                                    <div className="p-2 border rounded bg-white tags-input-container">
                                        <div className="d-flex flex-wrap gap-2 mb-2">
                                            {formData.tags.map((tag, index) => (
                                                <span key={index} className="badge bg-primary-subtle text-primary border border-primary-subtle d-flex align-items-center">
                                                    {tag}
                                                    <button type="button" className="btn-close btn-close-white ms-2" style={{ fontSize: '0.5em' }} onClick={() => removeTag(tag)}></button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="position-relative">
                                            <input
                                                ref={tagInputRef}
                                                type="text"
                                                className="form-control border-0 shadow-none p-0"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleTagKeyDown}
                                                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                                                placeholder={formData.tags.length === 0 ? "Type and press Enter..." : "Add more tags..."}
                                            />
                                            {showTagSuggestions && tagSuggestions.length > 0 && (
                                                <div className="list-group position-absolute w-100 shadow-sm mt-1" style={{ zIndex: 10 }}>
                                                    {tagSuggestions.map((suggestion, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            className="list-group-item list-group-item-action"
                                                            onClick={() => addTag(typeof suggestion === 'string' ? suggestion : suggestion.name || suggestion.Name)}
                                                        >
                                                            {typeof suggestion === 'string' ? suggestion : suggestion.name || suggestion.Name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments (Post Only) */}
                                {articleTypeParam === 'post' && (
                                    <div className="mb-4">
                                        <label className="form-label fw-bold">Image URLs</label>
                                        {formData.attachments.map((url, idx) => (
                                            <div key={idx} className="input-group mb-2">
                                                <input
                                                    type="text"
                                                    className="form-control"
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
                                                    className="btn btn-outline-danger"
                                                    onClick={() => {
                                                        const newAttachments = formData.attachments.filter((_, i) => i !== idx);
                                                        setFormData(prev => ({ ...prev, attachments: newAttachments }));
                                                    }}
                                                >
                                                    <i className="bi bi-x"></i>
                                                </button>
                                            </div>
                                        ))}
                                        {formData.attachments.length < 3 && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ''] }))}
                                            >
                                                + Add Image URL
                                            </button>
                                        )}
                                    </div>
                                )}
                                {/* Poll Options (Poll Only) */}
                                {articleTypeParam === 'poll' && (
                                    <div className="mb-4">
                                        <label className="form-label fw-bold">Poll Options <span className="text-danger">*</span></label>
                                        {formData.pollOptions.map((option, idx) => (
                                            <div key={idx} className="input-group mb-2">
                                                <span className="input-group-text">{idx + 1}</span>
                                                <input
                                                    type="text"
                                                    className="form-control"
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
                                                        className="btn btn-outline-danger"
                                                        onClick={() => {
                                                            const newOptions = formData.pollOptions.filter((_, i) => i !== idx);
                                                            setFormData(prev => ({ ...prev, pollOptions: newOptions }));
                                                        }}
                                                    >
                                                        <i className="bi bi-x"></i>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {formData.pollOptions.length < 5 && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => setFormData(prev => ({ ...prev, pollOptions: [...prev.pollOptions, ''] }))}
                                            >
                                                + Add Option
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="d-flex justify-content-end mt-4">
                                    <button type="button" className="btn btn-primary" onClick={() => setActiveTab('content')}>
                                        Next: Content <i className="bi bi-arrow-right ms-1"></i>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB: CONTENT */}
                        {activeTab === 'content' && (
                            <div className="animate__animated animate__fadeIn">
                                <div className="d-flex mb-3 align-items-center overflow-auto pb-2">
                                    {formData.pages.map((_, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className={`btn btn-sm me-2 text-nowrap ${activeContentPage === idx ? 'btn-primary' : 'btn-outline-secondary'}`}
                                            onClick={() => setActiveContentPage(idx)}
                                        >
                                            Page {idx + 1}
                                            {formData.pages.length > 1 && (
                                                <i className="bi bi-x ms-2" onClick={(e) => { e.stopPropagation(); removePage(idx); }}></i>
                                            )}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-success"
                                        onClick={addPage}
                                    >
                                        <i className="bi bi-plus-lg me-1"></i> Add Page
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-bold">
                                        {articleTypeParam === 'question' ? 'Details' : articleTypeParam === 'poll' ? 'Description' : `Content - Page ${activeContentPage + 1}`} <span className="text-danger">*</span>
                                    </label>
                                    <div className={`quill-wrapper ${errors.content ? 'is-invalid border border-danger rounded' : ''}`} style={{ background: '#fff' }}>
                                        <ReactQuill
                                            key={activeContentPage}
                                            theme="snow"
                                            value={formData.pages[activeContentPage] || ''}
                                            onChange={(value) => handlePageChange(activeContentPage, value)}
                                            placeholder="Write your content here..."
                                            style={{ height: '300px', marginBottom: '50px' }}
                                        />
                                    </div>
                                    {errors.content && <div className="invalid-feedback d-block">{errors.content}</div>}
                                    <div className="form-text text-end">
                                        Words: {(formData.pages[activeContentPage] || '').replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(w => w.length > 0).length}
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between mt-4">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setActiveTab('basics')}>
                                        <i className="bi bi-arrow-left ms-1"></i> Back: Basics
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={() => setActiveTab('settings')}>
                                        Next: Settings <i className="bi bi-arrow-right ms-1"></i>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB: SETTINGS */}
                        {activeTab === 'settings' && (
                            <div className="animate__animated animate__fadeIn">
                                <h5 className="mb-4">Adjust visibility and audience settings</h5>

                                {/* Intent & Visibility (Post only) */}
                                <div className="row g-3 mb-4">
                                    {articleTypeParam === 'post' && (
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Intent</label>
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
                                    )}
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Visibility</label>
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

                                {/* Audience (Post Only) */}
                                {articleTypeParam === 'post' && (
                                    <div className="mb-4">
                                        <label className="form-label fw-bold">Target Audience</label>
                                        <div className="d-flex flex-wrap gap-2">
                                            {audienceTypes.map((audience, idx) => {
                                                const val = String(audience.id || audience.Id || audience.value || audience.Value);
                                                const label = audience.name || audience.Name || audience.value || audience.Value;
                                                const isSelected = formData.audienceTypes.includes(val);
                                                return (
                                                    <div key={idx} className="form-check form-check-inline border rounded p-2 m-0 bg-light">
                                                        <input
                                                            className="form-check-input me-2"
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
                                                            id={`audience-${val}`}
                                                        />
                                                        <label className="form-check-label" htmlFor={`audience-${val}`}>{label}</label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="d-flex justify-content-between mt-5 pt-3 border-top">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setActiveTab('content')}>
                                        <i className="bi bi-arrow-left ms-1"></i> Back: Content
                                    </button>
                                    <div className="d-flex gap-2">
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)} disabled={loading}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary px-4" disabled={loading || dataLoading}>
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Publishing...
                                                </>
                                            ) : 'Publish Article'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateArticlePage;
