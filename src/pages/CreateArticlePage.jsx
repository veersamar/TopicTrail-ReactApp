import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams, useParams, useOutletContext } from 'react-router-dom';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import ImageResize from '@looop/quill-image-resize-module-react';

// Register the image resize module
Quill.register('modules/imageResize', ImageResize);

// Define Custom File Blot
const BlockEmbed = Quill.import('blots/block/embed');

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

        // Icon
        const icon = document.createElement('i');
        const iconClass = getFileIcon(value.name); // Reuse existing helper
        icon.className = `bi ${iconClass} fs-4 me-3`;

        // Info
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

        // Download Action
        const action = document.createElement('i');
        action.className = 'bi bi-download ms-3 text-primary';

        card.appendChild(icon);
        card.appendChild(info);
        card.appendChild(action);

        // Click handler to download
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

function CreateArticlePage() {
    const { token, userId } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [searchParams] = useSearchParams();
    // In edit mode, type is derived from the article, but initially fallback to param or post
    const [articleTypeParam, setArticleTypeParam] = useState(searchParams.get('type') || 'post');

    // Note: Focus Mode context removed as right sidebar was removed per design spec
    // The page now uses a simplified two-column layout (META panel + Content area)
    const outletContext = useOutletContext() || {};

    // Clean up any existing focus mode on mount
    useEffect(() => {
        if (outletContext.setIsFocusMode) {
            outletContext.setIsFocusMode(true); // Keep sidebars hidden for writer-focused experience
        }
        return () => {
            if (outletContext.setIsFocusMode) {
                outletContext.setIsFocusMode(false);
            }
        };
    }, [outletContext.setIsFocusMode]);

    const tagInputRef = useRef(null);
    const quillRef = useRef(null);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const inlineFileInputRef = useRef(null);
    const articleFetchedRef = useRef(false); // Track if article has been fetched to prevent re-fetching

    // Type configuration
    const typeConfig = {
        post: { icon: '📝', title: isEditMode ? 'Edit Post' : 'Create New Post', subtitle: isEditMode ? 'Update your article' : 'Share an article or blog with the community' },
        question: { icon: '❓', title: isEditMode ? 'Edit Question' : 'Ask a Question', subtitle: isEditMode ? 'Update your question' : 'Get answers from the community' },
        poll: { icon: '📊', title: isEditMode ? 'Edit Poll' : 'Create a Poll', subtitle: isEditMode ? 'Update your poll' : 'Gather opinions from the community' },
    };

    const currentTypeConfig = typeConfig[articleTypeParam] || typeConfig.post;

    const [formState, setFormState] = useState({
        loading: false,
        masterDataLoading: true,
        articleDataLoading: false,
        errors: {},
        successMessage: '',
        articleTypes: [],
        categories: [],
        subCategories: [],
        intentTypes: [],
        audienceTypes: [],
    });

    // Simplified tabs: Content and Settings only (removed Basics step)
    const [activeTab, setActiveTab] = useState('content');
    const [activeContentPage, setActiveContentPage] = useState(0);

    // New state for attachments and image uploads
    const [pendingAttachments, setPendingAttachments] = useState([]); // Files to upload
    const [uploadedAttachments, setUploadedAttachments] = useState([]); // Already uploaded (edit mode)
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const [uploadedArticleId, setUploadedArticleId] = useState(null); // For tracking article ID after creation
    const [uploadedMedia, setUploadedMedia] = useState([]); // Inline images already uploaded (edit mode)
    const [isDraggingAttachment, setIsDraggingAttachment] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        pages: [{ title: 'Page 1', content: '' }], // Changed from strings to objects
        categoryId: '',
        subCategoryId: '',
        articleType: '',
        intentType: '',
        audienceTypes: [],
        visibility: 'Public',
        tags: [],
        pollOptions: ['', ''],
    });

    // Tag input state
    const [tagInput, setTagInput] = useState('');
    const [tagSuggestions, setTagSuggestions] = useState([]);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);

    // Fetch master data on mount
    useEffect(() => {
        fetchMasterData();
    }, []);

    // Set articleDataLoading to true initially for edit mode and reset fetch flag when id changes
    useEffect(() => {
        if (isEditMode) {
            setFormState(prev => ({ ...prev, articleDataLoading: true }));
            articleFetchedRef.current = false; // Reset when article id changes
        }
    }, [isEditMode, id]);

    // Fetch Article Data in Edit Mode
    useEffect(() => {
        if (isEditMode && token && userId && !articleFetchedRef.current) {
            const fetchArticleDetails = async () => {
                try {
                    articleFetchedRef.current = true; // Mark as fetched immediately
                    setFormState(prev => ({ ...prev, articleDataLoading: true, errors: {} }));
                    const articleResponse = await api.getArticleById(token, id);
                    console.log("Edit Article Response:", articleResponse);

                    if (!articleResponse) {
                        throw new Error('Article not found or API error');
                    }

                    // Check ownership (soft check - let backend enforce if frontend data is incomplete)
                    const article = articleResponse.article || articleResponse;
                    const creatorId = article.CreatorId || article.creatorId || (article.creator && article.creator.id) || (article.Creator && article.Creator.Id);

                    if (creatorId && userId && String(creatorId) !== String(userId)) {
                        console.warn("Frontend ownership check failed:", { userId, creatorId });
                        alert("You do not appear to be the owner of this article.");
                        navigate('/articles');
                        return;
                    }

                    // Map API data to Form Data
                    const typeId = article.ArticleType || article.articleType || article.ArticleTypeId || article.articleTypeId || (article.type && (article.type.id || article.type.Id));

                    const content = article.Content || article.content || '';

                    // Parse Metadata for Page Titles
                    let titles = [];
                    let cleanContent = content;
                    // Use a more robust regex that handles the metadata at the end
                    const metaMatch = content.match(/<!-- METADATA: (\{[^}]+\}) -->$/);
                    if (metaMatch) {
                        try {
                            const meta = JSON.parse(metaMatch[1]);
                            titles = meta.pageTitles || [];
                            cleanContent = content.replace(metaMatch[0], '').trim();
                        } catch (e) {
                            console.warn("Failed to parse metadata", e);
                        }
                    }

                    const rawPages = cleanContent.split('<!-- PAGE_BREAK -->');
                    const pages = rawPages.map((p, idx) => ({
                        title: titles[idx] || `Page ${idx + 1}`,
                        content: p
                    }));

                    if (pages.length === 0) pages.push({ title: 'Page 1', content: '' });

                    setFormData({
                        title: article.Title || article.title || '',
                        description: article.Description || article.description || '',
                        pages: pages,
                        categoryId: article.CategoryId || article.categoryId || '',
                        subCategoryId: article.SubCategoryId || article.subCategoryId || '',
                        articleType: typeId,
                        intentType: article.IntentType || article.intentType || '',
                        audienceTypes: Array.isArray(article.AudienceTypes || article.audienceTypes)
                            ? (article.AudienceTypes || article.audienceTypes).map(String)
                            : [],

                        visibility: article.Visibility || article.visibility || 'Public',
                        tags: (() => {
                            const raw = article.Tags || article.tags;
                            if (Array.isArray(raw)) return raw.map(t => typeof t === 'object' ? (t.name || t.Name || '') : String(t)).filter(t => t);
                            if (typeof raw === 'string') return raw.split(',').map(t => t.trim()).filter(t => t);
                            return [];
                        })(),
                        pollOptions: article.PollOptions || article.pollOptions || ['', ''],
                    });

                    // Load existing attachments for edit mode using dedicated API
                    const fetchedAttachments = await api.getArticleAttachments(token, id);
                    setUploadedAttachments((fetchedAttachments || []).map(att => ({
                        id: att.id || att.Id,
                        fileName: att.fileName || att.FileName || att.name || 'Unknown',
                        fileSize: att.fileSize || att.FileSize || 0,
                        downloadUrl: att.downloadUrl || att.DownloadUrl || (api.getAttachmentDownloadUrl ? api.getAttachmentDownloadUrl(att.id || att.Id) : ''),
                    })));

                    // Load existing inline media for edit mode (for management purposes)
                    const fetchedMedia = await api.getArticleMedia(token, id);
                    setUploadedMedia((fetchedMedia || []).map(m => ({
                        id: m.id || m.Id,
                        fileName: m.fileName || m.FileName,
                        url: m.url || m.Url,
                    })));

                    setUploadedArticleId(parseInt(id, 10));

                    setFormState(prev => ({ ...prev, articleDataLoading: false }));

                } catch (error) {
                    console.error("Error fetching article for edit:", error);
                    setFormState(prev => ({ ...prev, articleDataLoading: false, errors: { submit: error.message || 'Failed to load article details' } }));
                }
            };
            fetchArticleDetails();
        }
    }, [isEditMode, id, token, userId]);

    // Update articleTypeParam when formData.articleType changes and master data is available
    useEffect(() => {
        if (formData.articleType && formState.articleTypes.length > 0) {
            const typeObj = formState.articleTypes.find(t => t.id === formData.articleType || t.Id === formData.articleType);
            if (typeObj) {
                const typeName = (typeObj.name || typeObj.Name || '').toLowerCase();
                setArticleTypeParam(typeName);
            }
        }
    }, [formData.articleType, formState.articleTypes]);

    // Fetch master data and set ArticleType from prop
    const fetchMasterData = async () => {
        try {
            setFormState(prev => ({ ...prev, masterDataLoading: true, errors: {} }));

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
                masterDataLoading: false,
            }));

            if (selectedArticleType && !isEditMode) {
                setFormData(prev => ({ ...prev, articleType: selectedArticleType }));
            }

            // Load draft from localStorage for new articles (non-blocking)
            if (!isEditMode) {
                const savedDraft = localStorage.getItem('topic_trail_article_draft');
                if (savedDraft) {
                    try {
                        const parsed = JSON.parse(savedDraft);
                        // Check if draft has meaningful content
                        const hasMeaningfulContent = parsed.title || 
                            (parsed.pages && parsed.pages[0]?.content && parsed.pages[0].content.replace(/<[^>]*>/g, '').trim());
                        
                        if (hasMeaningfulContent) {
                            // Use setTimeout to make the confirm non-blocking
                            setTimeout(() => {
                                if (window.confirm("Found a saved draft. Would you like to restore it?")) {
                                    // Restore draft but preserve the correct articleType from master data
                                    setFormData(prev => ({ 
                                        ...prev, 
                                        ...parsed,
                                        articleType: selectedArticleType || prev.articleType // Always use correct type ID
                                    }));
                                } else {
                                    localStorage.removeItem('topic_trail_article_draft');
                                }
                            }, 100);
                        }
                    } catch (e) {
                        console.error("Failed to parse draft", e);
                        localStorage.removeItem('topic_trail_article_draft');
                    }
                }
            }

            // Re-ensure article type is set after any draft restore (redundant but safe)
            if (selectedArticleType && !isEditMode) {
                setTimeout(() => {
                    setFormData(prev => ({ ...prev, articleType: selectedArticleType }));
                }, 150);
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
        if (isEditMode) return; // Don't autosave in edit mode to avoid overwriting production data logic

        const saveTimer = setTimeout(() => {
            if (formData.title || formData.pages[0]?.content) {
                setIsSaving(true);
                localStorage.setItem('topic_trail_article_draft', JSON.stringify(formData));
                setLastSaved(new Date());
                setTimeout(() => setIsSaving(false), 2000);
            }
        }, 30000); // 30 seconds

        return () => clearTimeout(saveTimer);
    }, [formData, isEditMode]);

    const clearDraft = () => {
        localStorage.removeItem('topic_trail_article_draft');
    };

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
            newPages[index] = { ...newPages[index], content: value };
            return { ...prev, pages: newPages };
        });

        if (formState.errors.content) {
            setFormState(prev => ({ ...prev, errors: { ...prev.errors, content: null } }));
        }
    };

    const handlePageTitleChange = (index, newTitle) => {
        setFormData(prev => {
            const newPages = [...prev.pages];
            newPages[index] = { ...newPages[index], title: newTitle };
            return { ...prev, pages: newPages };
        });
    };

    const addPage = () => {
        setFormData(prev => {
            const nextPageNum = prev.pages.length + 1;
            const newPages = [...prev.pages, { title: `Page ${nextPageNum}`, content: '' }];
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

    // ==================== IMAGE UPLOAD HANDLER ====================
    // Handler for inline image upload in editor
    const handleImageUpload = useCallback(async () => {
        // Open file picker
        if (imageInputRef.current) {
            imageInputRef.current.click();
        }
    }, []);

    const handleImageFileSelected = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate image type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (PNG, JPG, GIF)');
            return;
        }

        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        // For new articles without an ID yet, we need to create the article first
        // For edit mode or if we already have an article ID, upload directly
        const articleId = uploadedArticleId || (isEditMode ? parseInt(id, 10) : null);

        if (!articleId) {
            // For new articles, insert a placeholder and upload after article creation
            // OR we can require saving draft first. For now, show message.
            alert('Please save your article first before adding inline images. You can add images after the initial save.');
            e.target.value = '';
            return;
        }

        try {
            setUploadingImage(true);
            console.log('Uploading image for articleId:', articleId);
            const result = await api.uploadArticleMedia(token, articleId, file);
            console.log('Upload result:', result);

            if (result.success && result.url) {
                console.log('Inserting image with URL:', result.url);
                // Insert image into editor at cursor position
                const quill = quillRef.current?.getEditor?.() || quillRef.current?.editor;
                if (quill) {
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', result.url);
                    quill.setSelection(range.index + 1);
                    console.log('Image inserted successfully');
                } else {
                    console.error('Quill editor not available');
                }
            } else {
                console.error('Image upload failed:', result.error);
                alert('Failed to upload image: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Image upload error:', error);
            alert('Failed to upload image');
        } finally {
            setUploadingImage(false);
            e.target.value = ''; // Reset input
        }
    }, [token, uploadedArticleId, isEditMode, id]);

    // ==================== INLINE FILE HANDLERS ====================
    const handleInsertFile = useCallback(() => {
        inlineFileInputRef.current?.click();
    }, []);

    const handleInlineFileSelected = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input
        e.target.value = '';

        const articleId = uploadedArticleId || (isEditMode ? parseInt(id, 10) : null);
        if (!articleId) {
            alert('Please save your article first before adding inline files.');
            return;
        }

        try {
            setUploadingAttachment(true); // Reuse loading state
            const formData = new FormData();
            formData.append('file', file);
            formData.append('articleId', articleId);

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
    }, [token, uploadedArticleId, isEditMode, id]);

    const insertAttachmentToEditor = useCallback((attachment) => {
        const quillEditor = quillRef.current?.getEditor?.() || quillRef.current?.editor;
        if (quillEditor) {
            const range = quillEditor.getSelection(true) || { index: quillEditor.getLength() };

            // Construct absolute URL using API helper
            // If attachment has 'url' use it, else construct
            // Assuming attachment object from API has 'id' and 'fileName'
            const downloadUrl = attachment.url || api.getAttachmentDownloadUrl(attachment.id);

            quillEditor.insertEmbed(range.index, 'file-card', {
                url: downloadUrl,
                name: attachment.fileName || attachment.name,
                size: attachment.fileSize || attachment.size,
                type: attachment.contentType || 'application/octet-stream' // fallback
            });
            quillEditor.setSelection(range.index + 1);
        } else {
            alert("Please click inside the editor content first.");
        }
    }, []);

    // ==================== PASTE IMAGE HANDLER ====================
    // Intercepts pasted images (base64) and uploads them to backend
    const handlePasteImage = useCallback(async (file) => {
        const articleId = uploadedArticleId || (isEditMode ? parseInt(id, 10) : null);

        if (!articleId) {
            alert('Please save your article first before pasting images. You can paste images after the initial save.');
            return null;
        }

        try {
            setUploadingImage(true);
            const result = await api.uploadArticleMedia(token, articleId, file);

            if (result.success && result.url) {
                return result.url;
            } else {
                console.error('Paste image upload failed:', result.error);
                alert('Failed to upload pasted image: ' + (result.error || 'Unknown error'));
                return null;
            }
        } catch (error) {
            console.error('Paste image upload error:', error);
            alert('Failed to upload pasted image');
            return null;
        } finally {
            setUploadingImage(false);
        }
    }, [token, uploadedArticleId, isEditMode, id]);

    // Effect to attach paste listener to Quill editor
    useEffect(() => {
        let attachInterval;
        let editorRoot = null;

        const handlePaste = async (e) => {
            const clipboardData = e.clipboardData;
            if (!clipboardData) return;

            // Check for image files in clipboard
            const items = clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    e.stopPropagation();

                    const file = item.getAsFile();
                    if (file) {
                        const url = await handlePasteImage(file);
                        if (url) {
                            const quillEditor = quillRef.current?.getEditor?.() || quillRef.current?.editor;
                            if (quillEditor) {
                                const range = quillEditor.getSelection(true);
                                quillEditor.insertEmbed(range ? range.index : 0, 'image', url);
                                if (range) quillEditor.setSelection(range.index + 1);
                            }
                        }
                    }
                    return; // Only handle first image
                }
            }
        };

        const attachListener = () => {
            const quillEditor = quillRef.current?.getEditor?.() || quillRef.current?.editor;
            if (quillEditor) {
                console.log('Quill editor instance found, attaching paste listener');
                editorRoot = quillEditor.root;
                editorRoot.removeEventListener('paste', handlePaste); // Remove existing to avoid duplicates
                editorRoot.addEventListener('paste', handlePaste);

                if (attachInterval) clearInterval(attachInterval);
            } else {
                console.log('Waiting for Quill editor instance...');
            }
        };

        // Try to attach immediately
        attachListener();

        // Retry every 500ms if not found (max 5 seconds)
        let attempts = 0;
        attachInterval = setInterval(() => {
            attempts++;
            if (attempts > 10) clearInterval(attachInterval);
            attachListener();
        }, 500);

        return () => {
            if (attachInterval) clearInterval(attachInterval);
            if (editorRoot) {
                editorRoot.removeEventListener('paste', handlePaste);
                console.log('Paste listener removed');
            }
        };
    }, [handlePasteImage, activeContentPage]);

    // ==================== ATTACHMENT FILE HANDLERS ====================
    const handleAttachmentFileSelect = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, []);

    const processFiles = useCallback((files) => {
        if (files.length === 0) return;

        // Validate file types
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
                // Also check extension as some browsers have poor MIME mapping for office docs
                const ext = file.name.split('.').pop().toLowerCase();
                const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif'];
                if (allowedExts.includes(ext)) return true;

                console.warn(`File type not allowed: ${file.type}`);
                return false;
            }
            // Max 10MB per file
            if (file.size > 10 * 1024 * 1024) {
                console.warn(`File too large: ${file.name}`);
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
        // Reset input so same file can be selected again
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

        const articleId = uploadedArticleId || (isEditMode ? parseInt(id, 10) : null);
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
    }, [token, uploadedArticleId, isEditMode, id]);

    // ==================== VALIDATION ====================
    const validateForm = () => {
        const newErrors = {};

        if (!formData.title?.trim()) {
            newErrors.title = 'Title is required';
            setActiveTab('content');
        } else if (formData.title.length < 10) {
            newErrors.title = 'Title must be at least 10 characters';
            setActiveTab('content');
        }

        const totalContent = formData.pages.map(p => p.content).join('').trim();
        const textContent = totalContent.replace(/<[^>]*>/g, '').trim();

        if (!textContent) {
            newErrors.content = 'Content is required';
            setActiveTab('content');
        } else if (textContent.length < 50) {
            newErrors.content = `Content must be at least 50 characters (current text length: ${textContent.length})`;
            setActiveTab('content');
        }

        if (!formData.categoryId) {
            newErrors.categoryId = 'Category is required';
            // Category is now in META panel, visible on both tabs
        }

        if (!formData.articleType) {
            newErrors.articleType = 'Article Type is required';
            // Article type is derived from URL param
        }

        if (Object.keys(newErrors).length > 0) {
            console.warn("Validation Failed:", newErrors);
            const errorMsg = Object.entries(newErrors).map(([k, v]) => `${k}: ${v}`).join('\n');
            alert("Validation Failed:\n" + errorMsg);
            setFormState(prev => ({ ...prev, errors: newErrors }));
            return false;
        }
        return true;
    };

    // Submit handler with two-phase creation: create article first, then upload attachments
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setFormState(prev => ({ ...prev, loading: true, errors: {} }));

            const joinedContent = formData.pages.map(p => p.content).join('<!-- PAGE_BREAK -->');
            const pageTitles = formData.pages.map(p => p.title);
            // Append metadata at the end of content
            const finalContent = joinedContent + `<!-- METADATA: ${JSON.stringify({ pageTitles })} -->`;

            // Get the correct article type ID from master data (fallback to formData.articleType)
            const targetType = formState.articleTypes.find(t =>
                (t.name || t.Name || '').toLowerCase() === articleTypeParam.toLowerCase()
            );
            const articleTypeId = targetType ? (targetType.id || targetType.Id || targetType.value || targetType.Value) : formData.articleType;

            const articleData = {
                Title: formData.title.trim(),
                Description: formData.description?.trim() || null,
                Content: finalContent,
                CategoryId: parseInt(formData.categoryId, 10),
                SubCategoryId: formData.subCategoryId ? parseInt(formData.subCategoryId, 10) : null,
                ArticleType: parseInt(articleTypeId, 10), // Always use correct type from master data
                IntentType: formData.intentType ? parseInt(formData.intentType, 10) : null,
                AudienceTypes: formData.audienceTypes.length > 0 ? formData.audienceTypes.map(id => parseInt(id, 10)) : null,
                Tags: formData.tags.length > 0 ? formData.tags : ['general'],
                Visibility: formData.visibility,
                PollOptions: formData.pollOptions.filter(opt => opt.trim() !== ''),
            };

            console.log('Submitting article data:', articleData);
            console.log('Article Type ID from master data:', articleTypeId, 'formData.articleType:', formData.articleType);

            let result;
            let articleId;

            if (isEditMode) {
                result = await api.updateArticle(token, id, userId, articleData);
                articleId = parseInt(id, 10);
            } else {
                result = await api.createArticle(token, userId, articleData);
                articleId = result.id || result.articleId;
            }

            if (!result.success) {
                setFormState(prev => ({
                    ...prev,
                    loading: false,
                    errors: { submit: result.error || 'Failed to save article' }
                }));
                return;
            }

            // Phase 2: Upload pending attachments
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
                successMessage: isEditMode ? 'Article updated successfully!' : 'Article created successfully!',
            }));

            clearDraft(); // Remove local draft on success

            setTimeout(() => {
                navigate('/articles');
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

    // Note: stats and publishChecklist removed as part of UI refactor 
    // (Insights/Checklist/Tips panels were removed per design spec)

    // Memoize ReactQuill modules to prevent re-initialization
    const quillModules = useMemo(() => ({
        toolbar: {
            container: "#toolbar",
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

    const { loading, masterDataLoading, articleDataLoading, errors, successMessage, categories, subCategories, intentTypes, audienceTypes } = formState;

    // In edit mode, wait for both master data and article data to load
    // In create mode, only wait for master data
    const isLoading = masterDataLoading || (isEditMode && articleDataLoading);

    if (isLoading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Loading options...</p>
            </div>
        );
    }

    return (
        <div className="create-article-page pb-5">
            {/* Page Header */}
            <div className="d-flex align-items-center mb-4">
                <div className="me-3 p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{currentTypeConfig.icon}</span>
                </div>
                <div>
                    <h2 className="mb-1 fw-bold">{currentTypeConfig.title}</h2>
                    <p className="text-muted mb-0">{currentTypeConfig.subtitle}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={(e) => {
                // Prevent form submission on Enter key except in textarea
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                }
            }}>
                {/* Main Layout: META Panel (Left) + Content Area (Right) */}
                <div className="d-flex gap-4">
                    
                    {/* ========== META PANEL (PERSISTENT LEFT SIDEBAR) ========== */}
                    <aside 
                        className="meta-panel rounded bg-white shadow-sm" 
                        style={{ 
                            width: '300px', 
                            minWidth: '300px', 
                            maxWidth: '300px',
                            borderLeft: '4px solid #667eea',
                            border: '1px solid #e9ecef'
                        }}
                    >
                        <div className="p-3 border-bottom" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                            <h6 className="mb-0 fw-bold text-uppercase small" style={{ color: '#667eea' }}>
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
                                <label className="form-label fw-bold small text-muted">Sub-Category</label>
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

                            {/* Intent */}
                            {articleTypeParam === 'post' && (
                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">Intent</label>
                                    <select
                                        className="form-select form-select-sm"
                                        name="intentType"
                                        value={formData.intentType}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Intent...</option>
                                        {renderSelectOptions(intentTypes)}
                                    </select>
                                </div>
                            )}

                            {/* Visibility */}
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-muted">Visibility</label>
                                <select
                                    className="form-select form-select-sm"
                                    name="visibility"
                                    value={formData.visibility}
                                    onChange={handleInputChange}
                                >
                                    <option value="Public">Public</option>
                                    <option value="Private">Private</option>
                                </select>
                            </div>

                            {/* Poll Options (Poll Only) */}
                            {articleTypeParam === 'poll' && (
                                <div className="mb-3">
                                    <label className="form-label fw-bold small">Poll Options <span className="text-danger">*</span></label>
                                    {formData.pollOptions.map((option, idx) => (
                                        <div key={idx} className="input-group input-group-sm mb-2">
                                            <span className="input-group-text">{idx + 1}</span>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
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
                                                    <i className="bi bi-x"></i>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {formData.pollOptions.length < 5 && (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary w-100"
                                            onClick={() => setFormData(prev => ({ ...prev, pollOptions: [...prev.pollOptions, ''] }))}
                                        >
                                            + Add Option
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Tags (Optional) - Enterprise grade with scrollable container */}
                            <div className="mb-3">
                                <label className="form-label small text-muted d-flex align-items-center">
                                    <span className="fw-medium">Tags</span>
                                    <span className="ms-1 text-secondary" style={{ fontSize: '0.75rem' }}>(Optional)</span>
                                </label>
                                <div 
                                    className="border rounded bg-white p-2"
                                    style={{ minHeight: '36px' }}
                                >
                                    {/* Tags display area - max 2 lines with scroll */}
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
                                    {/* Tag input */}
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
                            {/* Tab Headers - Only Content and Settings */}
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
                                        {/* Title Field */}
                                        <div className="mb-4">
                                            <label className="form-label fw-bold">
                                                {articleTypeParam === 'question' ? 'Question' : 'Title'} <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control form-control-lg ${errors.title ? 'is-invalid' : ''}`}
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                onBlur={() => {
                                                    if (!formData.title?.trim()) {
                                                        setFormState(prev => ({ ...prev, errors: { ...prev.errors, title: 'Title is required before publishing.' } }));
                                                    } else if (formData.title.length < 10) {
                                                        setFormState(prev => ({ ...prev, errors: { ...prev.errors, title: 'Title must be at least 10 characters.' } }));
                                                    }
                                                }}
                                                placeholder={articleTypeParam === 'question' ? 'What would you like to ask?' : 'Enter an engaging title...'}
                                            />
                                            {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                        </div>

                                        {/* Page Navigation for Multi-Page Content */}
                                        <div className="mb-3">
                                            <label className="form-label small text-muted fw-medium mb-2">
                                                <i className="bi bi-files me-1"></i>Content Pages
                                            </label>
                                            <div className="d-flex align-items-center">
                                                <div className="d-flex overflow-auto pb-2 align-items-center flex-grow-1 me-2" style={{ scrollbarWidth: 'thin' }}>
                                                    {formData.pages.map((page, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        className={`btn btn-sm me-2 text-nowrap d-flex align-items-center ${activeContentPage === idx ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                        onClick={() => setActiveContentPage(idx)}
                                                        onDoubleClick={(e) => {
                                                            e.stopPropagation();
                                                            const newTitle = prompt("Rename page:", page.title);
                                                            if (newTitle) handlePageTitleChange(idx, newTitle);
                                                        }}
                                                        title="Double click to rename"
                                                    >
                                                        <span className="me-1">{page.title || `Page ${idx + 1}`}</span>
                                                        {formData.pages.length > 1 && (
                                                            <i className="bi bi-x ms-2" onClick={(e) => { e.stopPropagation(); removePage(idx); }}></i>
                                                        )}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-success text-nowrap"
                                                    onClick={addPage}
                                                >
                                                    <i className="bi bi-plus-lg me-1"></i> Add Page
                                                </button>
                                            </div>
                                        </div>
                                        </div>

                                        {/* Rich Text Editor */}
                                        <div className="mb-4">
                                            <label className="form-label fw-bold">
                                                {articleTypeParam === 'question' ? 'Details' : articleTypeParam === 'poll' ? 'Description' : `Content`} <span className="text-danger">*</span>
                                            </label>
                                            <div className={`quill-wrapper ${errors.content ? 'is-invalid border border-danger rounded' : ''}`} style={{ background: '#fff' }}>
                                                {/* Custom Toolbar */}
                                                <div id="toolbar" className="border-bottom">
                                                    <span className="ql-formats">
                                                        <select className="ql-header" defaultValue="">
                                                            <option value="1"></option>
                                                            <option value="2"></option>
                                                            <option value="3"></option>
                                                            <option value=""></option>
                                                        </select>
                                                    </span>
                                                    <span className="ql-formats">
                                                        <button type="button" className="ql-bold"></button>
                                                        <button type="button" className="ql-italic"></button>
                                                        <button type="button" className="ql-underline"></button>
                                                        <button type="button" className="ql-strike"></button>
                                                    </span>
                                                    <span className="ql-formats">
                                                        <button type="button" className="ql-list" value="ordered"></button>
                                                        <button type="button" className="ql-list" value="bullet"></button>
                                                        <button type="button" className="ql-blockquote"></button>
                                                        <button type="button" className="ql-code-block"></button>
                                                    </span>
                                                    <span className="ql-formats">
                                                        <button type="button" className="ql-link"></button>
                                                        <button type="button" className="ql-image"></button>
                                                        <button className="ql-insertFile" type="button">
                                                            <i className="bi bi-paperclip"></i>
                                                        </button>
                                                    </span>
                                                    <span className="ql-formats">
                                                        <button type="button" className="ql-clean"></button>
                                                    </span>
                                                </div>

                                                <ReactQuill
                                                    key={activeContentPage}
                                                    ref={quillRef}
                                                    theme="snow"
                                                    value={formData.pages[activeContentPage]?.content || ''}
                                                    onChange={(value) => handlePageChange(activeContentPage, value)}
                                                    placeholder="Write your content here..."
                                                    modules={quillModules}
                                                    style={{ height: '350px', marginBottom: '50px' }}
                                                />
                                            </div>
                                            {/* Hidden inputs for file selection */}
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
                                            {uploadingImage && <div className="text-secondary small mt-1"><span className="spinner-border spinner-border-sm me-1"></span>Uploading image...</div>}
                                        </div>
                                        {errors.content && <div className="invalid-feedback d-block">{errors.content}</div>}
                                        <div className="form-text text-end">
                                            Words: {(formData.pages[activeContentPage]?.content || '').replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(w => w.length > 0).length}
                                        </div>
                                    </div>
                                )}

                                {/* ========== SETTINGS TAB ========== */}
                                {activeTab === 'settings' && (
                                    <div className="animate__animated animate__fadeIn">
                                        <h5 className="mb-4 text-muted"><i className="bi bi-gear-fill me-2"></i>Publication Settings</h5>

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
                                                <div className="fw-bold">Drop files here to attach</div>
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
                                            {/* Hidden file input for attachments */}
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
                                                    {/* Existing Uploaded Attachments */}
                                                    {uploadedAttachments.map((att) => (
                                                        <div key={att.id} className="list-group-item d-flex justify-content-between align-items-center">
                                                            <div className="d-flex align-items-center text-truncate">
                                                                <i className={`bi ${getFileIcon(att.fileName)} fs-4 me-3`}></i>
                                                                <div>
                                                                    <div className="fw-medium text-truncate" style={{ maxWidth: '300px' }}>{att.fileName}</div>
                                                                    <div className="text-muted small">{formatFileSize(att.fileSize)}</div>
                                                                </div>
                                                            </div>
                                                            <div className="d-flex align-items-center">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-link text-decoration-none me-2"
                                                                    onClick={() => insertAttachmentToEditor(att)}
                                                                    title="Insert into content"
                                                                >
                                                                    Insert
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger border-0"
                                                                    onClick={() => removeUploadedAttachment(att.id)}
                                                                    title="Remove attachment"
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Pending Attachments */}
                                                    {pendingAttachments.map((file, idx) => (
                                                        <div key={`pending-${idx}`} className="list-group-item d-flex justify-content-between align-items-center bg-light-subtle">
                                                            <div className="d-flex align-items-center text-truncate">
                                                                <i className={`bi ${getFileIcon(file.name)} fs-4 me-3`}></i>
                                                                <div>
                                                                    <div className="fw-medium text-truncate" style={{ maxWidth: '300px' }}>{file.name} <span className="badge bg-warning text-dark ms-2">Pending</span></div>
                                                                    <div className="text-muted small">{formatFileSize(file.size)}</div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger border-0"
                                                                onClick={() => removePendingAttachment(idx)}
                                                                title="Remove file"
                                                            >
                                                                <i className="bi bi-x-lg"></i>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center text-muted py-3 border border-dashed rounded bg-white" onClick={handleAttachmentFileSelect} style={{ cursor: 'pointer' }}>
                                                    <i className="bi bi-cloud-upload fs-3 d-block mb-1"></i>
                                                    <small>Click to upload documents or images</small>
                                                </div>
                                            )}
                                            {uploadingAttachment && <div className="mt-2 text-primary small"><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</div>}
                                        </div>

                                        {/* TARGET AUDIENCE (Post Only) */}
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
                                                localStorage.setItem('topic_trail_article_draft', JSON.stringify(formData));
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

                                        {/* Publish Button - Always visible */}
                                        <button
                                            type="submit"
                                            className="btn btn-success px-4"
                                            disabled={loading || isLoading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Publishing...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-send me-1"></i>
                                                    {isEditMode ? 'Update Article' : 'Publish Article'}
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

export default CreateArticlePage;
