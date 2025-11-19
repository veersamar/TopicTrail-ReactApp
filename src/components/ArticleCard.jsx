import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

function ArticleCard({ article, token }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [likedComments, setLikedComments] = useState(new Set());

  // ========== INITIALIZE ==========
  useEffect(() => {
    if (article) {
      const count = article.likeCount || article.LikeCount || article.likes?.length || 0;
      setLikeCount(count);
      
      // Get userId from localStorage (set during login)
      const storedUserId = 3;//localStorage.getItem('userId');
      setUserId(storedUserId);
      
      console.log('Article data:', article);
    }
  }, [article]);

  // ========== FETCH COMMENTS WHEN TOGGLED ==========
  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments();
    }
  }, [showComments]);

  // ========== FETCH COMMENTS ==========
  const fetchComments = async () => {
    try {
      setCommentLoading(true);
      const articleId = getArticleId();
      
      // Get comments for an article      
      const commentsDetail = await api.getComments(token, articleId);      
      if (commentsDetail) {
        setComments(Array.isArray(commentsDetail.comments) ? commentsDetail.comments : []);      
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setCommentLoading(false);
    }
  };

  // ========== ADD NEW COMMENT ==========
  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (!userId) {
      setError('You must be logged in to comment');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const articleId = getArticleId();
      
      // Call API to add comment
      const result = await api.createComment(token, articleId, 
        newComment.trim(),
        parseInt(userId)
      );

      if (result) {
        // Add the new comment to the list
        const commentObj = {
          id: result.id || Math.random(),
          content: newComment,
          creator: {
            name: result.creatorName || 'You',
            email: result.creatorEmail || ''
          },
          createdDate: new Date().toISOString(),
          likeCount: 0
        };
        
        setComments([commentObj, ...comments]);
        setNewComment('');
        setError(null);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  // ========== DELETE COMMENT ==========
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      setLoading(true);
      await api.deleteComment(token, commentId);
      setComments(comments.filter(c => c.id !== commentId));
      setError(null);
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    } finally {
      setLoading(false);
    }
  };

  // ========== SAFE PROPERTY ACCESSORS ==========
  const getTitle = () => {
    return article?.title || article?.Title || 'Untitled Article';
  };

  const getDescription = () => {
    return article?.description || article?.Description || 'No description available';
  };

  const getCategory = () => {
    return article?.categoryName || 
           article?.CategoryName || 
           article?.category || 
           article?.Category || 
           'General';
  };

  const getCreatorName = () => {
    return article?.creatorName || 
           article?.CreatorName || 
           article?.creator?.name || 
           article?.Creator?.Name || 
           'Anonymous';
  };

  const getCreatedDate = () => {
    const dateStr = article?.createdDate || article?.CreatedDate;
    if (!dateStr) return 'Unknown date';
    
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.error('Date parsing error:', err);
      return 'Unknown date';
    }
  };

  const getViewCount = () => {
    return article?.viewCount || article?.ViewCount || 0;
  };

  const getCommentCount = () => {
    return article?.commentCount || 
           article?.CommentCount || 
           article?.comments?.length || 
           0;
  };

  const getArticleId = () => {
    return article?.id || article?.Id;
  };

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
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (err) {
      return 'Unknown date';
    }
  };

  // ========== HANDLE LIKE ==========
  const handleLike = async () => {
    try {
      setError(null);
      setLoading(true);

      const articleId = getArticleId();
      if (!articleId) {
        throw new Error('Article ID is missing');
      }

      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const newLiked = !liked;

      if (newLiked) {
        await api.likeArticle(token, articleId);
        setLikeCount(prev => prev + 1);
        setLiked(true);
      } else {
        await api.unlikeArticle(token, articleId);
        setLikeCount(prev => Math.max(0, prev - 1));
        setLiked(false);
      }
    } catch (error) {
      console.error('Like/Unlike error:', error);
      setError(error.message || 'Failed to update like');
    } finally {
      setLoading(false);
    }
  };

  // ========== VALIDATE ARTICLE DATA ==========
  if (!article || typeof article !== 'object') {
    return (
      <div className="card article-card">
        <div className="card-body">
          <div className="alert alert-warning mb-0">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Invalid article data
          </div>
        </div>
      </div>
    );
  }

  // ========== RENDER COMPONENT ==========
  return (
    <div className="card article-card shadow-sm">
      <div className="card-body">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError(null)}
            ></button>
          </div>
        )}

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            <h5 className="card-title mb-1">
              <a href={`/articles/${getArticleId()}`} className="text-decoration-none">
                {getTitle()}
              </a>
            </h5>
            <p className="card-text text-muted small mb-0">
              {getDescription().substring(0, 100)}
              {getDescription().length > 100 ? '...' : ''}
            </p>
          </div>
          <span className="badge bg-primary ms-2">
            {getCategory()}
          </span>
        </div>

        {/* Creator and Meta Info */}
        <div className="d-flex gap-3 text-muted small mb-3 align-items-center flex-wrap">
          <span className="d-flex align-items-center">
            <i className="bi bi-person-circle me-1"></i>
            {getCreatorName()}
          </span>
          <span className="d-flex align-items-center">
            <i className="bi bi-calendar-event me-1"></i>
            {getCreatedDate()}
          </span>
          <span className="d-flex align-items-center">
            <i className="bi bi-eye me-1"></i>
            {getViewCount()} views
          </span>
          <span className="d-flex align-items-center">
            <i className="bi bi-chat me-1"></i>
            {comments.length || getCommentCount()} comments
          </span>
        </div>

        {/* Actions */}
        <div className="d-flex gap-2 mb-3">
          <button
            className={`btn btn-sm ${liked ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={handleLike}
            disabled={loading}
          >
            <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'} me-1`}></i>
            {likeCount}
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowComments(!showComments)}
          >
            <i className="bi bi-chat me-1"></i>
            {showComments ? 'Hide' : 'Show'} Comments
          </button>
          <a 
            href={`/articles/${getArticleId()}`}
            className="btn btn-sm btn-outline-primary"
          >
            <i className="bi bi-eye me-1"></i>Read Full
          </a>
          <button className="btn btn-sm btn-outline-secondary ms-auto">
            <i className="bi bi-share me-1"></i>Share
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-3 pt-3 border-top">
            <h6 className="mb-3">
              <i className="bi bi-chat-dots me-2"></i>
              Comments ({comments.length})
            </h6>

            {/* Add Comment Form */}
            {userId && (
              <form onSubmit={handleAddComment} className="mb-4">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={loading}
                    maxLength="500"
                  />
                  <button
                    className="btn btn-sm btn-primary"
                    type="submit"
                    disabled={loading || !newComment.trim()}
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
                <small className="text-muted d-block mt-1">
                  {newComment.length}/500 characters
                </small>
              </form>
            )}

            {!userId && (
              <div className="alert alert-info small mb-3">
                <i className="bi bi-info-circle me-2"></i>
                Please log in to comment
              </div>
            )}

            {/* Loading State */}
            {commentLoading && (
              <div className="text-center">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading comments...</span>
                </div>
              </div>
            )}

            {/* Comments List */}
            {!commentLoading && comments.length > 0 ? (
              <div className="comments-list">
                {comments.map(comment => (
                  <div key={comment.id} className="card card-sm mb-2">
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <strong className="small">
                              {comment.creator || comment.Creator || 'Anonymous'}
                            </strong>
                            <small className="text-muted">
                              {formatCommentDate(comment.createdDate || comment.CreatedDate)}
                            </small>
                          </div>
                          <p className="small mb-0">
                            {comment.content || comment.Content}
                          </p>
                        </div>
                        {userId && parseInt(userId) === (comment.creator?.id || comment.Creator?.Id) && (
                          <button
                            className="btn btn-link btn-sm text-danger p-0"
                            onClick={() => handleDeleteComment(comment.id || comment.Id)}
                            disabled={loading}
                            title="Delete comment"
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
                <div className="alert alert-info small mb-0">
                  <i className="bi bi-chat-left-text me-2"></i>
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