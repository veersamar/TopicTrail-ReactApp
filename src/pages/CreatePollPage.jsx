import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useOutletContext } from 'react-router-dom';

/**
 * CreatePollPage - Optimized for collecting public opinions and feedback
 * 
 * Key features:
 * - Poll Type selector (Single Choice, Multiple Choice, Rating Scale, Short Answer)
 * - Dynamic option builder based on poll type
 * - Survey Mode for multi-question polls
 * - Settings for participation rules, duration, and results visibility
 * - META panel: Category, Sub-Category, Visibility, Tags (no Intent, no Audience)
 */
function CreatePollPage() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const outletContext = useOutletContext() || {};
    const setIsFocusMode = outletContext.setIsFocusMode;

    // Enable focus mode for writer-focused experience
    useEffect(() => {
        if (setIsFocusMode) {
            setIsFocusMode(true);
        }
        return () => {
            if (setIsFocusMode) {
                setIsFocusMode(false);
            }
        };
    }, [setIsFocusMode]);

    // Refs
    const tagInputRef = useRef(null);
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    // Form state
    const [formState, setFormState] = useState({
        loading: false,
        masterDataLoading: true,
        errors: {},
        successMessage: '',
        articleTypes: [],
        categories: [],
        subCategories: [],
    });

    // Draft state
    const [lastSaved, setLastSaved] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form data - optimized for polls
    const [formData, setFormData] = useState({
        title: '',              // Poll title/question (required)
        description: '',        // Optional description (max 300 chars)
        pollType: '',           // single, multiple, rating, shortAnswer
        categoryId: '',         // Required
        subCategoryId: '',
        articleType: '',        // Will be set to 'poll' type
        visibility: 'Public',
        tags: [],
        // Poll options (for single/multiple choice)
        options: ['', ''],
        allowOther: false,
        // Rating scale settings
        ratingMin: 1,
        ratingMax: 5,
        ratingLowLabel: '',
        ratingHighLabel: '',
        // Short answer settings
        answerType: 'single',   // 'single' or 'multi'
        charLimit: null,
        // Survey mode
        surveyMode: false,
        questions: [],          // Array of { title, pollType, options, ... }
    });

    // Tag input state
    const [tagInput, setTagInput] = useState('');
    const [tagSuggestions, setTagSuggestions] = useState([]);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);

    // Fetch master data on mount
    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            setFormState(prev => ({ ...prev, masterDataLoading: true, errors: {} }));

            const [cats, types] = await Promise.all([
                api.getCategories(),
                api.getMasterDataByType('ArticleType'),
            ]);

            // Find 'poll' article type
            const pollType = types.find(t =>
                (t.name || t.Name || '').toLowerCase() === 'poll'
            );
            const pollTypeId = pollType ? (pollType.id || pollType.Id || pollType.value || pollType.Value) : '';

            setFormState(prev => ({
                ...prev,
                categories: Array.isArray(cats) ? cats : [],
                articleTypes: types,
                masterDataLoading: false,
            }));

            // Auto-set article type to 'poll'
            if (pollTypeId) {
                setFormData(prev => ({ ...prev, articleType: pollTypeId }));
            }

            // Load draft from localStorage (non-blocking)
            const savedDraft = localStorage.getItem('topic_trail_poll_draft');
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    const hasMeaningfulContent = parsed.title || parsed.pollType;
                    
                    if (hasMeaningfulContent) {
                        setTimeout(() => {
                            if (window.confirm("Found a saved poll draft. Would you like to restore it?")) {
                                setFormData(prev => ({ ...prev, ...parsed }));
                            } else {
                                localStorage.removeItem('topic_trail_poll_draft');
                            }
                        }, 100);
                    }
                } catch (e) {
                    console.error("Failed to parse draft", e);
                    localStorage.removeItem('topic_trail_poll_draft');
                }
            }
        } catch (error) {
            console.error('Error loading form data:', error);
            setFormState(prev => ({ ...prev, masterDataLoading: false }));
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

    // Autosave Effect
    useEffect(() => {
        const saveTimer = setTimeout(() => {
            if (formData.title || formData.pollType) {
                setIsSaving(true);
                localStorage.setItem('topic_trail_poll_draft', JSON.stringify(formData));
                setLastSaved(new Date());
                setTimeout(() => setIsSaving(false), 2000);
            }
        }, 30000); // 30 seconds

        return () => clearTimeout(saveTimer);
    }, [formData]);

    const clearDraft = () => {
        localStorage.removeItem('topic_trail_poll_draft');
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));
        if (formState.errors[name]) {
            setFormState(prev => ({ ...prev, errors: { ...prev.errors, [name]: null } }));
        }
    };

    // Poll type change handler
    const handlePollTypeChange = (newType) => {
        setFormData(prev => ({
            ...prev,
            pollType: newType,
            // Reset type-specific options when changing types
            options: newType === 'single' || newType === 'multiple' ? ['', ''] : prev.options,
            allowOther: newType === 'single' || newType === 'multiple' ? false : prev.allowOther,
            ratingMin: newType === 'rating' ? 1 : prev.ratingMin,
            ratingMax: newType === 'rating' ? 5 : prev.ratingMax,
            ratingLowLabel: newType === 'rating' ? '' : prev.ratingLowLabel,
            ratingHighLabel: newType === 'rating' ? '' : prev.ratingHighLabel,
            answerType: newType === 'shortAnswer' ? 'single' : prev.answerType,
            charLimit: newType === 'shortAnswer' ? null : prev.charLimit,
        }));
        if (formState.errors.pollType) {
            setFormState(prev => ({ ...prev, errors: { ...prev.errors, pollType: null } }));
        }
    };

    // Option handlers for choice-based polls
    const handleOptionChange = (index, value) => {
        setFormData(prev => {
            const newOptions = [...prev.options];
            newOptions[index] = value;
            return { ...prev, options: newOptions };
        });
        if (formState.errors.options) {
            setFormState(prev => ({ ...prev, errors: { ...prev.errors, options: null } }));
        }
    };

    const addOption = () => {
        setFormData(prev => ({
            ...prev,
            options: [...prev.options, '']
        }));
    };

    const removeOption = (index) => {
        if (formData.options.length <= 2) return;
        setFormData(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }));
    };

    // Drag and drop for options reordering
    const handleDragStart = (index) => {
        dragItem.current = index;
    };

    const handleDragEnter = (index) => {
        dragOverItem.current = index;
    };

    const handleDragEnd = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        if (dragItem.current === dragOverItem.current) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        }

        const newOptions = [...formData.options];
        const draggedItem = newOptions[dragItem.current];
        newOptions.splice(dragItem.current, 1);
        newOptions.splice(dragOverItem.current, 0, draggedItem);

        setFormData(prev => ({ ...prev, options: newOptions }));
        dragItem.current = null;
        dragOverItem.current = null;
    };

    // Survey mode - question management
    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, {
                id: Date.now(),
                title: '',
                pollType: 'single',
                options: ['', ''],
                allowOther: false,
            }]
        }));
    };

    const updateQuestion = (index, field, value) => {
        setFormData(prev => {
            const newQuestions = [...prev.questions];
            newQuestions[index] = { ...newQuestions[index], [field]: value };
            return { ...prev, questions: newQuestions };
        });
    };

    const removeQuestion = (index) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    const moveQuestion = (fromIndex, toIndex) => {
        if (toIndex < 0 || toIndex >= formData.questions.length) return;
        setFormData(prev => {
            const newQuestions = [...prev.questions];
            const [movedItem] = newQuestions.splice(fromIndex, 1);
            newQuestions.splice(toIndex, 0, movedItem);
            return { ...prev, questions: newQuestions };
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
            newErrors.title = 'Poll title is required';
        } else if (formData.title.length < 10) {
            newErrors.title = 'Poll title must be at least 10 characters';
        }

        if (!formData.categoryId) {
            newErrors.categoryId = 'Category is required before publishing.';
        }

        if (!formData.pollType) {
            newErrors.pollType = 'Poll type is required';
        }

        // Validate options for choice-based polls
        if (formData.pollType === 'single' || formData.pollType === 'multiple') {
            const filledOptions = formData.options.filter(opt => opt.trim());
            if (filledOptions.length < 2) {
                newErrors.options = 'At least 2 options are required';
            }
            // Check for duplicates
            const uniqueOptions = new Set(filledOptions.map(opt => opt.toLowerCase()));
            if (uniqueOptions.size !== filledOptions.length) {
                newErrors.options = 'Duplicate options are not allowed';
            }
        }

        // Validate survey mode questions
        if (formData.surveyMode && formData.questions.length > 0) {
            formData.questions.forEach((q, idx) => {
                if (!q.title?.trim()) {
                    newErrors[`question_${idx}_title`] = `Question ${idx + 1} title is required`;
                }
                // Validate question options
                if ((q.pollType === 'single' || q.pollType === 'multiple') && (!q.options || q.options.filter(opt => opt.trim()).length < 2)) {
                    newErrors[`question_${idx}_options`] = `Question ${idx + 1} requires at least 2 options`;
                }
            });
        }

        if (Object.keys(newErrors).length > 0) {
            console.warn("Validation Failed:", newErrors);
            const errorMsg = Object.entries(newErrors).map(([k, v]) => `${v}`).join('\n');
            alert("Please fix the following:\n" + errorMsg);
            setFormState(prev => ({ ...prev, errors: newErrors }));
            return false;
        }
        return true;
    };

    // Map local poll type to API PollType enum
    // API: 1=SingleChoice, 2=MultipleChoice, 3=RatingScale, 4=ShortAnswer
    const mapPollTypeToEnum = (localType) => {
        const mapping = {
            'single': 1,
            'multiple': 2,
            'rating': 3,
            'shortAnswer': 4,
        };
        return mapping[localType] || 1;
    };

    // Build poll questions for the API
    const buildPollQuestions = () => {
        if (formData.surveyMode && formData.questions.length > 0) {
            // Survey mode: multiple questions
            return formData.questions.map(q => ({
                QuestionText: q.title,
                PollType: mapPollTypeToEnum(q.pollType),
                Options: (q.pollType === 'single' || q.pollType === 'multiple') 
                    ? q.options?.filter(opt => opt.trim()) 
                    : null,
                MinScale: q.pollType === 'rating' ? (q.ratingMin || 1) : null,
                MaxScale: q.pollType === 'rating' ? (q.ratingMax || 5) : null,
            }));
        } else {
            // Single question poll - use main poll data
            const question = {
                QuestionText: formData.title.trim(),
                PollType: mapPollTypeToEnum(formData.pollType),
            };

            if (formData.pollType === 'single' || formData.pollType === 'multiple') {
                question.Options = formData.options.filter(opt => opt.trim());
            } else if (formData.pollType === 'rating') {
                question.MinScale = formData.ratingMin;
                question.MaxScale = formData.ratingMax;
            }
            // ShortAnswer doesn't need additional options

            return [question];
        }
    };

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setFormState(prev => ({ ...prev, loading: true, errors: {} }));

            // Build the poll data matching CreatePollRequest schema
            const pollData = {
                Title: formData.title.trim(),
                Description: formData.description?.trim() || null,
                CategoryId: parseInt(formData.categoryId, 10),
                SubCategoryId: formData.subCategoryId ? parseInt(formData.subCategoryId, 10) : null,
                IsPublic: formData.visibility === 'Public',
                StartDate: null,
                EndDate: null,
                ResultVisibility: 1, // Default: After voting
                OneVotePerUser: true,
                AllowVoteChange: false,
                Questions: buildPollQuestions(),
                Tags: formData.tags.length > 0 ? formData.tags : ['poll'],
            };

            console.log('Submitting poll data:', pollData);

            const result = await api.createPoll(token, pollData);

            if (!result.success) {
                // Handle backend validation errors
                let errorMessage = result.error || 'Failed to publish poll';
                if (result.data?.errors) {
                    const backendErrors = Object.entries(result.data.errors)
                        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                        .join('\n');
                    errorMessage = backendErrors || errorMessage;
                }
                setFormState(prev => ({
                    ...prev,
                    loading: false,
                    errors: { submit: errorMessage }
                }));
                return;
            }

            const pollId = result.pollId;
            console.log('Poll created successfully with ID:', pollId);

            setFormState(prev => ({
                ...prev,
                loading: false,
                successMessage: 'Poll published successfully!',
            }));

            clearDraft();

            // Navigate to the poll page or articles list
            setTimeout(() => {
                if (pollId) {
                    navigate(`/poll/${pollId}`);
                } else {
                    navigate('/articles');
                }
            }, 1500);

        } catch (error) {
            console.error('Submission error:', error);
            setFormState(prev => ({
                ...prev,
                loading: false,
                errors: { submit: 'An unexpected error occurred.' }
            }));
        }
    };

    // Save as draft handler
    const handleSaveDraft = async (e) => {
        e.preventDefault();
        
        // Validate minimum required fields for draft
        if (!formData.title?.trim()) {
            alert('Please enter a poll title to save as draft.');
            return;
        }

        try {
            setFormState(prev => ({ ...prev, loading: true, errors: {} }));

            // Save to localStorage as backup
            setIsSaving(true);
            localStorage.setItem('topic_trail_poll_draft', JSON.stringify(formData));
            setLastSaved(new Date());
            
            setFormState(prev => ({
                ...prev,
                loading: false,
                successMessage: 'Draft saved!',
            }));

            setTimeout(() => {
                setIsSaving(false);
                setFormState(prev => ({ ...prev, successMessage: '' }));
            }, 2000);

        } catch (error) {
            console.error('Save draft error:', error);
            setFormState(prev => ({
                ...prev,
                loading: false,
                errors: { submit: 'Failed to save draft.' }
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

    const { loading, masterDataLoading, errors, successMessage, categories, subCategories } = formState;

    // Check if form is ready to submit
    const canSubmit = formData.title?.trim().length >= 10 && 
                      formData.categoryId && 
                      formData.pollType &&
                      (formData.pollType === 'rating' || formData.pollType === 'shortAnswer' || 
                       (formData.options.filter(opt => opt.trim()).length >= 2));

    if (masterDataLoading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Loading...</p>
            </div>
        );
    }

    return (
        <div className="create-poll-page pb-5">
            {/* Page Header */}
            <div className="d-flex align-items-center mb-4">
                <div className="me-3 p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>📊</span>
                </div>
                <div>
                    <h2 className="mb-1 fw-bold">Create Poll / Survey</h2>
                    <p className="text-muted mb-0">Collect opinions and feedback from the community</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                }
            }}>
                {/* Main Layout: META Panel (Left) + Content Area (Right) */}
                <div className="d-flex gap-4">
                    
                    {/* ========== META PANEL ========== */}
                    <aside 
                        className="meta-panel rounded bg-white shadow-sm" 
                        style={{ 
                            width: '280px', 
                            minWidth: '280px', 
                            maxWidth: '280px',
                            borderLeft: '4px solid #764ba2',
                            border: '1px solid #e9ecef'
                        }}
                    >
                        <div className="p-3 border-bottom" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
                            <h6 className="mb-0 fw-bold text-uppercase small" style={{ color: '#764ba2' }}>
                                <i className="bi bi-sliders me-2"></i>META
                            </h6>
                        </div>
                        <div className="p-3" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                            {/* Category (Required) */}
                            <div className="mb-3">
                                <label className="form-label fw-bold small">
                                    Category <span className="text-danger">*</span>
                                </label>
                                <select
                                    className={`form-select form-select-sm ${errors.categoryId ? 'is-invalid' : ''}`}
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleInputChange}
                                    onBlur={() => {
                                        if (!formData.categoryId) {
                                            setFormState(prev => ({ ...prev, errors: { ...prev.errors, categoryId: 'Category is required before publishing.' } }));
                                        }
                                    }}
                                >
                                    <option value="">Select Category...</option>
                                    {renderSelectOptions(categories)}
                                </select>
                                {errors.categoryId && <div className="invalid-feedback">{errors.categoryId}</div>}
                            </div>

                            {/* Sub-Category */}
                            <div className="mb-3">
                                <label className="form-label small text-muted">Sub-Category</label>
                                <select
                                    className="form-select form-select-sm"
                                    name="subCategoryId"
                                    value={formData.subCategoryId}
                                    onChange={handleInputChange}
                                    disabled={!formData.categoryId || subCategories.length === 0}
                                >
                                    <option value="">Select Sub-Category...</option>
                                    {renderSelectOptions(subCategories)}
                                </select>
                            </div>

                            {/* Visibility */}
                            <div className="mb-3">
                                <label className="form-label small text-muted">Visibility</label>
                                <select
                                    className="form-select form-select-sm"
                                    name="visibility"
                                    value={formData.visibility}
                                    onChange={handleInputChange}
                                >
                                    <option value="Public">Public</option>
                                    <option value="Private">Restricted</option>
                                </select>
                            </div>

                            {/* Tags (Optional) */}
                            <div className="mb-3">
                                <label className="form-label small text-muted d-flex align-items-center">
                                    <span className="fw-medium">Tags</span>
                                    <span className="ms-1 text-secondary" style={{ fontSize: '0.75rem' }}>(Optional)</span>
                                </label>
                                <div 
                                    className="border rounded bg-white p-2"
                                    style={{ minHeight: '36px' }}
                                >
                                    {formData.tags.length > 0 && (
                                        <div 
                                            className="d-flex flex-wrap gap-1 mb-2"
                                            style={{ maxHeight: '52px', overflowY: 'auto', scrollbarWidth: 'thin' }}
                                        >
                                            {formData.tags.map((tag, index) => (
                                                <span 
                                                    key={index} 
                                                    className="badge bg-light text-secondary border d-inline-flex align-items-center"
                                                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                                >
                                                    {tag}
                                                    <button 
                                                        type="button" 
                                                        className="btn-close ms-1" 
                                                        style={{ fontSize: '0.5em' }} 
                                                        onClick={() => removeTag(tag)}
                                                        aria-label={`Remove tag ${tag}`}
                                                    ></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="position-relative">
                                        <input
                                            ref={tagInputRef}
                                            type="text"
                                            className="form-control form-control-sm border-0 shadow-none p-0"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleTagKeyDown}
                                            onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                                            placeholder={formData.tags.length === 0 ? "Add tags..." : ""}
                                            style={{ fontSize: '0.8rem' }}
                                        />
                                        {showTagSuggestions && tagSuggestions.length > 0 && (
                                            <div className="list-group position-absolute w-100 shadow-sm mt-1" style={{ zIndex: 1050, maxHeight: '150px', overflowY: 'auto' }}>
                                                {tagSuggestions.map((suggestion, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        className="list-group-item list-group-item-action py-1 small"
                                                        onClick={() => addTag(typeof suggestion === 'string' ? suggestion : suggestion.name || suggestion.Name)}
                                                    >
                                                        {typeof suggestion === 'string' ? suggestion : suggestion.name || suggestion.Name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Press Enter to add</small>
                            </div>
                        </div>
                    </aside>

                    {/* ========== MAIN CONTENT AREA ========== */}
                    <div className="flex-grow-1">
                        <div className="card shadow-sm border-0">
                            <div className="card-body p-4">
                                {/* Success/Error Messages */}
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

                                {/* ========== POLL CONTENT ========== */}
                                <div>
                                    {/* 1. Title (Required) */}
                                    <div className="mb-4">
                                        <label className="form-label fw-bold">
                                            Title <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control form-control-lg ${errors.title ? 'is-invalid' : ''}`}
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            onBlur={() => {
                                                if (!formData.title?.trim()) {
                                                    setFormState(prev => ({ ...prev, errors: { ...prev.errors, title: 'Poll title is required.' } }));
                                                } else if (formData.title.length < 10) {
                                                    setFormState(prev => ({ ...prev, errors: { ...prev.errors, title: 'Poll title must be at least 10 characters.' } }));
                                                }
                                            }}
                                            placeholder="Ask a clear, neutral question"
                                        />
                                        {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                        <small className="text-muted">
                                            Keep it neutral and specific. This is what respondents will see.
                                        </small>
                                        </div>

                                        {/* 2. Description (Optional) */}
                                        <div className="mb-4">
                                            <label className="form-label fw-medium text-muted">
                                                Description <span className="text-secondary small">(Optional)</span>
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="description"
                                                value={formData.description}
                                                onChange={(e) => {
                                                    if (e.target.value.length <= 300) {
                                                        handleInputChange(e);
                                                    }
                                                }}
                                                placeholder="Add context or clarify the purpose of this poll..."
                                                rows={2}
                                                maxLength={300}
                                            />
                                            <small className="text-muted">
                                                {formData.description.length}/300 characters
                                            </small>
                                        </div>

                                        {/* 3. Poll Type Selector (Required) */}
                                        <div className="mb-4">
                                            <label className="form-label fw-bold">
                                                Poll Type <span className="text-danger">*</span>
                                            </label>
                                            <div className={`border rounded p-3 ${errors.pollType ? 'border-danger' : ''}`}>
                                                <div className="row g-3">
                                                    <div className="col-6">
                                                        <div 
                                                            className={`border rounded p-3 cursor-pointer transition-all ${formData.pollType === 'single' ? 'border-primary bg-primary-subtle shadow-sm' : 'bg-light'}`}
                                                            onClick={() => handlePollTypeChange('single')}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className="form-check mb-0">
                                                                <input
                                                                    type="radio"
                                                                    className="form-check-input"
                                                                    name="pollType"
                                                                    checked={formData.pollType === 'single'}
                                                                    onChange={() => handlePollTypeChange('single')}
                                                                />
                                                                <label className="form-check-label fw-medium">
                                                                    <i className="bi bi-circle me-2"></i>Single Choice
                                                                </label>
                                                            </div>
                                                            <small className="text-muted d-block mt-1 ms-4">Pick one option</small>
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div 
                                                            className={`border rounded p-3 cursor-pointer transition-all ${formData.pollType === 'multiple' ? 'border-primary bg-primary-subtle shadow-sm' : 'bg-light'}`}
                                                            onClick={() => handlePollTypeChange('multiple')}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className="form-check mb-0">
                                                                <input
                                                                    type="radio"
                                                                    className="form-check-input"
                                                                    name="pollType"
                                                                    checked={formData.pollType === 'multiple'}
                                                                    onChange={() => handlePollTypeChange('multiple')}
                                                                />
                                                                <label className="form-check-label fw-medium">
                                                                    <i className="bi bi-check2-square me-2"></i>Multiple Choice
                                                                </label>
                                                            </div>
                                                            <small className="text-muted d-block mt-1 ms-4">Select multiple options</small>
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div 
                                                            className={`border rounded p-3 cursor-pointer transition-all ${formData.pollType === 'rating' ? 'border-primary bg-primary-subtle shadow-sm' : 'bg-light'}`}
                                                            onClick={() => handlePollTypeChange('rating')}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className="form-check mb-0">
                                                                <input
                                                                    type="radio"
                                                                    className="form-check-input"
                                                                    name="pollType"
                                                                    checked={formData.pollType === 'rating'}
                                                                    onChange={() => handlePollTypeChange('rating')}
                                                                />
                                                                <label className="form-check-label fw-medium">
                                                                    <i className="bi bi-star me-2"></i>Rating Scale
                                                                </label>
                                                            </div>
                                                            <small className="text-muted d-block mt-1 ms-4">1-5 or 1-10 scale</small>
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div 
                                                            className={`border rounded p-3 cursor-pointer transition-all ${formData.pollType === 'shortAnswer' ? 'border-primary bg-primary-subtle shadow-sm' : 'bg-light'}`}
                                                            onClick={() => handlePollTypeChange('shortAnswer')}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className="form-check mb-0">
                                                                <input
                                                                    type="radio"
                                                                    className="form-check-input"
                                                                    name="pollType"
                                                                    checked={formData.pollType === 'shortAnswer'}
                                                                    onChange={() => handlePollTypeChange('shortAnswer')}
                                                                />
                                                                <label className="form-check-label fw-medium">
                                                                    <i className="bi bi-chat-left-text me-2"></i>Short Answer
                                                                </label>
                                                            </div>
                                                            <small className="text-muted d-block mt-1 ms-4">Free-form text response</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {errors.pollType && <div className="text-danger small mt-1">{errors.pollType}</div>}
                                        </div>

                                        {/* 4. Poll Builder (Dynamic Based on Poll Type) */}
                                        {formData.pollType && (
                                            <div className="mb-4">
                                                <label className="form-label fw-bold">
                                                    <i className="bi bi-tools me-2"></i>Poll Options
                                                </label>
                                                
                                                {/* A. Single / Multiple Choice Options */}
                                                {(formData.pollType === 'single' || formData.pollType === 'multiple') && (
                                                    <div className="border rounded p-3 bg-light">
                                                        {errors.options && (
                                                            <div className="alert alert-danger py-2 mb-3">{errors.options}</div>
                                                        )}
                                                        
                                                        {formData.options.map((option, index) => (
                                                            <div 
                                                                key={index} 
                                                                className="d-flex align-items-center gap-2 mb-2"
                                                                draggable
                                                                onDragStart={() => handleDragStart(index)}
                                                                onDragEnter={() => handleDragEnter(index)}
                                                                onDragEnd={handleDragEnd}
                                                                onDragOver={(e) => e.preventDefault()}
                                                            >
                                                                <i 
                                                                    className="bi bi-grip-vertical text-muted" 
                                                                    style={{ cursor: 'grab' }}
                                                                    title="Drag to reorder"
                                                                ></i>
                                                                <span className="badge bg-secondary">{index + 1}</span>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={option}
                                                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                                                    placeholder={`Option ${index + 1}`}
                                                                />
                                                                {formData.options.length > 2 && (
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-danger btn-sm"
                                                                        onClick={() => removeOption(index)}
                                                                        title="Remove option"
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        
                                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-primary btn-sm"
                                                                onClick={addOption}
                                                            >
                                                                <i className="bi bi-plus-lg me-1"></i>Add Option
                                                            </button>
                                                            
                                                            <div className="form-check mb-0">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    id="allowOther"
                                                                    name="allowOther"
                                                                    checked={formData.allowOther}
                                                                    onChange={handleInputChange}
                                                                />
                                                                <label className="form-check-label small" htmlFor="allowOther">
                                                                    Allow "Other" option
                                                                </label>
                                                            </div>
                                                        </div>
                                                        
                                                        <small className="text-muted d-block mt-2">
                                                            <i className="bi bi-info-circle me-1"></i>
                                                            Drag options to reorder. Minimum 2 options required.
                                                        </small>
                                                    </div>
                                                )}

                                                {/* B. Rating Scale */}
                                                {formData.pollType === 'rating' && (
                                                    <div className="border rounded p-3 bg-light">
                                                        <div className="row g-3">
                                                            <div className="col-md-6">
                                                                <label className="form-label small">Scale Range</label>
                                                                <div className="d-flex gap-2 align-items-center">
                                                                    <select
                                                                        className="form-select form-select-sm"
                                                                        value={formData.ratingMin}
                                                                        onChange={(e) => setFormData(prev => ({ ...prev, ratingMin: parseInt(e.target.value) }))}
                                                                        style={{ width: '80px' }}
                                                                    >
                                                                        <option value={1}>1</option>
                                                                        <option value={0}>0</option>
                                                                    </select>
                                                                    <span className="text-muted">to</span>
                                                                    <select
                                                                        className="form-select form-select-sm"
                                                                        value={formData.ratingMax}
                                                                        onChange={(e) => setFormData(prev => ({ ...prev, ratingMax: parseInt(e.target.value) }))}
                                                                        style={{ width: '80px' }}
                                                                    >
                                                                        <option value={5}>5</option>
                                                                        <option value={10}>10</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="row g-3 mt-2">
                                                            <div className="col-md-6">
                                                                <label className="form-label small">Low Label (Optional)</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm"
                                                                    name="ratingLowLabel"
                                                                    value={formData.ratingLowLabel}
                                                                    onChange={handleInputChange}
                                                                    placeholder="e.g., Poor, Not Likely"
                                                                />
                                                            </div>
                                                            <div className="col-md-6">
                                                                <label className="form-label small">High Label (Optional)</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm"
                                                                    name="ratingHighLabel"
                                                                    value={formData.ratingHighLabel}
                                                                    onChange={handleInputChange}
                                                                    placeholder="e.g., Excellent, Very Likely"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Preview */}
                                                        <div className="mt-3 p-3 bg-white rounded border">
                                                            <small className="text-muted d-block mb-2">Preview:</small>
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <span className="small text-muted">{formData.ratingLowLabel || 'Low'}</span>
                                                                <div className="d-flex gap-2">
                                                                    {Array.from({ length: formData.ratingMax - formData.ratingMin + 1 }, (_, i) => (
                                                                        <span 
                                                                            key={i} 
                                                                            className="btn btn-outline-secondary btn-sm"
                                                                            style={{ width: '36px' }}
                                                                        >
                                                                            {formData.ratingMin + i}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <span className="small text-muted">{formData.ratingHighLabel || 'High'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* C. Short Answer */}
                                                {formData.pollType === 'shortAnswer' && (
                                                    <div className="border rounded p-3 bg-light">
                                                        <div className="row g-3">
                                                            <div className="col-md-6">
                                                                <label className="form-label small">Answer Type</label>
                                                                <select
                                                                    className="form-select form-select-sm"
                                                                    name="answerType"
                                                                    value={formData.answerType}
                                                                    onChange={handleInputChange}
                                                                >
                                                                    <option value="single">Single-line</option>
                                                                    <option value="multi">Multi-line</option>
                                                                </select>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <label className="form-label small">Character Limit (Optional)</label>
                                                                <input
                                                                    type="number"
                                                                    className="form-control form-control-sm"
                                                                    name="charLimit"
                                                                    value={formData.charLimit || ''}
                                                                    onChange={(e) => setFormData(prev => ({ 
                                                                        ...prev, 
                                                                        charLimit: e.target.value ? parseInt(e.target.value) : null 
                                                                    }))}
                                                                    placeholder="No limit"
                                                                    min={1}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Preview */}
                                                        <div className="mt-3 p-3 bg-white rounded border">
                                                            <small className="text-muted d-block mb-2">Preview:</small>
                                                            {formData.answerType === 'single' ? (
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="Respondent's answer..."
                                                                    disabled
                                                                />
                                                            ) : (
                                                                <textarea
                                                                    className="form-control"
                                                                    rows={3}
                                                                    placeholder="Respondent's answer..."
                                                                    disabled
                                                                />
                                                            )}
                                                            {formData.charLimit && (
                                                                <small className="text-muted">Max {formData.charLimit} characters</small>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 5. Survey Mode (Advanced) */}
                                        <div className="mb-4">
                                            <div className="border rounded p-3 bg-light">
                                                <div className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id="surveyMode"
                                                        name="surveyMode"
                                                        checked={formData.surveyMode}
                                                        onChange={(e) => {
                                                            handleInputChange(e);
                                                            if (e.target.checked && formData.questions.length === 0) {
                                                                addQuestion();
                                                            }
                                                        }}
                                                    />
                                                    <label className="form-check-label fw-medium" htmlFor="surveyMode">
                                                        <i className="bi bi-list-check me-2"></i>
                                                        Enable Survey Mode
                                                        <span className="badge bg-secondary ms-2">Advanced</span>
                                                    </label>
                                                    <small className="text-muted d-block mt-1">
                                                        Add multiple questions to create a survey
                                                    </small>
                                                </div>

                                                {/* Survey Questions */}
                                                {formData.surveyMode && (
                                                    <div className="mt-3 pt-3 border-top">
                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                            <label className="form-label fw-medium mb-0">Survey Questions</label>
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-primary btn-sm"
                                                                onClick={addQuestion}
                                                            >
                                                                <i className="bi bi-plus-lg me-1"></i>Add Question
                                                            </button>
                                                        </div>

                                                        {formData.questions.map((question, qIndex) => (
                                                            <div key={question.id} className="card mb-3 border">
                                                                <div className="card-header bg-white d-flex justify-content-between align-items-center py-2">
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-link text-muted p-0"
                                                                            onClick={() => moveQuestion(qIndex, qIndex - 1)}
                                                                            disabled={qIndex === 0}
                                                                        >
                                                                            <i className="bi bi-arrow-up"></i>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-link text-muted p-0"
                                                                            onClick={() => moveQuestion(qIndex, qIndex + 1)}
                                                                            disabled={qIndex === formData.questions.length - 1}
                                                                        >
                                                                            <i className="bi bi-arrow-down"></i>
                                                                        </button>
                                                                        <span className="fw-medium">Question {qIndex + 1}</span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline-danger border-0"
                                                                        onClick={() => removeQuestion(qIndex)}
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                </div>
                                                                <div className="card-body">
                                                                    <div className="mb-3">
                                                                        <input
                                                                            type="text"
                                                                            className={`form-control ${errors[`question_${qIndex}_title`] ? 'is-invalid' : ''}`}
                                                                            value={question.title}
                                                                            onChange={(e) => updateQuestion(qIndex, 'title', e.target.value)}
                                                                            placeholder="Enter question..."
                                                                        />
                                                                        {errors[`question_${qIndex}_title`] && (
                                                                            <div className="invalid-feedback">{errors[`question_${qIndex}_title`]}</div>
                                                                        )}
                                                                    </div>
                                                                    <div className="row g-2">
                                                                        <div className="col-md-4">
                                                                            <select
                                                                                className="form-select form-select-sm"
                                                                                value={question.pollType}
                                                                                onChange={(e) => {
                                                                                    updateQuestion(qIndex, 'pollType', e.target.value);
                                                                                    if (e.target.value === 'single' || e.target.value === 'multiple') {
                                                                                        updateQuestion(qIndex, 'options', question.options?.length >= 2 ? question.options : ['', '']);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <option value="single">Single Choice</option>
                                                                                <option value="multiple">Multiple Choice</option>
                                                                                <option value="rating">Rating Scale</option>
                                                                                <option value="shortAnswer">Short Answer</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Options for choice questions */}
                                                                    {(question.pollType === 'single' || question.pollType === 'multiple') && (
                                                                        <div className="mt-3">
                                                                            {(question.options || ['', '']).map((opt, optIndex) => (
                                                                                <div key={optIndex} className="d-flex gap-2 mb-2">
                                                                                    <input
                                                                                        type="text"
                                                                                        className="form-control form-control-sm"
                                                                                        value={opt}
                                                                                        onChange={(e) => {
                                                                                            const newOptions = [...(question.options || ['', ''])];
                                                                                            newOptions[optIndex] = e.target.value;
                                                                                            updateQuestion(qIndex, 'options', newOptions);
                                                                                        }}
                                                                                        placeholder={`Option ${optIndex + 1}`}
                                                                                    />
                                                                                    {(question.options || []).length > 2 && (
                                                                                        <button
                                                                                            type="button"
                                                                                            className="btn btn-sm btn-outline-danger"
                                                                                            onClick={() => {
                                                                                                const newOptions = (question.options || []).filter((_, i) => i !== optIndex);
                                                                                                updateQuestion(qIndex, 'options', newOptions);
                                                                                            }}
                                                                                        >
                                                                                            <i className="bi bi-x"></i>
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-outline-secondary mt-1"
                                                                                onClick={() => {
                                                                                    const newOptions = [...(question.options || ['', '']), ''];
                                                                                    updateQuestion(qIndex, 'options', newOptions);
                                                                                }}
                                                                            >
                                                                                <i className="bi bi-plus me-1"></i>Add Option
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {formData.questions.length === 0 && (
                                                            <div className="text-center text-muted py-3">
                                                                <i className="bi bi-list-ul fs-3 d-block mb-2"></i>
                                                                No questions added yet. Click "Add Question" to start.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                            </div>

                            {/* ========== STICKY BOTTOM ACTION BAR ========== */}
                            <div className="card-footer bg-white border-top sticky-bottom py-3 px-4 shadow-sm rounded-bottom" style={{ bottom: 0, zIndex: 100 }}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center text-muted small">
                                        {isSaving ? (
                                            <span><span className="spinner-border spinner-border-sm me-1"></span>Saving draft...</span>
                                        ) : (
                                            lastSaved && <span><i className="bi bi-cloud-check me-1"></i> Saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        )}
                                    </div>
                                    <div className="d-flex gap-2">
                                        {/* Save Draft Button */}
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary px-3"
                                            onClick={handleSaveDraft}
                                            disabled={loading}
                                        >
                                            <i className="bi bi-save me-1"></i> Save Draft
                                        </button>

                                        {/* Cancel Button */}
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary px-3"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (window.confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
                                                    navigate(-1);
                                                }
                                            }}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>

                                        {/* Publish Poll Button */}
                                        <button
                                            type="submit"
                                            className="btn btn-success px-4"
                                            disabled={loading || !canSubmit}
                                            title={!canSubmit ? 'Please fill in required fields (Title, Category, Poll Type, Options)' : ''}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Publishing...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-send me-1"></i>
                                                    Publish Poll
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default CreatePollPage;
