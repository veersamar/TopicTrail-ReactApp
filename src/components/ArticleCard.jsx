import React, { useState } from 'react';
import { api } from '../services/api';

function ArticleCard({ article, token }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    try {
      const newLiked = !liked;
      if (newLiked) {
        await api.likeArticle(token, article.id);
        setLikeCount(likeCount + 1);
      } else {
        await api.unlikeArticle(token, article.id);
        setLikeCount(Math.max(0, likeCount - 1));
      }
      setLiked(newLiked);
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  return (
    <div className="card article-card">
      <div className="card-body">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h5 className="card-title mb-1">{article.title}</h5>
            <p className="card-text text-muted small mb-0">{article.description}</p>
          </div>
          <span className="badge bg-primary">{article.categoryName || 'General'}</span>
        </div>

        {/* Meta Info */}
        <div className="d-flex gap-3 text-muted small mb-3">
          <span>
            <i className="bi bi-calendar-event me-1"></i>
            {new Date(article.createdDate).toLocaleDateString()}
          </span>
          <span>
            <i className="bi bi-eye me-1"></i>{article.viewCount || 0} views
          </span>
          <span>
            <i className="bi bi-chat me-1"></i>{article.commentCount || 0} comments
          </span>
        </div>

        {/* Actions */}
        <div className="d-flex gap-2">
          <button
            className={`btn btn-sm ${liked ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={handleLike}
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
          <button className="btn btn-sm btn-outline-primary ms-auto">
            <i className="bi bi-share me-1"></i>Share
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-3 pt-3 border-top">
            <p className="text-muted small">Comments coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArticleCard;