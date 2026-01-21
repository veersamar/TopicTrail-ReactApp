import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

/**
 * ArticleReactions Component
 * Displays like/dislike buttons for an article with counts and handles user interactions
 * 
 * @param {Object} props
 * @param {number} props.articleId - The article ID
 * @param {number} props.initialLikeCount - Initial like count
 * @param {number} props.initialDislikeCount - Initial dislike count
 * @param {string|null} props.initialUserReaction - Initial user reaction ('Like', 'Dislike', or null)
 * @param {function} props.onError - Error callback
 */
function ArticleReactions({ 
  articleId, 
  initialLikeCount = 0, 
  initialDislikeCount = 0, 
  initialUserReaction = null,
  onError 
}) {
  const { token, userId } = useAuth();
  
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [userReaction, setUserReaction] = useState(initialUserReaction);
  const [isLoading, setIsLoading] = useState(false);

  // Handle reaction (Like or Dislike)
  const handleReaction = useCallback(async (reactionType) => {
    if (!token || !userId) {
      onError?.('Please log in to react to articles');
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
        
        result = await api.removeArticleReaction(token, articleId, userId);
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
        
        result = await api.reactToArticle(token, articleId, reactionType, userId);
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
  }, [token, userId, articleId, userReaction, likeCount, dislikeCount, isLoading, onError]);

  const isLiked = userReaction === 'Like';
  const isDisliked = userReaction === 'Dislike';
  const isDisabled = !token || !userId || isLoading;

  return (
    <div className="article-reactions d-flex gap-3 align-items-center">
      {/* Like Button */}
      <button
        className={`btn ${isLiked ? 'btn-primary' : 'btn-outline-secondary'} rounded-pill px-4 d-flex align-items-center gap-2`}
        onClick={() => handleReaction('Like')}
        disabled={isDisabled}
        title={!token ? 'Log in to like' : isLiked ? 'Remove like' : 'Like this article'}
        style={{ 
          transition: 'all 0.2s ease',
          opacity: isLoading ? 0.7 : 1 
        }}
      >
        <i className={`bi ${isLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}`}></i>
        <span>{likeCount}</span>
      </button>

      {/* Dislike Button */}
      <button
        className={`btn ${isDisliked ? 'btn-secondary' : 'btn-outline-secondary'} rounded-pill px-4 d-flex align-items-center gap-2`}
        onClick={() => handleReaction('Dislike')}
        disabled={isDisabled}
        title={!token ? 'Log in to dislike' : isDisliked ? 'Remove dislike' : 'Dislike this article'}
        style={{ 
          transition: 'all 0.2s ease',
          opacity: isLoading ? 0.7 : 1 
        }}
      >
        <i className={`bi ${isDisliked ? 'bi-hand-thumbs-down-fill' : 'bi-hand-thumbs-down'}`}></i>
        <span>{dislikeCount}</span>
      </button>
    </div>
  );
}

export default ArticleReactions;
