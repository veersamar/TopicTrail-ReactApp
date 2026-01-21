import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AttachmentsSection from './AttachmentsSection';
import ArticleReactions from './ArticleReactions';
import CommentList from './CommentList';
import 'react-quill-new/dist/quill.snow.css';

function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, userId } = useAuth();

  // Guard against double-fetch in React StrictMode
  const hasFetched = useRef(false);

  // ========== STATE ==========
  const [pageState, setPageState] = useState({
    article: null,
    loading: true,
    error: null,
    likeCount: 0,
    dislikeCount: 0,
    userReaction: null,
    comments: [],
  });

  const [activePage, setActivePage] = useState(0);
  const [attachments, setAttachments] = useState([]);

  // ========== FETCH ARTICLE ON MOUNT ==========
  useEffect(() => {
    if (!id || !token) {
      setPageState(prev => ({
        ...prev,
        error: 'Invalid article or token',
        loading: false,
      }));
      return;
    }

    // Prevent double-fetch in StrictMode (fixes view count incrementing by 2)
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchArticle();
  }, [id, token]);

  // ========== FETCH ARTICLE ==========
  const fetchArticle = useCallback(async () => {
    try {
      setPageState(prev => ({ ...prev, loading: true, error: null }));

      const article = await api.getArticleById(token, id);

      if (!article) {
        setPageState(prev => ({
          ...prev,
          error: 'Article not found',
          loading: false,
        }));
        return;
      }

      console.log('Article fetched:', article);

      // Check if this is a poll article - redirect to poll page
      const articleTypeName = article.articleTypeName || article.ArticleTypeName || '';
      const pollId = article.pollId || article.PollId;
      if (articleTypeName.toLowerCase() === 'poll' && pollId) {
        navigate(`/poll/${pollId}`, { replace: true });
        return;
      }

      // Fetch comments for this article (with userId for reaction data)
      const commentsData = await api.getComments(token, id, userId);
      const commentsList = Array.isArray(commentsData?.comments) 
        ? commentsData.comments 
        : (Array.isArray(commentsData?.Comments) ? commentsData.Comments : []);

      // Fetch article reactions summary
      const reactions = await api.getArticleReactions(token, id, userId);

      setPageState(prev => ({
        ...prev,
        article,
        comments: commentsList,
        likeCount: reactions.likeCount ?? article.likeCount ?? article.LikeCount ?? 0,
        dislikeCount: reactions.dislikeCount ?? article.dislikeCount ?? article.DislikeCount ?? 0,
        userReaction: reactions.currentUserReaction ?? article.currentUserReaction ?? article.CurrentUserReaction ?? null,
        loading: false,
      }));

      // Fetch attachments separately using the dedicated API
      const fetchedAttachments = await api.getArticleAttachments(token, id);
      setAttachments(fetchedAttachments.map(att => ({
        id: att.id || att.Id,
        fileName: att.fileName || att.FileName,
        fileSize: att.fileSize || att.FileSize || 0,
        downloadUrl: att.downloadUrl || att.DownloadUrl || api.getAttachmentDownloadUrl(att.id || att.Id),
      })));
    } catch (error) {
      console.error('Error fetching article:', error);
      setPageState(prev => ({
        ...prev,
        error: error.message || 'Failed to load article',
        loading: false,
      }));
    }
  }, [id, token, userId, navigate]);

  // ========== HANDLE ERROR ==========
  const handleError = useCallback((errorMessage) => {
    setPageState(prev => ({ ...prev, error: errorMessage }));
    // Auto-clear error after 5 seconds
    setTimeout(() => {
      setPageState(prev => ({ ...prev, error: null }));
    }, 5000);
  }, []);

  // ========== SAFE PROPERTY ACCESSORS ==========
  const getTitle = () => pageState.article?.title || pageState.article?.article?.Title || pageState.article?.Title || 'Untitled';

  const getContent = () =>
    pageState.article?.content || pageState.article?.article?.Content || pageState.article?.Content || 'No content available';

  // eslint-disable-next-line no-unused-vars
  const getDescription = () =>
    pageState.article?.description || pageState.article?.article?.Description || pageState.article?.Description || '';

  const getCategory = () =>
    pageState.article?.categoryName || pageState.article?.article?.CategoryName || pageState.article?.CategoryName || 'General';

  const getCreatorName = () =>
    pageState.article?.creatorName || pageState.article?.article?.CreatorName || pageState.article?.CreatorName || 'Anonymous';

  const getCreatorEmail = () =>
    pageState.article?.creatorEmail || pageState.article?.CreatorEmail || '';

  const getCreatedDate = () => {
    const dateStr = pageState.article?.createdDate || pageState.article?.article?.CreatedDate || pageState.article?.CreatedDate;
    if (!dateStr) return 'Unknown date';

    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  const getViewCount = () => pageState.article?.viewCount || pageState.article?.ViewCount || pageState.article?.article?.viewCount || pageState.article?.article?.ViewCount || 0;

  const getArticleType = () => pageState.article?.articleType || pageState.article?.ArticleType || '';
  const getIntentType = () => pageState.article?.intentType || pageState.article?.IntentType || '';
  const getAudienceType = () => pageState.article?.audienceType || pageState.article?.AudienceType || '';
  const getTags = () => {
    const tags = pageState.article?.tags || pageState.article?.Tags;
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(t => t);
    return [];
  };

  const { article, loading, error, likeCount, dislikeCount, userReaction, comments } = pageState;

  // ========== RENDER LOADING STATE ==========
  if (loading) {
    return (
      <div className="container-lg my-5" style={{ maxWidth: '900px' }}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  // ========== RENDER ERROR STATE ==========
  if (!article && !loading) {
    return (
      <div className="container-lg my-5" style={{ maxWidth: '900px' }}>
        <button
          className="btn btn-outline-primary mb-3"
          onClick={() => navigate('/articles')}
          style={{ borderRadius: '6px' }}
        >
          <i className="bi bi-arrow-left me-2"></i>Back to Articles
        </button>
        <div
          className="alert alert-danger border-0"
          style={{ background: '#f8d7da', borderLeft: '4px solid #dc3545' }}
        >
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-circle" style={{ color: '#dc3545' }}></i>
            <span>{error || 'Article not found'}</span>
          </div>
        </div>
      </div>
    );
  }

  // ========== RENDER MAIN CONTENT ==========
  return (
    <div className="blog-container">
      {/* Back Link */}
      <button
        className="btn btn-link text-decoration-none p-0 mb-4 text-muted"
        onClick={() => navigate('/articles')}
      >
        <i className="bi bi-arrow-left me-2"></i>Back to Articles
      </button>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger border-0 mb-4">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-circle"></i>
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setPageState(prev => ({ ...prev, error: null }))}
          ></button>
        </div>
      )}

      {/* Blog Wrapper */}
      <article className="fade-in">
        {/* Header */}
        <header className="blog-header">
          <span className="blog-category-pill">
            {getCategory()}
          </span>

          <h1 className="blog-title">
            {getTitle()}
          </h1>

          <div className="blog-meta-row">
            <div className="blog-author-info">
              <div className="blog-author-avatar-placeholder">
                <i className="bi bi-person-fill"></i>
              </div>
              <div className="d-flex flex-column" style={{ lineHeight: 1.2 }}>
                <strong style={{ color: '#333' }}>{getCreatorName()}</strong>
                {getCreatorEmail() && <small style={{ fontSize: '0.85em' }}>{getCreatorEmail()}</small>}
              </div>
            </div>

            <div className="ms-auto d-flex gap-3 align-items-center">
              <span>
                <i className="bi bi-calendar3 me-1"></i> {getCreatedDate()}
              </span>
              <span>
                <i className="bi bi-eye me-1"></i> {getViewCount()}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="blog-content">
          {/* Pagination Top */}
          {getContent().split('<!-- PAGE_BREAK -->').length > 1 && (
            <div className="d-flex justify-content-between mb-4 align-items-center bg-light p-2 rounded">
              <button
                className="btn btn-sm btn-outline-secondary border-0"
                disabled={activePage === 0}
                onClick={() => setActivePage(prev => Math.max(0, prev - 1))}
              >
                <i className="bi bi-arrow-left me-1"></i> Previous
              </button>
              <span className="text-muted small fw-bold">
                Part {activePage + 1} of {getContent().split('<!-- PAGE_BREAK -->').length}
              </span>
              <button
                className="btn btn-sm btn-outline-secondary border-0"
                disabled={activePage >= getContent().split('<!-- PAGE_BREAK -->').length - 1}
                onClick={() => setActivePage(prev => Math.min(getContent().split('<!-- PAGE_BREAK -->').length - 1, prev + 1))}
              >
                Next <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          )}

          <div
            dangerouslySetInnerHTML={{ __html: getContent().split('<!-- PAGE_BREAK -->')[activePage] }}
          />

          {/* Pagination Bottom */}
          {getContent().split('<!-- PAGE_BREAK -->').length > 1 && (
            <div className="d-flex justify-content-center mt-5">
              {getContent().split('<!-- PAGE_BREAK -->').map((_, idx) => (
                <button
                  key={idx}
                  className={`btn btn-sm mx-1 ${activePage === idx ? 'btn-dark' : 'btn-light'}`}
                  onClick={() => setActivePage(idx)}
                  style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Area */}
        <footer className="blog-footer">
          {/* Tags */}
          {getTags().length > 0 && (
            <div className="mb-4 d-flex flex-wrap gap-2">
              {getTags().map((tag, idx) => (
                <span key={idx} className="badge bg-light text-secondary border p-2 fw-normal">
                  #{typeof tag === 'string' ? tag.trim() : tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="d-flex align-items-center justify-content-between mt-4 mb-5">
            <div className="d-flex gap-3 align-items-center">
              {/* Article Reactions (Like/Dislike) */}
              <ArticleReactions
                articleId={parseInt(id)}
                initialLikeCount={likeCount}
                initialDislikeCount={dislikeCount}
                initialUserReaction={userReaction}
                onError={handleError}
              />
              <button className="btn btn-outline-secondary rounded-pill px-4">
                <i className="bi bi-share me-2"></i> Share
              </button>
            </div>
          </div>

          {/* Attachments */}
          <div className="mb-5">
            <AttachmentsSection attachments={attachments} />
          </div>

          {/* Technical Specs Box */}
          {(getArticleType() || getIntentType() || getAudienceType()) && (
            <div className="blog-tech-specs">
              <h5 className="mb-3 fw-bold text-uppercase small text-muted">About this Article</h5>
              <div className="row g-4">
                {getArticleType() && (
                  <div className="col-sm-4">
                    <div className="d-block text-muted small text-uppercase fw-bold mb-1">Type</div>
                    <div>{getArticleType()}</div>
                  </div>
                )}
                {getIntentType() && (
                  <div className="col-sm-4">
                    <div className="d-block text-muted small text-uppercase fw-bold mb-1">Intent</div>
                    <div>{getIntentType()}</div>
                  </div>
                )}
                {getAudienceType() && (
                  <div className="col-sm-4">
                    <div className="d-block text-muted small text-uppercase fw-bold mb-1">Audience</div>
                    <div>{getAudienceType()}</div>
                  </div>
                )}
              </div>
            </div>
          )}

        </footer>
      </article>

      {/* Comments Section - Using CommentList component */}
      <CommentList
        articleId={parseInt(id)}
        initialComments={comments}
        onError={handleError}
      />
    </div >
  );
}

export default ArticleDetail;