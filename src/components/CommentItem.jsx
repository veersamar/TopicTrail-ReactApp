import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import CommentReactions from './CommentReactions';

// Maximum nesting depth for UI purposes
const MAX_DEPTH = 4;

/**
 * CommentItem Component
 * Renders a single comment with nested replies, reactions, and reply functionality
 * 
 * @param {Object} props
 * @param {Object} props.comment - The comment data
 * @param {number} props.articleId - Parent article ID
 * @param {number} props.depth - Current nesting depth (0 for top-level)
 * @param {function} props.onDelete - Delete callback
 * @param {function} props.onReplyAdded - Callback when a reply is added
 * @param {function} props.onError - Error callback
 * @param {function} props.formatDate - Date formatting function
 */
function CommentItem({ 
  comment, 
  articleId, 
  depth = 0, 
  onDelete, 
  onReplyAdded,
  onError,
  formatDate 
}) {
  const { token, userId } = useAuth();
  
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [localReplies, setLocalReplies] = useState(comment.replies || comment.Replies || []);
  const [isExpanded, setIsExpanded] = useState(true);

  // Extract comment data with fallbacks for different API response formats
  const commentId = comment.id || comment.Id;
  const content = comment.content || comment.Content;
  const creatorName = comment.creator?.name || comment.Creator?.Name || comment.creator || comment.Creator || 'Anonymous';
  const creatorId = comment.creator?.id || comment.Creator?.Id || comment.userId || comment.UserId;
  const createdDate = comment.createdDate || comment.CreatedDate;
  const likeCount = comment.likeCount ?? comment.LikeCount ?? 0;
  const dislikeCount = comment.dislikeCount ?? comment.DislikeCount ?? 0;
  const currentUserReaction = comment.currentUserReaction || comment.CurrentUserReaction || null;

  // Format date
  const formattedDate = formatDate ? formatDate(createdDate) : formatCommentDate(createdDate);

  // Handle reply submission
  const handleSubmitReply = useCallback(async (e) => {
    e.preventDefault();
    
    const trimmedContent = replyContent.trim();
    if (!trimmedContent) {
      onError?.('Reply cannot be empty');
      return;
    }

    if (!userId || !token) {
      onError?.('Please log in to reply');
      return;
    }

    setIsSubmittingReply(true);

    try {
      const result = await api.createReply(token, commentId, trimmedContent, userId);
      
      if (result.success) {
        // Create new reply object for optimistic update
        const newReply = {
          id: result.id || result.Id || Math.random(),
          content: trimmedContent,
          creator: { name: result.creatorName || 'You', id: userId },
          createdDate: new Date().toISOString(),
          likeCount: 0,
          dislikeCount: 0,
          currentUserReaction: null,
          parentCommentId: commentId,
          depth: (comment.depth ?? comment.Depth ?? depth) + 1,
          replies: [],
        };

        setLocalReplies(prev => [...prev, newReply]);
        setReplyContent('');
        setShowReplyBox(false);
        onReplyAdded?.(newReply, commentId);
      } else {
        onError?.(result.error || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      onError?.(error.message || 'Failed to post reply');
    } finally {
      setIsSubmittingReply(false);
    }
  }, [token, userId, commentId, replyContent, depth, comment.depth, comment.Depth, onError, onReplyAdded]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (window.confirm('Delete this comment?')) {
      onDelete?.(commentId);
    }
  }, [commentId, onDelete]);

  // Can current user delete this comment?
  const canDelete = userId && (parseInt(userId) === creatorId);

  // Should we show the reply button?
  const canReply = token && userId && depth < MAX_DEPTH;

  // Calculate left margin for nested comments
  const indentStyle = depth > 0 ? { 
    marginLeft: Math.min(depth * 24, MAX_DEPTH * 24),
    borderLeft: '2px solid #e5e7eb',
    paddingLeft: '16px'
  } : {};

  return (
    <div className="comment-item mb-3" style={indentStyle}>
      <div className="d-flex gap-3">
        {/* Avatar */}
        <div
          className="flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle bg-light text-secondary"
          style={{ 
            width: depth > 0 ? '32px' : '40px', 
            height: depth > 0 ? '32px' : '40px', 
            fontSize: depth > 0 ? '1rem' : '1.2rem' 
          }}
        >
          <i className="bi bi-person"></i>
        </div>
        
        {/* Content */}
        <div className="flex-grow-1">
          {/* Header */}
          <div className="d-flex align-items-center mb-1 flex-wrap gap-2">
            <span className="fw-bold me-2" style={{ fontSize: depth > 0 ? '0.9rem' : '1rem' }}>
              {creatorName}
            </span>
            <small className="text-muted">{formattedDate}</small>
            
            {/* Delete button */}
            {canDelete && (
              <button
                className="btn btn-link btn-sm text-danger p-0 ms-auto"
                onClick={handleDelete}
                title="Delete comment"
              >
                <i className="bi bi-trash"></i>
              </button>
            )}
          </div>
          
          {/* Comment text */}
          <div className="text-dark mb-2" style={{ fontSize: depth > 0 ? '0.9rem' : '1rem' }}>
            {content}
          </div>
          
          {/* Actions row */}
          <div className="d-flex align-items-center gap-3 flex-wrap">
            {/* Reactions */}
            <CommentReactions
              commentId={commentId}
              initialLikeCount={likeCount}
              initialDislikeCount={dislikeCount}
              initialUserReaction={currentUserReaction}
              onError={onError}
              compact={true}
            />
            
            {/* Reply button */}
            {canReply && (
              <button
                className="btn btn-link btn-sm text-muted p-0"
                onClick={() => setShowReplyBox(!showReplyBox)}
                style={{ fontSize: '0.85rem' }}
              >
                <i className="bi bi-reply me-1"></i>
                Reply
              </button>
            )}

            {/* Toggle replies */}
            {localReplies.length > 0 && (
              <button
                className="btn btn-link btn-sm text-muted p-0"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ fontSize: '0.85rem' }}
              >
                <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                {isExpanded ? 'Hide' : 'Show'} {localReplies.length} {localReplies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
          
          {/* Reply input box */}
          {showReplyBox && (
            <form onSubmit={handleSubmitReply} className="mt-3">
              <div className="d-flex gap-2">
                <textarea
                  className="form-control form-control-sm"
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  disabled={isSubmittingReply}
                  rows="2"
                  style={{ resize: 'none' }}
                />
              </div>
              <div className="d-flex gap-2 mt-2">
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmittingReply || !replyContent.trim()}
                >
                  {isSubmittingReply ? 'Posting...' : 'Post Reply'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setShowReplyBox(false);
                    setReplyContent('');
                  }}
                  disabled={isSubmittingReply}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Nested replies */}
      {isExpanded && localReplies.length > 0 && (
        <div className="replies-container mt-3">
          {localReplies.map((reply) => (
            <CommentItem
              key={reply.id || reply.Id}
              comment={reply}
              articleId={articleId}
              depth={depth + 1}
              onDelete={onDelete}
              onReplyAdded={onReplyAdded}
              onError={onError}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Default date formatting function
function formatCommentDate(dateStr) {
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

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Unknown date';
  }
}

export default CommentItem;
