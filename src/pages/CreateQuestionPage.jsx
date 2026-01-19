import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useOutletContext } from 'react-router-dom';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import ImageResize from '@looop/quill-image-resize-module-react';

// Register the image resize module (if not already registered)
try {
    Quill.register('modules/imageResize', ImageResize);
} catch (e) {
    // Already registered
}

// Define Custom File Blot for inline file embeds
const BlockEmbed = Quill.import('blots/block/embed');

// Helper to format file size
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper to get file icon
const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const icons = {
        pdf: 'bi-file-earmark-pdf text-danger',
        doc: 'bi-file-earmark-word text-primary',
        docx: 'bi-file-earmark-word text-primary',
        xls: 'bi-file-earmark-excel text-success',
        xlsx: 'bi-file-earmark-excel text-success',
        png: 'bi-file-earmark-image text-info',
        jpg: 'bi-file-earmark-image text-info',
        jpeg: 'bi-file-earmark-image text-info',
        gif: 'bi-file-earmark-image text-info',
    };
    return icons[ext] || 'bi-file-earmark text-secondary';
};

// Check if FileBlot is already registered
try {
    class FileBlot extends BlockEmbed {
        static create(value) {
            const node = super.create();
            node.setAttribute('contenteditable', 'false');
            node.setAttribute('data-url', value.url);
            node.setAttribute('data-name', value.name);
            node.setAttribute('data-size', value.size);
            node.setAttribute('data-type', value.type);

            const card = document.createElement('div');
            card.className = 'file-card d-inline-flex align-items-center p-2 border rounded bg-light my-2';
            card.style.maxWidth = '100%';
            card.style.cursor = 'pointer';

            const icon = document.createElement('i');
            const iconClass = getFileIcon(value.name);
            icon.className = `bi ${iconClass} fs-4 me-3`;

            const info = document.createElement('div');
            info.className = 'flex-grow-1 overflow-hidden';

            const nameEl = document.createElement('div');
            nameEl.className = 'fw-bold text-truncate';
            nameEl.innerText = value.name;

            const sizeEl = document.createElement('div');
            sizeEl.className = 'text-muted small';
            sizeEl.innerText = formatFileSize(value.size || 0);

            info.appendChild(nameEl);
            info.appendChild(sizeEl);

            const action = document.createElement('i');
            action.className = 'bi bi-download ms-3 text-primary';

            card.appendChild(icon);
            card.appendChild(info);
            card.appendChild(action);

            card.onclick = (e) => {
                e.preventDefault();
                window.open(value.url, '_blank');
            };

            node.appendChild(card);
            return node;
        }

        static value(node) {
            return {
                url: node.getAttribute('data-url'),
                name: node.getAttribute('data-name'),
                size: parseInt(node.getAttribute('data-size')),
                type: node.getAttribute('data-type')
            };
        }
    }
    FileBlot.blotName = 'file-card';
    FileBlot.tagName = 'div';
    FileBlot.className = 'ql-file-card-embed';
    Quill.register(FileBlot);
} catch (e) {
    // Already registered
}

/**
 * CreateQuestionPage - Optimized for Q&A, not article publishing
 * 
 * Key differences from CreateArticlePage:
 * - No Intent field in META
 * - No Audience in META (only in Settings, optional)
 * - Question title is primary (not article title)
 * - Details editor is optional and collapsed by default
 * - Content Pages hidden by default (advanced feature)
 * - "Post Question" instead of "Publish Article"
 */
function CreateQuestionPage() {
    const { token, userId } = useAuth();
    const navigate = useNavigate();
    const outletContext = useOutletContext() || {};

    // Enable focus mode for writer-focused experience
    useEffect(() => {
        if (outletContext.setIsFocusMode) {
            outletContext.setIsFocusMode(true);
        }
        return () => {
            if (outletContext.setIsFocusMode) {
                outletContext.setIsFocusMode(false);
            }
        };
    }, [outletContext.setIsFocusMode]);

    // Refs
    const tagInputRef = useRef(null);
    const quillRef = useRef(null);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const inlineFileInputRef = useRef(null);

    // Form state
    const [formState, setFormState] = useState({
        loading: false,
        masterDataLoading: true,
        errors: {},
        successMessage: '',
        articleTypes: [],
        categories: [],
        subCategories: [],
        audienceTypes: [],
    });

    // Tabs: Content and Settings
    const [activeTab, setActiveTab] = useState('content');

    // Optional details toggle (collapsed by default)
    const [showDetails, setShowDetails] = useState(false);

    // Advanced: Multi-page support (hidden by default)
    const [showAdvancedPages, setShowAdvancedPages] = useState(false);
    const [activeContentPage, setActiveContentPage] = useState(0);

    // Attachments state
    const [pendingAttachments, setPendingAttachments] = useState([]);
    const [uploadedAttachments, setUploadedAttachments] = useState([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const [uploadedArticleId, setUploadedArticleId] = useState(null);
    const [isDraggingAttachment, setIsDraggingAttachment] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form data - optimized for questions
    const [formData, setFormData] = useState({
        title: '',           // Question title (required)
        pages: [{ title: 'Details', content: '' }], // Optional details
        categoryId: '',      // Required
        subCategoryId: '',
        articleType: '',     // Will be set to 'question' type
        audienceTypes: [],   // Optional, informational only
        visibility: 'Public',
        tags: [],
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

            const [cats, types, audiences] = await Promise.all([
                api.getCategories(),
                api.getMasterDataByType('ArticleType'),
                api.getMasterDataByType('AudienceType'),
            ]);

            // Find 'question' article type
            const questionType = types.find(t =>
                (t.name || t.Name || '').toLowerCase() === 'question'
            );
            const questionTypeId = questionType ? (questionType.id || questionType.Id || questionType.value || questionType.Value) : '';

            setFormState(prev => ({
                ...prev,
                categories: Array.isArray(cats) ? cats : [],
                articleTypes: types,
                audienceTypes: audiences,
                masterDataLoading: false,
            }));

            // Load draft from localStorage (non-blocking)
            const savedDraft = localStorage.getItem('topic_trail_question_draft');
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    // Check if draft has meaningful content
                    const hasMeaningfulContent = parsed.title || 
                        (parsed.pages && parsed.pages[0]?.content && parsed.pages[0].content.replace(/<[^>]*>/g, '').trim());
                    
                    if (hasMeaningfulContent) {
                        // Use setTimeout to make the confirm non-blocking
                        setTimeout(() => {
                            if (window.confirm("Found a saved question draft. Would you like to restore it?")) {
                                // Restore draft but always use the correct articleType from master data
                                setFormData(prev => ({ 
                                    ...prev, 
                                    ...parsed,
                                    articleType: questionTypeId || prev.articleType // Always use correct Question type ID
                                }));
                                if (parsed.pages?.[0]?.content) {
                                    setShowDetails(true);
                                }
                            } else {
                                localStorage.removeItem('topic_trail_question_draft');
                            }
                        }, 100);
                    }
                } catch (e) {
                    console.error("Failed to parse draft", e);
                    localStorage.removeItem('topic_trail_question_draft');
                }
            }

            // Always set article type to 'question' (after draft restore check to ensure correct value)
            if (questionTypeId) {
                setFormData(prev => ({ ...prev, articleType: questionTypeId }));
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
            if (formData.title || formData.pages[0]?.content) {
                setIsSaving(true);
                localStorage.setItem('topic_trail_question_draft', JSON.stringify(formData));
                setLastSaved(new Date());
                setTimeout(() => setIsSaving(false), 2000);
            }
        }, 30000); // 30 seconds

        return () => clearTimeout(saveTimer);
    }, [formData]);

    const clearDraft = () => {
        localStorage.removeItem('topic_trail_question_draft');
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formState.errors[name]) {
            setFormState(prev => ({ ...prev, errors: { ...prev.errors, [name]: null } }));
        }
    };

    // Handle details content change
    const handleDetailsChange = (value) => {
        setFormData(prev => {
            const newPages = [...prev.pages];
            newPages[activeContentPage] = { ...newPages[activeContentPage], content: value };
            return { ...prev, pages: newPages };
        });

        if (formState.errors.content) {
            setFormState(prev => ({ ...prev, errors: { ...prev.errors, content: null } }));
        }
    };

    // Advanced: Page management (for multi-page questions)
    const addPage = () => {
        setFormData(prev => {
            const nextPageNum = prev.pages.length + 1;
            const newPages = [...prev.pages, { title: `Page ${nextPageNum}`, content: '' }];
            setActiveContentPage(newPages.length - 1);
            return { ...prev, pages: newPages };
        });
        setShowAdvancedPages(true);
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

    // Image upload handler
    const handleImageUpload = useCallback(async () => {
        if (imageInputRef.current) {
            imageInputRef.current.click();
        }
    }, []);

    const handleImageFileSelected = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (PNG, JPG, GIF)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        const articleId = uploadedArticleId;
        if (!articleId) {
            alert('Please save your question first before adding inline images.');
            e.target.value = '';
            return;
        }

        try {
            setUploadingImage(true);
            const result = await api.uploadArticleMedia(token, articleId, file);

            if (result.success && result.url) {
                const quill = quillRef.current?.getEditor?.() || quillRef.current?.editor;
                if (quill) {
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', result.url);
                    quill.setSelection(range.index + 1);
                }
            } else {
                alert('Failed to upload image: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Image upload error:', error);
            alert('Failed to upload image');
        } finally {
            setUploadingImage(false);
            e.target.value = '';
        }
    }, [token, uploadedArticleId]);

    // Inline file handlers
    const handleInsertFile = useCallback(() => {
        inlineFileInputRef.current?.click();
    }, []);

    const handleInlineFileSelected = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        const articleId = uploadedArticleId;
        if (!articleId) {
            alert('Please save your question first before adding inline files.');
            return;
        }

        try {
            setUploadingAttachment(true);
            const response = await api.uploadArticleAttachment(token, articleId, file);
            if (response.success && (response.downloadUrl || response.url)) {
                const quillEditor = quillRef.current?.getEditor?.() || quillRef.current?.editor;
                if (quillEditor) {
                    const range = quillEditor.getSelection(true);
                    const fileUrl = response.downloadUrl || response.url;
                    quillEditor.insertEmbed(range ? range.index : 0, 'file-card', {
                        url: fileUrl,
                        name: file.name,
                        size: file.size,
                        type: file.type
                    });
                    if (range) quillEditor.setSelection(range.index + 1);
                }
            } else {
                alert('Failed to upload file: ' + (response.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('File upload error:', error);
            alert('Error uploading file');
        } finally {
            setUploadingAttachment(false);
        }
    }, [token, uploadedArticleId]);

    // Attachment file handlers
    const handleAttachmentFileSelect = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, []);

    const processFiles = useCallback((files) => {
        if (files.length === 0) return;

        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/png', 'image/jpeg', 'image/gif'
        ];

        const validFiles = files.filter(file => {
            if (!allowedTypes.includes(file.type)) {
                const ext = file.name.split('.').pop().toLowerCase();
                const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif'];
                if (allowedExts.includes(ext)) return true;
                return false;
            }
            if (file.size > 10 * 1024 * 1024) {
                return false;
            }
            return true;
        });

        if (validFiles.length < files.length) {
            alert('Some files were skipped. Allowed types: PDF, Word, Excel, Images. Max size: 10MB.');
        }

        setPendingAttachments(prev => [...prev, ...validFiles]);
    }, []);

    const handleAttachmentFilesSelected = useCallback((e) => {
        const files = Array.from(e.target.files || []);
        processFiles(files);
        if (e.target) e.target.value = '';
    }, [processFiles]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingAttachment(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingAttachment(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingAttachment(false);
        const files = Array.from(e.dataTransfer.files || []);
        processFiles(files);
    }, [processFiles]);

    const removePendingAttachment = useCallback((index) => {
        setPendingAttachments(prev => prev.filter((_, i) => i !== index));
    }, []);

    const removeUploadedAttachment = useCallback(async (attachmentId) => {
        if (!window.confirm('Remove this attachment?')) return;

        const articleId = uploadedArticleId;
        if (!articleId) return;

        try {
            const result = await api.deleteArticleAttachment(token, articleId, attachmentId);
            if (result.success) {
                setUploadedAttachments(prev => prev.filter(a => a.id !== attachmentId));
            } else {
                alert('Failed to remove attachment: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error removing attachment:', error);
            alert('Failed to remove attachment');
        }
    }, [token, uploadedArticleId]);

    // Validation
    const validateForm = () => {
        const newErrors = {};

        if (!formData.title?.trim()) {
            newErrors.title = 'Question is required';
            setActiveTab('content');
        } else if (formData.title.length < 10) {
            newErrors.title = 'Question must be at least 10 characters';
            setActiveTab('content');
        }

        if (!formData.categoryId) {
            newErrors.categoryId = 'Category is required before posting.';
        }

        if (!formData.articleType) {
            newErrors.articleType = 'Article Type is missing';
        }

        if (Object.keys(newErrors).length > 0) {
            console.warn("Validation Failed:", newErrors);
            const errorMsg = Object.entries(newErrors).map(([k, v]) => `${k}: ${v}`).join('\n');
            alert("Please fix the following:\n" + errorMsg);
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

            // Combine details content (if any)
            const detailsContent = showDetails ? formData.pages.map(p => p.content).join('<!-- PAGE_BREAK -->') : '';

            // Get the correct Question type ID from master data (fallback to formData.articleType)
            const questionType = formState.articleTypes.find(t =>
                (t.name || t.Name || '').toLowerCase() === 'question'
            );
            const questionTypeId = questionType ? (questionType.id || questionType.Id || questionType.value || questionType.Value) : formData.articleType;

            const articleData = {
                Title: formData.title.trim(),
                Description: null, // Questions don't have descriptions
                Content: detailsContent || '<p></p>', // Minimal content if no details
                CategoryId: parseInt(formData.categoryId, 10),
                SubCategoryId: formData.subCategoryId ? parseInt(formData.subCategoryId, 10) : null,
                ArticleType: parseInt(questionTypeId, 10), // Always use Question type from master data
                IntentType: null, // Questions don't have intent
                AudienceTypes: formData.audienceTypes.length > 0 ? formData.audienceTypes.map(id => parseInt(id, 10)) : null,
                Tags: formData.tags.length > 0 ? formData.tags : ['question'],
                Visibility: formData.visibility,
            };

            console.log('Submitting question data:', articleData);
            console.log('Question Type ID from master data:', questionTypeId, 'formData.articleType:', formData.articleType);

            const result = await api.createArticle(token, userId, articleData);
            const articleId = result.id || result.articleId;

            if (!result.success) {
                setFormState(prev => ({
                    ...prev,
                    loading: false,
                    errors: { submit: result.error || 'Failed to post question' }
                }));
                return;
            }

            // Upload pending attachments
            if (pendingAttachments.length > 0 && articleId) {
                setUploadingAttachment(true);
                for (const file of pendingAttachments) {
                    const uploadResult = await api.uploadArticleAttachment(token, articleId, file);
                    if (!uploadResult.success) {
                        console.error('Failed to upload attachment:', file.name, uploadResult.error);
                    }
                }
                setUploadingAttachment(false);
            }

            setFormState(prev => ({
                ...prev,
                loading: false,
                successMessage: 'Question posted successfully!',
            }));

            clearDraft();

            setTimeout(() => {
                navigate('/questions');
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

    // Quill modules configuration
    const quillModules = useMemo(() => ({
        toolbar: {
            container: "#question-toolbar",
            handlers: {
                image: handleImageUpload,
                insertFile: handleInsertFile
            }
        },
        imageResize: {
            parchment: Quill.import('parchment'),
            modules: ['Resize', 'DisplaySize']
        }
    }), [handleImageUpload, handleInsertFile]);

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

    const { loading, masterDataLoading, errors, successMessage, categories, subCategories, audienceTypes } = formState;

    // Check if form is ready to submit
    const canSubmit = formData.title?.trim().length >= 10 && formData.categoryId && formData.articleType;

    if (masterDataLoading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Loading...</p>
            </div>
        );
    }

    return (
        <div className="create-question-page pb-5">
            {/* Page Header */}
            <div className="d-flex align-items-center mb-4">
                <div className="me-3 p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                    <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>❓</span>
                </div>
                <div>
                    <h2 className="mb-1 fw-bold">Ask a Question</h2>
                    <p className="text-muted mb-0">Get answers from the community</p>
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
                            borderLeft: '4px solid #f5576c',
                            border: '1px solid #e9ecef'
                        }}
                    >
                        <div className="p-3 border-bottom" style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #ffe9ec 100%)' }}>
                            <h6 className="mb-0 fw-bold text-uppercase small" style={{ color: '#f5576c' }}>
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
                                            setFormState(prev => ({ ...prev, errors: { ...prev.errors, categoryId: 'Category is required before posting.' } }));
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
                            {/* Tab Headers */}
                            <div className="card-header bg-white border-bottom-0 pt-4 px-4 pb-0">
                                <ul className="nav nav-tabs card-header-tabs">
                                    <li className="nav-item">
                                        <button
                                            type="button"
                                            className={`nav-link ${activeTab === 'content' ? 'active fw-bold' : ''}`}
                                            onClick={() => setActiveTab('content')}
                                        >
                                            <i className="bi bi-pencil-square me-2"></i>Content
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            type="button"
                                            className={`nav-link ${activeTab === 'settings' ? 'active fw-bold' : ''}`}
                                            onClick={() => setActiveTab('settings')}
                                        >
                                            <i className="bi bi-gear me-2"></i>Settings
                                        </button>
                                    </li>
                                </ul>
                            </div>

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

                                {/* ========== CONTENT TAB ========== */}
                                {activeTab === 'content' && (
                                    <div className="animate__animated animate__fadeIn">
                                        {/* Question Title (Required) */}
                                        <div className="mb-4">
                                            <label className="form-label fw-bold">
                                                Question <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control form-control-lg ${errors.title ? 'is-invalid' : ''}`}
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                onBlur={() => {
                                                    if (!formData.title?.trim()) {
                                                        setFormState(prev => ({ ...prev, errors: { ...prev.errors, title: 'Question is required.' } }));
                                                    } else if (formData.title.length < 10) {
                                                        setFormState(prev => ({ ...prev, errors: { ...prev.errors, title: 'Question must be at least 10 characters.' } }));
                                                    }
                                                }}
                                                placeholder="What would you like to ask?"
                                            />
                                            {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                            <small className="text-muted">
                                                Be specific and include key details someone would need to answer.
                                            </small>
                                        </div>

                                        {/* Optional Details Toggle */}
                                        <div className="mb-4">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="showDetailsToggle"
                                                    checked={showDetails}
                                                    onChange={(e) => setShowDetails(e.target.checked)}
                                                />
                                                <label className="form-check-label text-muted" htmlFor="showDetailsToggle">
                                                    <i className="bi bi-text-paragraph me-1"></i>
                                                    Add more details (optional)
                                                </label>
                                            </div>
                                        </div>

                                        {/* Details Editor (Collapsible) */}
                                        {showDetails && (
                                            <div className="mb-4 animate__animated animate__fadeIn">
                                                <label className="form-label fw-medium text-muted">
                                                    Details <span className="text-secondary small">(Optional)</span>
                                                </label>

                                                {/* Advanced: Multi-page navigation (hidden by default) */}
                                                {showAdvancedPages && formData.pages.length > 1 && (
                                                    <div className="mb-2">
                                                        <small className="text-muted me-2">Pages:</small>
                                                        {formData.pages.map((page, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                className={`btn btn-sm me-1 ${activeContentPage === idx ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                                onClick={() => setActiveContentPage(idx)}
                                                            >
                                                                {idx + 1}
                                                                {formData.pages.length > 1 && (
                                                                    <i 
                                                                        className="bi bi-x ms-1" 
                                                                        onClick={(e) => { e.stopPropagation(); removePage(idx); }}
                                                                    ></i>
                                                                )}
                                                            </button>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-success"
                                                            onClick={addPage}
                                                        >
                                                            <i className="bi bi-plus"></i>
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="quill-wrapper" style={{ background: '#fff' }}>
                                                    {/* Compact Toolbar */}
                                                    <div id="question-toolbar" className="border-bottom">
                                                        <span className="ql-formats">
                                                            <button type="button" className="ql-bold"></button>
                                                            <button type="button" className="ql-italic"></button>
                                                            <button type="button" className="ql-underline"></button>
                                                        </span>
                                                        <span className="ql-formats">
                                                            <button type="button" className="ql-list" value="ordered"></button>
                                                            <button type="button" className="ql-list" value="bullet"></button>
                                                        </span>
                                                        <span className="ql-formats">
                                                            <button type="button" className="ql-code-block"></button>
                                                            <button type="button" className="ql-link"></button>
                                                            <button type="button" className="ql-image"></button>
                                                            <button className="ql-insertFile" type="button">
                                                                <i className="bi bi-paperclip"></i>
                                                            </button>
                                                        </span>
                                                    </div>

                                                    <ReactQuill
                                                        ref={quillRef}
                                                        theme="snow"
                                                        value={formData.pages[activeContentPage]?.content || ''}
                                                        onChange={handleDetailsChange}
                                                        placeholder="Provide additional context, code snippets, or examples..."
                                                        modules={quillModules}
                                                        style={{ height: '200px', marginBottom: '50px' }}
                                                    />
                                                </div>

                                                {/* Hidden file inputs */}
                                                <input
                                                    type="file"
                                                    ref={imageInputRef}
                                                    style={{ display: 'none' }}
                                                    accept="image/*"
                                                    onChange={handleImageFileSelected}
                                                />
                                                <input
                                                    type="file"
                                                    ref={inlineFileInputRef}
                                                    style={{ display: 'none' }}
                                                    onChange={handleInlineFileSelected}
                                                />
                                                {uploadingImage && (
                                                    <div className="text-secondary small mt-1">
                                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                                        Uploading image...
                                                    </div>
                                                )}

                                                {/* Advanced pages link */}
                                                {!showAdvancedPages && (
                                                    <div className="mt-2">
                                                        <button
                                                            type="button"
                                                            className="btn btn-link btn-sm text-muted p-0"
                                                            onClick={() => { setShowAdvancedPages(true); addPage(); }}
                                                        >
                                                            <i className="bi bi-plus-circle me-1"></i>
                                                            Add another page (advanced)
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ========== SETTINGS TAB ========== */}
                                {activeTab === 'settings' && (
                                    <div className="animate__animated animate__fadeIn">
                                        <h5 className="mb-4 text-muted">
                                            <i className="bi bi-gear-fill me-2"></i>Question Settings
                                        </h5>

                                        {/* ATTACHMENTS SECTION */}
                                        <div
                                            className={`mb-4 p-3 rounded border transition-all ${isDraggingAttachment ? 'bg-primary-subtle border-primary border-dashed shadow-sm' : 'bg-light'}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            style={{ borderStyle: isDraggingAttachment ? 'dashed' : 'solid', borderWidth: '2px' }}
                                        >
                                            <div className="text-center mb-2" style={{ display: isDraggingAttachment ? 'block' : 'none' }}>
                                                <i className="bi bi-cloud-arrow-up fs-1 text-primary"></i>
                                                <div className="fw-bold">Drop files here</div>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div>
                                                    <label className="form-label fw-bold mb-0">
                                                        <i className="bi bi-paperclip me-2"></i> Attachments
                                                    </label>
                                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                        Supported: PDF, DOCX, XLSX, PNG, JPG (Max 10MB)
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={handleAttachmentFileSelect}
                                                    disabled={uploadingAttachment}
                                                >
                                                    <i className="bi bi-plus-lg me-1"></i> Add Files
                                                </button>
                                            </div>
                                            
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                style={{ display: 'none' }}
                                                multiple
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                                                onChange={handleAttachmentFilesSelected}
                                            />

                                            {(pendingAttachments.length > 0 || uploadedAttachments.length > 0) ? (
                                                <div className="list-group">
                                                    {uploadedAttachments.map((att) => (
                                                        <div key={att.id} className="list-group-item d-flex justify-content-between align-items-center">
                                                            <div className="d-flex align-items-center text-truncate">
                                                                <i className={`bi ${getFileIcon(att.fileName)} fs-4 me-3`}></i>
                                                                <div>
                                                                    <div className="fw-medium text-truncate" style={{ maxWidth: '250px' }}>{att.fileName}</div>
                                                                    <div className="text-muted small">{formatFileSize(att.fileSize)}</div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger border-0"
                                                                onClick={() => removeUploadedAttachment(att.id)}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {pendingAttachments.map((file, idx) => (
                                                        <div key={`pending-${idx}`} className="list-group-item d-flex justify-content-between align-items-center bg-light-subtle">
                                                            <div className="d-flex align-items-center text-truncate">
                                                                <i className={`bi ${getFileIcon(file.name)} fs-4 me-3`}></i>
                                                                <div>
                                                                    <div className="fw-medium text-truncate" style={{ maxWidth: '250px' }}>
                                                                        {file.name} 
                                                                        <span className="badge bg-warning text-dark ms-2">Pending</span>
                                                                    </div>
                                                                    <div className="text-muted small">{formatFileSize(file.size)}</div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger border-0"
                                                                onClick={() => removePendingAttachment(idx)}
                                                            >
                                                                <i className="bi bi-x-lg"></i>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div 
                                                    className="text-center text-muted py-3 border border-dashed rounded bg-white" 
                                                    onClick={handleAttachmentFileSelect} 
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <i className="bi bi-cloud-upload fs-3 d-block mb-1"></i>
                                                    <small>Click to upload files</small>
                                                </div>
                                            )}
                                            {uploadingAttachment && (
                                                <div className="mt-2 text-primary small">
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Uploading...
                                                </div>
                                            )}
                                        </div>

                                        {/* TARGET AUDIENCE (Optional) */}
                                        <div className="mb-4">
                                            <label className="form-label fw-bold">
                                                Target Audience 
                                                <span className="text-muted fw-normal ms-1" style={{ fontSize: '0.8rem' }}>(Optional)</span>
                                            </label>
                                            <small className="d-block text-muted mb-2">
                                                Help responders understand who this question is for
                                            </small>
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
                                                                id={`q-audience-${val}`}
                                                            />
                                                            <label className="form-check-label" htmlFor={`q-audience-${val}`}>{label}</label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setIsSaving(true);
                                                localStorage.setItem('topic_trail_question_draft', JSON.stringify(formData));
                                                setLastSaved(new Date());
                                                setTimeout(() => setIsSaving(false), 1000);
                                            }}
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

                                        {/* Post Question Button */}
                                        <button
                                            type="submit"
                                            className="btn btn-success px-4"
                                            disabled={loading || !canSubmit}
                                            title={!canSubmit ? 'Please fill in required fields (Question, Category)' : ''}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Posting...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-send me-1"></i>
                                                    Post Question
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

export default CreateQuestionPage;
