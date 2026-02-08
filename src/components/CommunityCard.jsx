import React from 'react';
import { Link } from 'react-router-dom';

function CommunityCard({ community }) {
  const getId = () => community?.id || community?.Id;
  const getSlug = () => community?.slug || community?.Slug || getId();
  const getName = () => community?.name || community?.Name || 'Untitled Community';
  const getDescription = () => community?.description || community?.Description || '';
  const getMemberCount = () => community?.memberCount || community?.MemberCount || 0;
  // API returns PostCount instead of ArticleCount
  const getArticleCount = () => community?.articleCount || community?.ArticleCount || community?.postCount || community?.PostCount || 0;
  // API returns IsPrivate (inverted logic) instead of IsPublic
  const getIsPublic = () => {
    if (community?.isPublic !== undefined) return community.isPublic;
    if (community?.IsPublic !== undefined) return community.IsPublic;
    if (community?.isPrivate !== undefined) return !community.isPrivate;
    if (community?.IsPrivate !== undefined) return !community.IsPrivate;
    return true;
  };
  // API returns Creator object: { Id, Name, ProfileImageUrl }
  const getCreatorName = () => {
    return community?.creatorName || community?.CreatorName || 
           community?.creator?.name || community?.Creator?.Name ||
           community?.owner?.name || community?.Owner?.Name || 'Unknown';
  };
  const getCreatedDate = () => {
    const d = community?.createdDate || community?.CreatedDate || community?.createdAt || community?.CreatedAt;
    if (!d) return '';
    return new Date(d).toLocaleDateString();
  };
  // API returns CurrentUserMembership object or null
  const getMembership = () => community?.currentUserMembership || community?.CurrentUserMembership;
  const getIsMember = () => {
    const membership = getMembership();
    if (membership) return true;
    return community?.isMember ?? community?.IsMember ?? false;
  };
  const getUserRole = () => {
    const membership = getMembership();
    if (membership) return membership.role || membership.Role || 'Member';
    return community?.userRole || community?.UserRole || null;
  };

  return (
    <div className="card h-100 border-0 shadow-sm">
      <div className="card-body">
        {/* Header with visibility badge */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title mb-0">
            <Link 
              to={`/communities/${getSlug()}`} 
              className="text-decoration-none text-dark"
            >
              {getName()}
            </Link>
          </h5>
          <div className="d-flex gap-1">
            {getIsMember() && (
              <span className="badge bg-success" style={{ fontSize: '0.7rem' }}>
                {getUserRole() || 'Member'}
              </span>
            )}
            <span 
              className={`badge ${getIsPublic() ? 'bg-info' : 'bg-secondary'}`} 
              style={{ fontSize: '0.7rem' }}
            >
              {getIsPublic() ? 'Public' : 'Private'}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="card-text text-muted small mb-3" style={{ 
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {getDescription() || 'No description available.'}
        </p>

        {/* Stats */}
        <div className="d-flex gap-3 text-muted small mb-3">
          <span>
            <i className="bi bi-people me-1"></i>
            {getMemberCount()} members
          </span>
          <span>
            <i className="bi bi-file-text me-1"></i>
            {getArticleCount()} articles
          </span>
        </div>

        {/* Footer */}
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            Created by <span style={{ color: '#0074CC' }}>{getCreatorName()}</span>
          </small>
          <Link 
            to={`/communities/${getSlug()}`} 
            className="btn btn-outline-primary btn-sm"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CommunityCard;
