import React from 'react';
import './LoadingSkeleton.css';

function ArticlesSkeleton() {
  return (
    <div className="articles-container">
      {[1, 2, 3].map(i => (
        <div key={i} className="article-card-skeleton">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text short"></div>
          <div className="skeleton skeleton-avatar"></div>
        </div>
      ))}
    </div>
  );
}

export default ArticlesSkeleton;