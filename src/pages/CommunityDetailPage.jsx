import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import CommunityMembers from '../components/CommunityMembers';
import CommunityArticles from '../components/CommunityArticles';

function CommunityDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { token, userId, isAuthenticated } = useAuth();

  // State
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('articles');
  const [joinLoading, setJoinLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '', isPublic: true });
  const [editLoading, setEditLoading] = useState(false);

  // Fetch community data
  const fetchCommunity = useCallback(async () => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.getCommunityBySlug(token, slug);
      if (result.success && result.community) {
        setCommunity(result.community);
        // Derive isPublic from IsPrivate (API uses inverted logic)
        let isPublicVal = true;
        if (result.community.isPublic !== undefined) isPublicVal = result.community.isPublic;
        else if (result.community.IsPublic !== undefined) isPublicVal = result.community.IsPublic;
        else if (result.community.isPrivate !== undefined) isPublicVal = !result.community.isPrivate;
        else if (result.community.IsPrivate !== undefined) isPublicVal = !result.community.IsPrivate;
        
        setEditData({
          name: result.community.name || result.community.Name || '',
          description: result.community.description || result.community.Description || '',
          isPublic: isPublicVal,
        });
      } else {
        setError(result.error || 'Community not found');
      }
    } catch (err) {
      console.error('Error fetching community:', err);
      setError('Failed to load community');
    } finally {
      setLoading(false);
    }
  }, [token, slug]);

  useEffect(() => {
    fetchCommunity();
  }, [fetchCommunity]);

  // Helper functions
  const getId = () => community?.id || community?.Id;
  const getName = () => community?.name || community?.Name || 'Community';
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
  // API returns Creator object: { Id, Name, ProfileImageUrl }
  const getCreatorId = () => {
    return community?.creatorId || community?.CreatorId || 
           community?.ownerId || community?.OwnerId ||
           community?.creator?.id || community?.Creator?.Id;
  };
  const getCreatorName = () => {
    return community?.creatorName || community?.CreatorName || 
           community?.ownerName || community?.OwnerName ||
           community?.creator?.name || community?.Creator?.Name || 'Unknown';
  };

  const isOwner = userId && getCreatorId() && String(userId) === String(getCreatorId());
  const isAdmin = (getUserRole() || '').toLowerCase() === 'admin';
  const isModerator = (getUserRole() || '').toLowerCase() === 'moderator';
  const canManage = isOwner || isAdmin;

  // Join/Leave handlers
  const handleJoin = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setJoinLoading(true);
    try {
      const result = await api.joinCommunity(token, getId());
      if (result.success) {
        // Optimistically update
        setCommunity(prev => ({
          ...prev,
          isMember: true,
          IsMember: true,
          userRole: 'Member',
          UserRole: 'Member',
          memberCount: (prev?.memberCount || prev?.MemberCount || 0) + 1,
          MemberCount: (prev?.memberCount || prev?.MemberCount || 0) + 1,
        }));
      } else {
        alert(result.error || 'Failed to join community');
      }
    } catch (err) {
      alert('Failed to join community');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this community?')) {
      return;
    }

    setJoinLoading(true);
    try {
      const result = await api.leaveCommunity(token, getId());
      if (result.success) {
        // Optimistically update
        setCommunity(prev => ({
          ...prev,
          isMember: false,
          IsMember: false,
          userRole: null,
          UserRole: null,
          memberCount: Math.max((prev?.memberCount || prev?.MemberCount || 1) - 1, 0),
          MemberCount: Math.max((prev?.memberCount || prev?.MemberCount || 1) - 1, 0),
        }));
      } else {
        alert(result.error || 'Failed to leave community');
      }
    } catch (err) {
      alert('Failed to leave community');
    } finally {
      setJoinLoading(false);
    }
  };

  // Edit handlers
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      // API expects isPrivate (inverted logic)
      const result = await api.updateCommunity(token, getId(), {
        name: editData.name,
        description: editData.description,
        isPrivate: !editData.isPublic,
      });
      if (result.success) {
        setCommunity(prev => ({
          ...prev,
          name: editData.name,
          Name: editData.name,
          description: editData.description,
          Description: editData.description,
          IsPrivate: !editData.isPublic,
          isPrivate: !editData.isPublic,
        }));
        setShowEditModal(false);
      } else {
        alert(result.error || 'Failed to update community');
      }
    } catch (err) {
      alert('Failed to update community');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await api.deleteCommunity(token, getId());
      if (result.success) {
        navigate('/communities');
      } else {
        alert(result.error || 'Failed to delete community');
      }
    } catch (err) {
      alert('Failed to delete community');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger d-inline-block">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
        <div className="mt-3">
          <Link to="/communities" className="btn btn-outline-primary">
            <i className="bi bi-arrow-left me-1"></i>
            Back to Communities
          </Link>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">Community not found</h4>
        <Link to="/communities" className="btn btn-outline-primary mt-3">
          Back to Communities
        </Link>
      </div>
    );
  }

  return (
    <div className="community-detail-page">
      {/* Community Header */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            {/* Left: Info */}
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-2">
                <h2 className="mb-0">{getName()}</h2>
                <span className={`badge ${getIsPublic() ? 'bg-info' : 'bg-secondary'}`}>
                  {getIsPublic() ? 'Public' : 'Private'}
                </span>
                {getIsMember() && (
                  <span className="badge bg-success">
                    {getUserRole() || 'Member'}
                  </span>
                )}
              </div>
              
              <p className="text-muted mb-3">{getDescription() || 'No description available.'}</p>
              
              <div className="d-flex gap-4 text-muted small">
                <span>
                  <i className="bi bi-people me-1"></i>
                  <strong>{getMemberCount()}</strong> members
                </span>
                <span>
                  <i className="bi bi-file-text me-1"></i>
                  <strong>{getArticleCount()}</strong> articles
                </span>
                <span>
                  Created by <span style={{ color: '#0074CC' }}>{getCreatorName()}</span>
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="d-flex gap-2 flex-shrink-0">
              {/* Join/Leave Button */}
              {isAuthenticated && !isOwner && (
                getIsMember() ? (
                  <button 
                    className="btn btn-outline-danger"
                    onClick={handleLeave}
                    disabled={joinLoading}
                  >
                    {joinLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Leaving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-right me-1"></i>
                        Leave
                      </>
                    )}
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary"
                    onClick={handleJoin}
                    disabled={joinLoading}
                  >
                    {joinLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Joining...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-plus-lg me-1"></i>
                        Join
                      </>
                    )}
                  </button>
                )
              )}

              {/* Not authenticated */}
              {!isAuthenticated && (
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/login')}
                >
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  Sign in to Join
                </button>
              )}

              {/* Manage Button */}
              {canManage && (
                <div className="dropdown">
                  <button 
                    className="btn btn-outline-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-gear me-1"></i>
                    Manage
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => setShowEditModal(true)}
                      >
                        <i className="bi bi-pencil me-2"></i>
                        Edit Community
                      </button>
                    </li>
                    {isOwner && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <button 
                            className="dropdown-item text-danger"
                            onClick={handleDelete}
                          >
                            <i className="bi bi-trash me-2"></i>
                            Delete Community
                          </button>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'articles' ? 'active' : ''}`}
            onClick={() => setActiveTab('articles')}
          >
            <i className="bi bi-file-text me-1"></i>
            Articles ({getArticleCount()})
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <i className="bi bi-people me-1"></i>
            Members ({getMemberCount()})
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === 'articles' && (
        <CommunityArticles 
          communityId={getId()} 
          isMember={getIsMember()}
        />
      )}

      {activeTab === 'members' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <CommunityMembers 
              communityId={getId()}
              isOwner={isOwner}
              isAdmin={isAdmin}
              onMemberUpdated={fetchCommunity}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Community</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                  disabled={editLoading}
                ></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="editPublicToggle"
                      checked={editData.isPublic}
                      onChange={(e) => setEditData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="editPublicToggle">
                      Public Community
                    </label>
                    <div className="form-text">
                      {editData.isPublic 
                        ? 'Anyone can view and join this community' 
                        : 'Only invited members can join'}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                    disabled={editLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityDetailPage;
