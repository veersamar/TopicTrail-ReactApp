import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, userId } = useAuth();

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

      // Fetch comments for this article
      const commentsData = await api.getComments(token, id);
      const commentsList = Array.isArray(commentsData?.comments) ? commentsData.comments : [];

      setPageState(prev => ({
        ...prev,
        article,
        comments: commentsList,
        likeCount: article.likeCount || article.LikeCount || 0,
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching article:', error);
      setPageState(prev => ({
        ...prev,
        error: error.message || 'Failed to load article',
        loading: false,
      }));
    }
  }, [id, token]);

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

  // ========== HANDLE ADD COMMENT ==========
  const handleAddComment = useCallback(async (e) => {
    e.preventDefault();

    setPageState(prev => {
      if (!prev.newComment.trim()) {
        return { ...prev, error: 'Comment cannot be empty' };
      }

      if (!userId) {
        return { ...prev, error: 'Please log in to comment' };
      }

      // Trigger async operation
      (async () => {
        try {
          const result = await api.createComment(
            token,
            id,
            prev.newComment.trim(),
            userId
          );

          console.log('Comment creation result:', result);

          if (result.success) {
            const commentObj = {
              id: result.id || Math.random(),
              content: prev.newComment,
              creator: { name: result.creatorName || 'You', id: userId },
              createdDate: new Date().toISOString(),
              likeCount: 0,
            };

            setPageState(p => ({
              ...p,
              comments: [commentObj, ...p.comments],
              newComment: '',
              submittingComment: false,
              error: null,
            }));
          } else {
            setPageState(p => ({
              ...p,
              error: result.error || 'Failed to add comment',
              submittingComment: false,
            }));
          }
        } catch (error) {
          console.error('Error adding comment:', error);
          setPageState(p => ({
            ...p,
            error: error.message || 'Failed to add comment',
            submittingComment: false,
          }));
        }
      })();

      return { ...prev, submittingComment: true, error: null };
    });
  }, [token, id, userId]); // ✅ FIX: Removed pageState.newComment from dependencies

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

  const getViewCount = () => pageState.article?.viewCount || pageState.article?.ViewCount || 0;

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
    <div className="container-lg my-4" style={{ maxWidth: '900px' }}>
      {/* Back Button */}
      <button
        className="btn btn-outline-primary mb-4"
        onClick={() => navigate('/articles')}
        style={{ borderRadius: '6px' }}
      >
        <i className="bi bi-arrow-left me-2"></i>Back to Articles
      </button>

      {/* Error Alert */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show border-0 mb-4"
          style={{ background: '#f8d7da', borderLeft: '4px solid #dc3545' }}
        >
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-circle" style={{ color: '#dc3545' }}></i>
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setPageState(prev => ({ ...prev, error: null }))}
          ></button>
        </div>
      )}

      {/* Article Header */}
      <article className="card shadow-sm border-0 mb-4" style={{ borderRadius: '8px' }}>
        <div className="card-body p-5">
          {/* Category Badge and Title */}
          <div className="mb-4 d-flex align-items-start justify-content-between gap-3">
            <div className="flex-grow-1">
              <h1
                className="mb-2"
                style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: '#2c3e50',
                  lineHeight: '1.2',
                }}
              >
                {getTitle()}
              </h1>
              <p className="text-muted lead mb-0" style={{ fontSize: '1.1rem' }}>
                {getDescription()}
              </p>
            </div>
            <span
              className="badge"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: '20px',
                whiteSpace: 'nowrap',
              }}
            >
              {getCategory()}
            </span>
          </div>

          {/* Article Meta Information */}
          <div
            className="d-flex flex-wrap gap-3 mb-4 pb-4 border-bottom"
            style={{ color: '#6c757d', fontSize: '0.95rem' }}
          >
            <span className="d-flex align-items-center gap-2">
              <i className="bi bi-person-circle" style={{ fontSize: '1.1rem' }}></i>
              <div>
                <strong>{getCreatorName()}</strong>
                {getCreatorEmail() && <small className="d-block text-muted">{getCreatorEmail()}</small>}
              </div>
            </span>
            <span className="d-flex align-items-center gap-2">
              <i className="bi bi-calendar-event" style={{ fontSize: '1.1rem' }}></i>
              {getCreatedDate()}
            </span>
            <span className="d-flex align-items-center gap-2">
              <i className="bi bi-eye" style={{ fontSize: '1.1rem' }}></i>
              {getViewCount()} views
            </span>
            <span className="d-flex align-items-center gap-2">
              <i className="bi bi-chat" style={{ fontSize: '1.1rem' }}></i>
              {comments.length} comments
            </span>
          </div>

          {/* Article Type, Intent, Audience */}
          {(getArticleType() || getIntentType() || getAudienceType()) && (
            <div className="mb-4 p-3 bg-light" style={{ borderRadius: '6px' }}>
              <div className="row g-3 small">
                {getArticleType() && (
                  <div className="col-md-4">
                    <strong style={{ color: '#667eea' }}>Article Type</strong>
                    <p className="text-muted mb-0">{getArticleType()}</p>
                  </div>
                )}
                {getIntentType() && (
                  <div className="col-md-4">
                    <strong style={{ color: '#667eea' }}>Intent</strong>
                    <p className="text-muted mb-0">{getIntentType()}</p>
                  </div>
                )}
                {getAudienceType() && (
                  <div className="col-md-4">
                    <strong style={{ color: '#667eea' }}>Audience</strong>
                    <p className="text-muted mb-0">{getAudienceType()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Article Actions */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            <button
              className={`btn btn-sm ${liked ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={handleLike}
              style={{ borderRadius: '6px' }}
            >
              <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'} me-1`}></i>
              {likeCount}
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setPageState(prev => ({ ...prev, showComments: !prev.showComments }))}
              style={{ borderRadius: '6px' }}
            >
              <i className="bi bi-chat me-1"></i>
              {pageState.showComments ? 'Hide' : 'Show'} Comments
            </button>
            <button
              className="btn btn-sm btn-outline-secondary ms-auto"
              style={{ borderRadius: '6px' }}
            >
              <i className="bi bi-share me-1"></i>Share
            </button>
          </div>

          {/* Tags */}
          {getTags() && (
            <div className="mb-4">
              <small className="text-muted d-block mb-2">
                <i className="bi bi-tags me-1"></i>Tags:
              </small>
              <div className="d-flex flex-wrap gap-2">
                {getTags()
                  .split(',')
                  .map((tag, idx) => (
                    <span
                      key={idx}
                      className="badge"
                      style={{
                        background: '#f0f4ff',
                        color: '#667eea',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                      }}
                    >
                      {tag.trim()}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Article Content */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '8px' }}>
        <div className="card-body p-5">
          <div
            style={{
              fontSize: '1.05rem',
              lineHeight: '1.8',
              color: '#333',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
          >
            {getContent()}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {pageState.showComments && (
        <div className="card shadow-sm border-0" style={{ borderRadius: '8px' }}>
          <div className="card-body p-5">
            <h4 className="mb-4 fw-600" style={{ color: '#2c3e50' }}>
              <i className="bi bi-chat-dots me-2" style={{ color: '#667eea' }}></i>
              Comments ({comments.length})
            </h4>

            {/* Add Comment Form */}
            {userId ? (
              <form onSubmit={handleAddComment} className="mb-4">
                <div className="mb-3">
                  <textarea
                    className="form-control"
                    placeholder="Share your thoughts..."
                    value={newComment}
                    onChange={(e) => setPageState(prev => ({ ...prev, newComment: e.target.value }))}
                    disabled={submittingComment}
                    rows="3"
                    maxLength="500"
                    style={{ borderRadius: '6px' }}
                  />
                  <small className="text-muted d-block mt-2">
                    {newComment.length}/500 characters
                  </small>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submittingComment || !newComment.trim()}
                  style={{
                    borderRadius: '6px',
                    background: submittingComment
                      ? '#ccc'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                  }}
                >
                  {submittingComment ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Posting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send me-1"></i>
                      Post Comment
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div
                className="alert alert-info border-0 mb-4"
                style={{ background: '#d1ecf1', borderLeft: '4px solid #17a2b8' }}
              >
                <i className="bi bi-info-circle me-2" style={{ color: '#17a2b8' }}></i>
                <a href="/login" className="alert-link">
                  Log in
                </a>
                {' '}to comment on this article
              </div>
            )}

            {/* Comments List */}
            {comments.length > 0 ? (
              <div className="comments-list">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="card card-sm mb-3 border-0"
                    style={{
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      borderLeft: '3px solid #667eea',
                    }}
                  >
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <strong style={{ color: '#2c3e50' }}>
                              {comment.creator?.name || comment.Creator?.Name || 'Anonymous'}
                            </strong>
                            <small className="text-muted">
                              {formatCommentDate(comment.createdDate || comment.CreatedDate)}
                            </small>
                          </div>
                          <p className="small mb-0" style={{ color: '#555', lineHeight: '1.5' }}>
                            {comment.content || comment.Content}
                          </p>
                        </div>
                        {userId && parseInt(userId) === (comment.creator?.id || comment.Creator?.Id) && (
                          <button
                            className="btn btn-link btn-sm text-danger p-0 ms-2"
                            onClick={() => handleDeleteComment(comment.id || comment.Id)}
                            title="Delete comment"
                            style={{ textDecoration: 'none' }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="alert alert-info border-0"
                style={{ background: '#d1ecf1', borderLeft: '4px solid #17a2b8' }}
              >
                <i className="bi bi-chat-left-text me-2" style={{ color: '#17a2b8' }}></i>
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ArticleDetail;