import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function CommunityMembers({ 
  communityId, 
  isOwner = false, 
  isAdmin = false,
  onMemberUpdated 
}) {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingMember, setUpdatingMember] = useState(null);

  const canManageMembers = isOwner || isAdmin;

  useEffect(() => {
    const fetchMembers = async () => {
      if (!communityId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await api.getCommunityMembers(token, communityId);
        console.log('Community members API result:', result);
        if (result.success) {
          setMembers(result.members);
        } else {
          setError(result.error || 'Failed to load members');
        }
      } catch (err) {
        setError('Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [communityId, token]);

  const handleRoleChange = async (memberId, newRole) => {
    setUpdatingMember(memberId);
    try {
      const result = await api.updateMemberRole(token, communityId, memberId, newRole);
      if (result.success) {
        setMembers(prev => prev.map(m => 
          (m.id || m.Id || m.userId || m.UserId) === memberId 
            ? { ...m, role: newRole, Role: newRole }
            : m
        ));
        onMemberUpdated?.();
      } else {
        alert(result.error || 'Failed to update role');
      }
    } catch (err) {
      alert('Failed to update role');
    } finally {
      setUpdatingMember(null);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the community?`)) {
      return;
    }

    setUpdatingMember(memberId);
    try {
      const result = await api.removeCommunityMember(token, communityId, memberId);
      if (result.success) {
        setMembers(prev => prev.filter(m => 
          (m.id || m.Id || m.userId || m.UserId) !== memberId
        ));
        onMemberUpdated?.();
      } else {
        alert(result.error || 'Failed to remove member');
      }
    } catch (err) {
      alert('Failed to remove member');
    } finally {
      setUpdatingMember(null);
    }
  };

  const getRoleBadgeClass = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'owner') return 'bg-warning text-dark';
    if (r === 'admin') return 'bg-danger';
    if (r === 'moderator') return 'bg-info';
    return 'bg-secondary';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger py-2 small">{error}</div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-muted small text-center py-3">No members found</div>
    );
  }

  return (
    <div className="members-list">
      {members.map((member) => {
        const memberId = member.id || member.Id || member.userId || member.UserId;
        const memberName = member.userName || member.UserName || member.name || member.Name || 'Unknown';
        const memberRole = member.role || member.Role || 'Member';
        // API returns JoinedAt
        const joinedDate = member.joinedAt || member.JoinedAt || member.joinedDate || member.JoinedDate || member.createdDate || member.CreatedDate;
        const isOwnerMember = memberRole.toLowerCase() === 'owner';

        return (
          <div 
            key={memberId} 
            className="d-flex align-items-center justify-content-between py-2 border-bottom"
          >
            <div className="d-flex align-items-center gap-2">
              {/* Avatar */}
              <div 
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36, fontSize: '0.875rem' }}
              >
                {memberName.charAt(0).toUpperCase()}
              </div>
              
              {/* Info */}
              <div>
                <div className="fw-medium small">{memberName}</div>
                {joinedDate && (
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Joined {new Date(joinedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              {/* Role Badge */}
              <span className={`badge ${getRoleBadgeClass(memberRole)}`} style={{ fontSize: '0.7rem' }}>
                {memberRole}
              </span>

              {/* Admin Actions */}
              {canManageMembers && !isOwnerMember && (
                <div className="dropdown">
                  <button 
                    className="btn btn-sm btn-outline-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    disabled={updatingMember === memberId}
                    style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem' }}
                  >
                    {updatingMember === memberId ? (
                      <span className="spinner-border spinner-border-sm" />
                    ) : (
                      '⋯'
                    )}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    {isOwner && memberRole.toLowerCase() !== 'admin' && (
                      <li>
                        <button 
                          className="dropdown-item small"
                          onClick={() => handleRoleChange(memberId, 'Admin')}
                        >
                          Make Admin
                        </button>
                      </li>
                    )}
                    {isOwner && memberRole.toLowerCase() === 'admin' && (
                      <li>
                        <button 
                          className="dropdown-item small"
                          onClick={() => handleRoleChange(memberId, 'Member')}
                        >
                          Remove Admin
                        </button>
                      </li>
                    )}
                    {memberRole.toLowerCase() !== 'moderator' && (
                      <li>
                        <button 
                          className="dropdown-item small"
                          onClick={() => handleRoleChange(memberId, 'Moderator')}
                        >
                          Make Moderator
                        </button>
                      </li>
                    )}
                    {memberRole.toLowerCase() === 'moderator' && (
                      <li>
                        <button 
                          className="dropdown-item small"
                          onClick={() => handleRoleChange(memberId, 'Member')}
                        >
                          Remove Moderator
                        </button>
                      </li>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button 
                        className="dropdown-item small text-danger"
                        onClick={() => handleRemoveMember(memberId, memberName)}
                      >
                        Remove from Community
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CommunityMembers;
