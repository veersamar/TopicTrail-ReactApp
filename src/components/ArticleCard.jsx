import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function ArticleCard({ article }) {
  // We'll keep it simple for the list view. 
  // API interactions for Like/Comment are reserved for Detail view or handled simpler here if needed.
  // For now, static display of stats.

  const getArticleId = () => article?.id || article?.Id;
  const getTitle = () => article?.title || article?.Title || 'Untitled';
  const getDescription = () => article?.description || article?.Description || '';
  const getViews = () => article?.viewCount || article?.ViewCount || 0;
  const getLikes = () => article?.likeCount || article?.LikeCount || 0;
  const getCommentsCount = () => article?.commentCount || article?.CommentCount || (article?.comments?.length || 0);
  const getCategory = () => article?.categoryName || article?.CategoryName || 'General';
  const getCreator = () => article?.creatorName || article?.CreatorName || 'Anonymous';
  const getDate = () => {
    const d = article?.createdDate || article?.CreatedDate;
    if (!d) return '';
    return new Date(d).toLocaleDateString();
  };

  return (
    <div className="d-flex p-3 border-bottom article-list-item position-relative">
      {/* Stats Column */}
      <div className="d-flex flex-column gap-2 me-3 text-end small flex-shrink-0 pt-1" style={{ width: '100px', fontSize: '0.85rem' }}>
        <div className="text-secondary">
          <span className="fw-600 me-1">{getLikes()}</span>
          <span>votes</span>
        </div>
        <div className={`rounded px-1 ${getCommentsCount() > 0 ? 'border border-success text-success' : 'text-secondary'}`}>
          <span className="fw-600 me-1">{getCommentsCount()}</span>
          <span>answers</span>
        </div>
        <div className="text-warning">
          <span className="fw-600 me-1">{getViews()}</span>
          <span>views</span>
        </div>
      </div>

      {/* Content Column */}
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <h5 className="mb-1" style={{ fontSize: '1.1rem' }}>
          <Link to={`/articles/${getArticleId()}`} className="text-decoration-none text-link fw-normal">
            {getTitle()}
          </Link>
        </h5>

        <p className="small text-secondary mb-2 text-truncate-2" style={{ lineHeight: '1.4' }}>
          {getDescription().substring(0, 200)}...
        </p>

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          {/* Tags (Using Category as Tag for now) */}
          <div className="d-flex gap-1">
            <span className="badge fw-normal"
              style={{
                backgroundColor: '#E1ECF4',
                color: '#39739D',
                fontSize: '0.75rem',
                borderRadius: '4px'
              }}>
              {getCategory().toLowerCase()}
            </span>
          </div>

          {/* Meta */}
          <div className="d-flex align-items-center gap-1 small text-muted ms-auto">
            <span style={{ color: '#0074CC' }}>{getCreator()}</span>
            <span>asked {getDate()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArticleCard;