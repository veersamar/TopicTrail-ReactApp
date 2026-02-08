import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Badge, Button } from './ui';

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

  const isPoll = () => {
    const typeId = getArticleType();
    const pollTypeObj = articleTypes.find(t =>
      (t.name || t.Name || '').toLowerCase() === 'poll'
    );
    if (pollTypeObj) {
      const pollTypeId = pollTypeObj.id || pollTypeObj.Id || pollTypeObj.value || pollTypeObj.Value;
      return parseInt(typeId, 10) === parseInt(pollTypeId, 10);
    }
    const typeName = article?.articleTypeName || article?.ArticleTypeName || '';
    return typeName.toLowerCase() === 'poll';
  };

  const getArticleLink = () => {
    if (isPoll()) {
      const pollId = getPollId();
      return `/poll/${pollId || getArticleId()}`;
    }
    return `/articles/${getArticleId()}`;
  };

  const getEditLink = () => {
    if (isPoll()) {
      return null;
    }
    return `/edit-article/${getArticleId()}`;
  };

  const creatorId = getCreatorId();
  const isOwner = isAssumedOwner || (userId && creatorId && String(userId) === String(creatorId));

  const answersCount = getCommentsCount();
  const hasAnswers = answersCount > 0;

  return (
    <article className="article-card">
      {/* Stats Column */}
      <div className="article-card__stats">
        <div className="article-card__stat">
          <span className="article-card__stat-value">{getLikes()}</span>
          <span className="article-card__stat-label">{isPoll() ? 'responses' : 'votes'}</span>
        </div>
        <div className={`article-card__stat ${hasAnswers ? 'article-card__stat--success' : ''}`}>
          <span className="article-card__stat-value">{answersCount}</span>
          <span className="article-card__stat-label">answers</span>
        </div>
        <div className="article-card__stat article-card__stat--muted">
          <span className="article-card__stat-value">{getViews()}</span>
          <span className="article-card__stat-label">views</span>
        </div>
      </div>

      {/* Content Column */}
      <div className="article-card__content">
        <h3 className="article-card__title">
          {isPoll() && <Badge variant="primary" size="sm" className="mr-2">POLL</Badge>}
          <Link to={getArticleLink()} className="article-card__link">
            {getTitle()}
          </Link>
        </h3>

        <p className="article-card__excerpt">
          {getDescription().substring(0, 200)}...
        </p>

        <div className="article-card__footer">
          <div className="article-card__tags">
            <Badge variant="secondary">{getCategory().toLowerCase()}</Badge>
            {isPoll() && <Badge variant="accent">poll</Badge>}
          </div>

          <div className="article-card__meta">
            {isOwner && getEditLink() && (
              <Link to={getEditLink()} className="article-card__edit-link">
                Edit
              </Link>
            )}
            <span className="article-card__author">{getCreator()}</span>
            <span className="article-card__date">
              {isPoll() ? 'created' : 'asked'} {getDate()}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ArticleCard;