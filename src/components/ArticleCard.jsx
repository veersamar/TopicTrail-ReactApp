import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function ArticleCard({ article, isAssumedOwner = false, articleTypes = [] }) {
  const { userId } = useAuth();

  const getArticleId = () => article?.id || article?.Id;
  const getCreatorId = () => article?.creatorId || article?.CreatorId || article?.creator?.id;
  const getArticleType = () => article?.articleType || article?.ArticleType;
  const getPollId = () => article?.pollId || article?.PollId;

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

  // Determine if this is a poll type
  const isPoll = () => {
    const typeId = getArticleType();
    const pollTypeObj = articleTypes.find(t =>
      (t.name || t.Name || '').toLowerCase() === 'poll'
    );
    if (pollTypeObj) {
      const pollTypeId = pollTypeObj.id || pollTypeObj.Id || pollTypeObj.value || pollTypeObj.Value;
      return parseInt(typeId, 10) === parseInt(pollTypeId, 10);
    }
    // Fallback: check article type name directly if available
    const typeName = article?.articleTypeName || article?.ArticleTypeName || '';
    return typeName.toLowerCase() === 'poll';
  };

  // Get the correct link for the article
  const getArticleLink = () => {
    if (isPoll()) {
      const pollId = getPollId();
      // If poll has a separate pollId, use it; otherwise use article id
      return `/poll/${pollId || getArticleId()}`;
    }
    return `/articles/${getArticleId()}`;
  };

  // Get edit link (polls use different edit route potentially)
  const getEditLink = () => {
    if (isPoll()) {
      return null; // Polls don't support editing for now
    }
    return `/edit-article/${getArticleId()}`;
  };

  const creatorId = getCreatorId();
  const isOwner = isAssumedOwner || (userId && creatorId && String(userId) === String(creatorId));

  // DEBUG LOG
  console.log(`ArticleCard [${getTitle()}]:`, {
    id: getArticleId(),
    userId,
    creatorId,
    isOwner,
    userIdType: typeof userId,
    creatorIdType: typeof creatorId,
    isPoll: isPoll(),
    articleType: getArticleType()
  });

  return (
    <div className="d-flex p-3 border-bottom article-list-item position-relative">
      {/* Stats Column */}
      <div className="d-flex flex-column gap-2 me-3 text-end small flex-shrink-0 pt-1" style={{ width: '100px', fontSize: '0.85rem' }}>
        <div className="text-secondary">
          <span className="fw-600 me-1">{getLikes()}</span>
          <span>{isPoll() ? 'responses' : 'votes'}</span>
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
          {isPoll() && <span className="badge bg-primary me-2" style={{ fontSize: '0.65rem' }}>POLL</span>}
          <Link to={getArticleLink()} className="text-decoration-none text-link fw-normal">
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
            {isPoll() && (
              <span className="badge fw-normal"
                style={{
                  backgroundColor: '#F0E6FF',
                  color: '#6B46C1',
                  fontSize: '0.75rem',
                  borderRadius: '4px'
                }}>
                poll
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="d-flex align-items-center gap-1 small text-muted ms-auto">
            {isOwner && getEditLink() && (
              <Link to={getEditLink()} className="text-decoration-none me-2 text-primary">
                <i className="bi bi-pencil-square me-1"></i>Edit
              </Link>
            )}
            <span style={{ color: '#0074CC' }}>{getCreator()}</span>
            <span>{isPoll() ? 'created' : 'asked'} {getDate()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArticleCard;