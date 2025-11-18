import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

function ArticleCard({ article, token }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // ========== INITIALIZE LIKE COUNT ==========
  useEffect(() => {
    if (article) {
      // Try different property names for like count
      const count = article.likeCount || article.LikeCount || article.likes?.length || 0;
      setLikeCount(count);
      console.log('Article data:', article);
    }
  }, [article]);

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
      setLoading(false);
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
        <div className="d-flex gap-3 text-muted small mb-3 align-items-center">
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
            {getCommentCount()} comments
          </span>
        </div>

        {/* Actions */}
        <div className="d-flex gap-2">
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
            <i className="bi bi-chat me-1"></i>Comments
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
            <div className="alert alert-info mb-0">
              <i className="bi bi-info-circle me-2"></i>
              Comments section coming soon...
            </div>
          </div>
        )}

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-3 small bg-light p-2 rounded" style={{ fontSize: '0.75rem' }}>
            <strong>Debug:</strong>
            <p className="mb-1">
              Keys: {Object.keys(article).slice(0, 5).join(', ')}...
            </p>
            <p className="mb-0">
              ID: {getArticleId()} | Title: {getTitle()?.substring(0, 30)}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArticleCard;