import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import CommentReactions from './CommentReactions';
import { Avatar, Button, Textarea } from './ui';

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
    marginLeft: Math.min(depth * 20, MAX_DEPTH * 20),
    borderLeft: '2px solid var(--border-secondary)',
    paddingLeft: 'var(--space-4)'
  } : {};

  return (
    <div className="comment-item py-4" style={indentStyle}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar name={creatorName} size={depth > 0 ? 'sm' : 'md'} />
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`font-semibold ${depth > 0 ? 'text-sm' : ''}`}>
              {creatorName}
            </span>
            <span className="text-xs text-tertiary">{formattedDate}</span>
            
            {/* Delete button */}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-error"
                onClick={handleDelete}
                title="Delete comment"
              >
                🗑️
              </Button>
            )}
          </div>
          
          {/* Comment text */}
          <div className={`text-primary mb-3 ${depth > 0 ? 'text-sm' : ''}`}>
            {content}
          </div>
          
          {/* Actions row */}
          <div className="flex items-center gap-4 flex-wrap">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyBox(!showReplyBox)}
              >
                ↩️ Reply
              </Button>
            )}

            {/* Toggle replies */}
            {localReplies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? '▲' : '▼'} {localReplies.length} {localReplies.length === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>
          
          {/* Reply input box */}
          {showReplyBox && (
            <form onSubmit={handleSubmitReply} className="mt-4 stack stack--sm">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                disabled={isSubmittingReply}
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingReply || !replyContent.trim()}
                  loading={isSubmittingReply}
                >
                  Post Reply
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReplyBox(false);
                    setReplyContent('');
                  }}
                  disabled={isSubmittingReply}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Nested replies */}
      {isExpanded && localReplies.length > 0 && (
        <div className="mt-4">
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
