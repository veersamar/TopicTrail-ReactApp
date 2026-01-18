import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AttachmentsSection from './AttachmentsSection';
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
    liked: false,
    likeCount: 0,
    showComments: true,
    comments: [],
    newComment: '',
    commentLoading: false,
    submittingComment: false,
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

      // Fetch comments for this article
      const commentsData = await api.getComments(token, id);
      const commentsList = Array.isArray(commentsData?.comments) ? commentsData.comments : [];

      setPageState(prev => ({
        ...prev,
        article,
        comments: commentsList,
        likeCount: article.likeCount || article.LikeCount || article.article?.likeCount || article.article?.LikeCount || 0,
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
  }, [id, token, navigate]);

  // ========== HANDLE LIKE ==========
  // ✅ FIX: Remove 'article' from dependency array - use pageState.article instead
  const handleLike = useCallback(async () => {
    setPageState(prev => {
      if (!prev.article || !token || !userId) return prev;

      const newLiked = !prev.liked;

      (async () => {
        try {
          if (newLiked) {
            await api.likeArticle(token, id, userId);
          } else {
            await api.unlikeArticle(token, id, userId);
          }
        } catch (error) {
          console.error('Like error:', error);
          setPageState(p => ({
            ...p,
            error: 'Failed to update like',
          }));
        }
      })();

      return {
        ...prev,
        liked: newLiked,
        likeCount: newLiked ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1),
      };
    });
  }, [id, token, userId]); // ✅ FIX: Removed 'article' and 'pageState.liked'

  // Guard against double comment submission in StrictMode
  const isSubmittingComment = useRef(false);

  // ========== HANDLE ADD COMMENT ==========
  const handleAddComment = useCallback(async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmittingComment.current) return;

    const commentText = pageState.newComment.trim();

    if (!commentText) {
      setPageState(prev => ({ ...prev, error: 'Comment cannot be empty' }));
      return;
    }

    if (!userId) {
      setPageState(prev => ({ ...prev, error: 'Please log in to comment' }));
      return;
    }

    isSubmittingComment.current = true;
    setPageState(prev => ({ ...prev, submittingComment: true, error: null }));

    try {
      const result = await api.createComment(token, id, commentText, userId);
      console.log('Comment creation result:', result);

      if (result.success) {
        const commentObj = {
          id: result.id || Math.random(),
          content: commentText,
          creator: { name: result.creatorName || 'You', id: userId },
          createdDate: new Date().toISOString(),
          likeCount: 0,
        };

        setPageState(prev => ({
          ...prev,
          comments: [commentObj, ...prev.comments],
          newComment: '',
          submittingComment: false,
          error: null,
        }));
      } else {
        setPageState(prev => ({
          ...prev,
          error: result.error || 'Failed to add comment',
          submittingComment: false,
        }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setPageState(prev => ({
        ...prev,
        error: error.message || 'Failed to add comment',
        submittingComment: false,
      }));
    } finally {
      isSubmittingComment.current = false;
    }
  }, [token, id, userId, pageState.newComment]);

  // ========== HANDLE DELETE COMMENT ==========
  const handleDeleteComment = useCallback(async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await api.deleteComment(token, commentId);

      setPageState(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentId),
        error: null,
      }));
    } catch (error) {
      console.error('Error deleting comment:', error);
      setPageState(prev => ({
        ...prev,
        error: 'Failed to delete comment',
      }));
    }
  }, [token]);

  // ========== SAFE PROPERTY ACCESSORS ==========
  const getTitle = () => pageState.article?.title || pageState.article?.article.Title || 'Untitled';

  const getContent = () =>
    pageState.article?.content || pageState.article?.article.Content || 'No content available';

  const getDescription = () =>
    pageState.article?.description || pageState.article?.article.Description || '';

  const getCategory = () =>
    pageState.article?.categoryName || pageState.article?.article.CategoryName || 'General';

  const getCreatorName = () =>
    pageState.article?.creatorName || pageState.article?.article.CreatorName || 'Anonymous';

  const getCreatorEmail = () =>
    pageState.article?.creatorEmail || pageState.article?.CreatorEmail || '';

  const getCreatedDate = () => {
    const dateStr = pageState.article?.createdDate || pageState.article?.article.CreatedDate;
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

  const getArticleType = () => pageState.article?.articleType || '';
  const getIntentType = () => pageState.article?.intentType || '';
  const getAudienceType = () => pageState.article?.audienceType || '';
  const getTags = () => pageState.article?.tags || '';

  // ========== FORMAT COMMENT DATE ==========
  const formatCommentDate = (dateStr) => {
    if (!dateStr) return 'Just now';

    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Unknown date';
    }
  };

  const { article, loading, error, liked, likeCount, comments, newComment, submittingComment } =
    pageState;

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
  if (error || !article) {
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
          {getTags() && (
            <div className="mb-4 d-flex flex-wrap gap-2">
              {getTags().split(',').map((tag, idx) => (
                <span key={idx} className="badge bg-light text-secondary border p-2 fw-normal">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="d-flex align-items-center justify-content-between mt-4 mb-5">
            <div className="d-flex gap-3">
              <button
                className={`btn ${liked ? 'btn-danger' : 'btn-outline-danger'} rounded-pill px-4`}
                onClick={handleLike}
              >
                <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'} me-2`}></i>
                {liked ? 'Liked' : 'Like'} ({likeCount})
              </button>
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

      {/* Comments Section */}
      <div className="mt-5 pt-4 border-top">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h3 className="fw-bold m-0">Comments ({comments.length})</h3>
          <button
            className="btn btn-link text-decoration-none"
            onClick={() => setPageState(prev => ({ ...prev, showComments: !prev.showComments }))}
          >
            {pageState.showComments ? 'Hide Comments' : 'Show Comments'}
          </button>
        </div>

        {pageState.showComments && (
          <div className="animate__animated animate__fadeIn">
            {userId ? (
              <form onSubmit={handleAddComment} className="mb-5">
                <textarea
                  className="form-control mb-3"
                  placeholder="Join the discussion..."
                  value={newComment}
                  onChange={(e) => setPageState(prev => ({ ...prev, newComment: e.target.value }))}
                  disabled={submittingComment}
                  rows="3"
                />
                <button
                  type="submit"
                  className="btn btn-primary rounded-pill px-4"
                  disabled={submittingComment || !newComment.trim()}
                >
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </form>
            ) : (
              <div className="alert alert-light border mb-4">
                Please <a href="/login">log in</a> to join the discussion.
              </div>
            )}

            <div className="comments-list">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="d-flex gap-3 mb-4">
                    <div
                      className="flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle bg-light text-secondary"
                      style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}
                    >
                      <i className="bi bi-person"></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center mb-1">
                        <span className="fw-bold me-2">{comment.creator?.name || comment.Creator?.Name || 'Anonymous'}</span>
                        <small className="text-muted">{formatCommentDate(comment.createdDate || comment.CreatedDate)}</small>
                        {userId && parseInt(userId) === (comment.creator?.id || comment.Creator?.Id) && (
                          <button
                            className="btn btn-link btn-sm text-danger p-0 ms-auto"
                            onClick={() => handleDeleteComment(comment.id || comment.Id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                      <div className="text-dark">
                        {comment.content || comment.Content}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted fst-italic">No comments yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div >
  );
}

export default ArticleDetail;