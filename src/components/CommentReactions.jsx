import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

/**
 * CommentReactions Component
 * Displays like/dislike buttons for a comment with counts and handles user interactions
 * 
 * @param {Object} props
 * @param {number} props.commentId - The comment ID
 * @param {number} props.initialLikeCount - Initial like count
 * @param {number} props.initialDislikeCount - Initial dislike count
 * @param {string|null} props.initialUserReaction - Initial user reaction ('Like', 'Dislike', or null)
 * @param {function} props.onError - Error callback
 * @param {boolean} props.compact - Use compact styling
 */
function CommentReactions({ 
  commentId, 
  initialLikeCount = 0, 
  initialDislikeCount = 0, 
  initialUserReaction = null,
  onError,
  compact = true
}) {
  const { token, userId } = useAuth();
  
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [userReaction, setUserReaction] = useState(initialUserReaction);
  const [isLoading, setIsLoading] = useState(false);

  // Handle reaction (Like or Dislike)
  const handleReaction = useCallback(async (reactionType) => {
    if (!token || !userId) {
      onError?.('Please log in to react to comments');
      return;
    }

    if (isLoading) return;

    // Store previous state for rollback
    const prevLikeCount = likeCount;
    const prevDislikeCount = dislikeCount;
    const prevUserReaction = userReaction;

    // Optimistic update
    setIsLoading(true);

    try {
      let result;

      if (userReaction === reactionType) {
        // User is clicking the same reaction - remove it
        setUserReaction(null);
        if (reactionType === 'Like') {
          setLikeCount(prev => Math.max(0, prev - 1));
        } else {
          setDislikeCount(prev => Math.max(0, prev - 1));
        }
        
        result = await api.removeCommentReaction(token, commentId, userId);
      } else {
        // User is adding a new reaction or switching
        const hadPreviousReaction = userReaction !== null;
        
        // Update counts optimistically
        if (hadPreviousReaction) {
          // Remove old reaction count
          if (userReaction === 'Like') {
            setLikeCount(prev => Math.max(0, prev - 1));
          } else {
            setDislikeCount(prev => Math.max(0, prev - 1));
          }
        }
        
        // Add new reaction count
        if (reactionType === 'Like') {
          setLikeCount(prev => prev + 1);
        } else {
          setDislikeCount(prev => prev + 1);
        }
        
        setUserReaction(reactionType);
        
        result = await api.reactToComment(token, commentId, reactionType, userId);
      }

      if (!result.success) {
        // Rollback on failure
        setLikeCount(prevLikeCount);
        setDislikeCount(prevDislikeCount);
        setUserReaction(prevUserReaction);
        onError?.(result.error || 'Failed to update reaction');
      } else {
        // Sync with server values if provided
        if (result.likeCount !== undefined) setLikeCount(result.likeCount);
        if (result.dislikeCount !== undefined) setDislikeCount(result.dislikeCount);
        if (result.userReaction !== undefined) setUserReaction(result.userReaction);
      }
    } catch (error) {
      // Rollback on error
      setLikeCount(prevLikeCount);
      setDislikeCount(prevDislikeCount);
      setUserReaction(prevUserReaction);
      onError?.(error.message || 'Failed to update reaction');
    } finally {
      setIsLoading(false);
    }
  }, [token, userId, commentId, userReaction, likeCount, dislikeCount, isLoading, onError]);

  const isLiked = userReaction === 'Like';
  const isDisliked = userReaction === 'Dislike';
  const isDisabled = !token || !userId || isLoading;

  // Compact button styling for comments
  const buttonBaseClass = compact 
    ? 'btn btn-sm px-2 py-1 d-flex align-items-center gap-1' 
    : 'btn px-3 py-1 d-flex align-items-center gap-2';

  return (
    <div className="comment-reactions d-flex gap-2 align-items-center">
      {/* Like Button */}
      <button
        className={`${buttonBaseClass} ${isLiked ? 'btn-primary' : 'btn-light border'}`}
        onClick={() => handleReaction('Like')}
        disabled={isDisabled}
        title={!token ? 'Log in to like' : isLiked ? 'Remove like' : 'Like this comment'}
        style={{ 
          transition: 'all 0.2s ease',
          opacity: isLoading ? 0.7 : 1,
          fontSize: compact ? '0.8rem' : '0.9rem'
        }}
      >
        <i className={`bi ${isLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}`}></i>
        <span>{likeCount > 0 ? likeCount : ''}</span>
      </button>

      {/* Dislike Button */}
      <button
        className={`${buttonBaseClass} ${isDisliked ? 'btn-secondary' : 'btn-light border'}`}
        onClick={() => handleReaction('Dislike')}
        disabled={isDisabled}
        title={!token ? 'Log in to dislike' : isDisliked ? 'Remove dislike' : 'Dislike this comment'}
        style={{ 
          transition: 'all 0.2s ease',
          opacity: isLoading ? 0.7 : 1,
          fontSize: compact ? '0.8rem' : '0.9rem'
        }}
      >
        <i className={`bi ${isDisliked ? 'bi-hand-thumbs-down-fill' : 'bi-hand-thumbs-down'}`}></i>
        <span>{dislikeCount > 0 ? dislikeCount : ''}</span>
      </button>
    </div>
  );
}

export default CommentReactions;
