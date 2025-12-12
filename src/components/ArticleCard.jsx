import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function ArticleCard({ article, token, onRefresh }) {
  const { userId } = useAuth();

  // ========== STATE ==========
  const [cardState, setCardState] = useState({
    liked: false,
    likeCount: 0,
    showComments: false,
    comments: [],
    newComment: '',
    error: null,
    loading: false,
    commentLoading: false,
  });

  // ========== INITIALIZE ==========
  useEffect(() => {
    if (article) {
      const count = article.likeCount || article.LikeCount || article.likes?.length || 0;
      setCardState(prev => ({
        ...prev,
        likeCount: count,
      }));
    }
  }, [article]);

  // ========== FETCH COMMENTS WHEN TOGGLED ==========
  useEffect(() => {
    if (cardState.showComments && cardState.comments.length === 0) {
      fetchComments();
    }
  }, [cardState.showComments]);

  // ========== FETCH COMMENTS ==========
  const fetchComments = useCallback(async () => {
    try {
      setCardState(prev => ({ ...prev, commentLoading: true, error: null }));
      const articleId = getArticleId();

      const commentsDetail = await api.getComments(token, articleId);
      const commentsList = Array.isArray(commentsDetail?.comments) ? commentsDetail.comments : [];

      setCardState(prev => ({
        ...prev,
        comments: commentsList,
        commentLoading: false,
      }));
    } catch (err) {
      console.error('Error fetching comments:', err);
      setCardState(prev => ({
        ...prev,
        error: 'Failed to load comments',
        commentLoading: false,
      }));
    }
  }, [token]);

  // ========== ADD NEW COMMENT ==========
  const handleAddComment = useCallback(async (e) => {
    e.preventDefault();

    if (!cardState.newComment.trim()) {
      setCardState(prev => ({
        ...prev,
        error: 'Comment cannot be empty',
      }));
      return;
    }

    if (!userId) {
      setCardState(prev => ({
        ...prev,
        error: 'You must be logged in to comment',
      }));
      return;
    }

    try {
      setCardState(prev => ({ ...prev, loading: true, error: null }));
      const articleId = getArticleId();

      const result = await api.createComment(
        token,
        articleId,
        cardState.newComment.trim(),
        userId
      );

      console.log('Comment creation result:', result);

      // Check if comment was created successfully
      if (result.success) {
        const commentObj = {
          id: result.id || Math.random(),
          content: cardState.newComment,
          creator: { name: result.creatorName || 'You', id: userId },
          createdDate: new Date().toISOString(),
          likeCount: 0,
        };

        setCardState(prev => ({
          ...prev,
          comments: [commentObj, ...prev.comments],
          newComment: '',
          loading: false,
          error: null,
        }));
      } else {
        // Comment creation failed
        setCardState(prev => ({
          ...prev,
          error: result.error || 'Failed to add comment',
          loading: false,
        }));
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setCardState(prev => ({
        ...prev,
        error: err.message || 'Failed to add comment',
        loading: false,
      }));
    }
  }, [cardState.newComment, userId, token]);

  // ========== DELETE COMMENT ==========
  const handleDeleteComment = useCallback(async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      setCardState(prev => ({ ...prev, loading: true }));
      await api.deleteComment(token, commentId);

      setCardState(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentId),
        loading: false,
        error: null,
      }));
    } catch (err) {
      console.error('Error deleting comment:', err);
      setCardState(prev => ({
        ...prev,
        error: 'Failed to delete comment',
        loading: false,
      }));
    }
  }, [token]);

  // ========== HANDLE LIKE ==========
  const handleLike = useCallback(async () => {
    try {
      setCardState(prev => ({ ...prev, error: null, loading: true }));

      const articleId = getArticleId();
      if (!articleId || !token || !userId) {
        throw new Error('Missing required data');
      }

      const newLiked = !cardState.liked;

      if (newLiked) {
        await api.likeArticle(token, articleId, userId);
        setCardState(prev => ({
          ...prev,
          likeCount: prev.likeCount + 1,
          liked: true,
          loading: false,
        }));
      } else {
        await api.unlikeArticle(token, articleId, userId);
        setCardState(prev => ({
          ...prev,
          likeCount: Math.max(0, prev.likeCount - 1),
          liked: false,
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Like/Unlike error:', error);
      setCardState(prev => ({
        ...prev,
        error: error.message || 'Failed to update like',
        loading: false,
      }));
    }
  }, [cardState.liked, token, userId]);

  // ========== SAFE PROPERTY ACCESSORS ==========
  const getTitle = () => article?.title || article?.Title || 'Untitled Article';

  const getDescription = () =>
    article?.description || article?.Description || 'No description available';

  const getCategory = () =>
    article?.categoryName || article?.CategoryName || article?.category || article?.Category || 'General';

  const getCreatorName = () =>
    article?.creatorName || article?.CreatorName || article?.creator?.name || 'Anonymous';

  const getCreatedDate = () => {
    const dateStr = article?.createdDate || article?.CreatedDate;
    if (!dateStr) return 'Unknown date';

    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  const getViewCount = () => article?.viewCount || article?.ViewCount || 0;
  const getCommentCount = () => article?.commentCount || article?.CommentCount || 0;

  const getArticleId = () => article?.id || article?.Id;

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

  // ========== VALIDATE ARTICLE DATA ==========
  if (!article || typeof article !== 'object') {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-warning mb-0">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Invalid article data
          </div>
        </div>
      </div>
    );
  }

  const { liked, likeCount, showComments, comments, newComment, error, loading, commentLoading } = cardState;

  // ========== RENDER COMPONENT ==========
  return (
    <div
      className="card shadow-sm border-0"
      style={{
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
      }}
    >
      <div className="card-body p-4">
        {/* Error Alert */}
        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show mb-3 border-0"
            role="alert"
            style={{ background: '#f8d7da', borderLeft: '4px solid #dc3545' }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-circle" style={{ color: '#dc3545' }}></i>
              <span className="small">{error}</span>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setCardState(prev => ({ ...prev, error: null }))}
            ></button>
          </div>
        )}

        {/* Header with Badge */}
        <div className="d-flex justify-content-between align-items-start mb-3 gap-2">
          <div className="flex-grow-1">
            <h5 className="card-title mb-2" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              <Link
                to={`/articles/${getArticleId()}`}
                className="text-decoration-none"
                style={{ color: 'var(--text-primary)', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              >
                {getTitle()}
              </Link>
            </h5>
            <p className="card-text text-muted small mb-0" style={{ lineHeight: 1.5 }}>
              {getDescription().substring(0, 100)}
              {getDescription().length > 100 ? '...' : ''}
            </p>
          </div>
          <div className="d-flex flex-column gap-2 align-items-end">
            <span
              className="badge"
              style={{
                background: 'rgba(	124, 58, 237, 0.1)',
                color: 'var(--secondary-dark)',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                whiteSpace: 'nowrap',
                fontWeight: 600
              }}
            >
              {getCategory()}
            </span>
            {article.visibility === 'Private' && (
              <span
                className="badge"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--danger-color)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <i className="bi bi-lock-fill" style={{ fontSize: '0.7rem' }}></i> Private
              </span>
            )}
          </div>
        </div>

        {/* Meta Information */}
        <div
          className="d-flex gap-3 text-muted small mb-3 align-items-center flex-wrap"
          style={{ fontSize: '0.875rem' }}
        >
          <span className="d-flex align-items-center gap-1">
            <i className="bi bi-person-circle" style={{ fontSize: '1rem', color: 'var(--primary-light)' }}></i>
            {getCreatorName()}
          </span>
          <span className="d-flex align-items-center gap-1">
            <i className="bi bi-calendar-event" style={{ fontSize: '1rem', color: 'var(--text-tertiary)' }}></i>
            {getCreatedDate()}
          </span>
          <span className="d-flex align-items-center gap-1">
            <i className="bi bi-eye" style={{ fontSize: '1rem', color: 'var(--text-tertiary)' }}></i>
            {getViewCount()} views
          </span>
          <span className="d-flex align-items-center gap-1">
            <i className="bi bi-chat" style={{ fontSize: '1rem', color: 'var(--text-tertiary)' }}></i>
            {comments.length || getCommentCount()} comments
          </span>
        </div>

        {/* Actions */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
          <button
            className={`btn btn-sm ${liked ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={handleLike}
            disabled={loading}
            style={{
              borderRadius: '6px',
              transition: 'all 0.2s',
              fontSize: '0.875rem',
            }}
          >
            <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'} me-1`}></i>
            {likeCount}
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setCardState(prev => ({ ...prev, showComments: !prev.showComments }))}
            style={{
              borderRadius: '6px',
              transition: 'all 0.2s',
              fontSize: '0.875rem',
            }}
          >
            <i className="bi bi-chat me-1"></i>
            {showComments ? 'Hide' : 'Show'} Comments
          </button>
          <Link
            to={`/articles/${getArticleId()}`}
            className="btn btn-sm btn-outline-primary"
            style={{
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          >
            <i className="bi bi-eye me-1"></i>Read Full
          </Link>
          <button
            className="btn btn-sm btn-outline-secondary ms-auto"
            style={{
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          >
            <i className="bi bi-share me-1"></i>Share
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-top">
            <h6 className="mb-3 fw-600" style={{ color: '#2c3e50' }}>
              <i className="bi bi-chat-dots me-2" style={{ color: '#667eea' }}></i>
              Comments ({comments.length})
            </h6>

            {/* Add Comment Form */}
            {userId && (
              <form onSubmit={handleAddComment} className="mb-4">
                <div className="input-group input-group-sm" style={{ borderRadius: '6px', overflow: 'hidden' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setCardState(prev => ({ ...prev, newComment: e.target.value }))}
                    disabled={loading}
                    maxLength="500"
                    style={{ borderRadius: '6px 0 0 6px' }}
                  />
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={loading || !newComment.trim()}
                    style={{
                      borderRadius: '0 6px 6px 0',
                      background: loading || !newComment.trim() ? '#ccc' : '#667eea',
                      border: 'none',
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Posting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-1"></i>
                        Post
                      </>
                    )}
                  </button>
                </div>
                <small className="text-muted d-block mt-2">
                  {newComment.length}/500 characters
                </small>
              </form>
            )}

            {!userId && (
              <div className="alert alert-info small mb-3 border-0" style={{ background: '#d1ecf1', borderLeft: '4px solid #17a2b8' }}>
                <i className="bi bi-info-circle me-2" style={{ color: '#17a2b8' }}></i>
                Please log in to comment
              </div>
            )}

            {/* Loading State */}
            {commentLoading && (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            {/* Comments List */}
            {!commentLoading && comments.length > 0 ? (
              <div className="comments-list">
                {comments.map(comment => (
                  <div
                    key={comment.id}
                    className="card card-sm mb-2 border-0"
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
                            <strong className="small" style={{ color: '#2c3e50' }}>
                              {comment.creator || comment.Creator || 'Anonymous'}
                            </strong>
                            <small className="text-muted">
                              {formatCommentDate(comment.createdDate || comment.CreatedDate)}
                            </small>
                          </div>
                          <p className="small mb-0" style={{ color: '#555' }}>
                            {comment.content || comment.Content}
                          </p>
                        </div>
                        {userId && parseInt(userId) === (comment.creator?.id || comment.Creator?.Id) && (
                          <button
                            className="btn btn-link btn-sm text-danger p-0 ms-2"
                            onClick={() => handleDeleteComment(comment.id || comment.Id)}
                            disabled={loading}
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
              !commentLoading && (
                <div className="alert alert-info small mb-0 border-0" style={{ background: '#d1ecf1' }}>
                  <i className="bi bi-chat-left-text me-2" style={{ color: '#17a2b8' }}></i>
                  No comments yet. Be the first to comment!
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArticleCard;