import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import CommentItem from './CommentItem';
import { Button, Textarea, EmptyState, Alert } from './ui';

/**
 * CommentList Component
 * Manages the full comment section including nested comments, adding new comments, and building the comment tree
 * 
 * @param {Object} props
 * @param {number} props.articleId - The article ID
 * @param {Array} props.initialComments - Initial list of comments from API
 * @param {function} props.onError - Error callback
 */
function CommentList({ articleId, initialComments = [], onError }) {
  const { token, userId } = useAuth();
  
  const [comments, setComments] = useState(initialComments);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(true);

  /**
   * Build a tree structure from flat comments list
   * Comments with parentCommentId = null are top-level
   * Comments with parentCommentId are nested under their parent
   */
  const commentTree = useMemo(() => {
    // Create a map of comments by ID
    const commentMap = new Map();
    const rootComments = [];
    
    // First pass: create map and extract all comments
    comments.forEach(comment => {
      const id = comment.id || comment.Id;
      commentMap.set(id, {
        ...comment,
        replies: comment.replies || comment.Replies || []
      });
    });
    
    // Second pass: build tree structure
    comments.forEach(comment => {
      const parentId = comment.parentCommentId ?? comment.ParentCommentId;
      const id = comment.id || comment.Id;
      
      if (parentId === null || parentId === undefined) {
        // Top-level comment
        rootComments.push(commentMap.get(id));
      } else {
        // Nested comment - add to parent's replies if not already there
        const parent = commentMap.get(parentId);
        if (parent) {
          const existingReplies = parent.replies || [];
          const alreadyExists = existingReplies.some(r => (r.id || r.Id) === id);
          if (!alreadyExists) {
            parent.replies = [...existingReplies, commentMap.get(id)];
          }
        } else {
          // Parent not found, treat as top-level
          rootComments.push(commentMap.get(id));
        }
      }
    });

    // Sort by date (newest first for top-level, oldest first for replies is handled in component)
    return rootComments.sort((a, b) => {
      const dateA = new Date(a.createdDate || a.CreatedDate || 0);
      const dateB = new Date(b.createdDate || b.CreatedDate || 0);
      return dateB - dateA; // Newest first
    });
  }, [comments]);

  // Get total comment count (including nested)
  const totalCommentCount = useMemo(() => {
    let count = 0;
    const countComments = (commentList) => {
      commentList.forEach(comment => {
        count++;
        const replies = comment.replies || comment.Replies || [];
        if (replies.length > 0) {
          countComments(replies);
        }
      });
    };
    countComments(comments);
    return count;
  }, [comments]);

  // Handle new top-level comment submission
  const handleAddComment = useCallback(async (e) => {
    e.preventDefault();
    
    const trimmedContent = newCommentContent.trim();
    if (!trimmedContent) {
      onError?.('Comment cannot be empty');
      return;
    }

    if (!userId || !token) {
      onError?.('Please log in to comment');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await api.createComment(token, articleId, trimmedContent, userId, null);
      
      if (result.success) {
        const newComment = {
          id: result.id || result.Id || Math.random(),
          content: trimmedContent,
          creator: { name: result.creatorName || 'You', id: parseInt(userId) },
          createdDate: new Date().toISOString(),
          likeCount: 0,
          dislikeCount: 0,
          currentUserReaction: null,
          parentCommentId: null,
          depth: 0,
          replies: [],
        };

        setComments(prev => [newComment, ...prev]);
        setNewCommentContent('');
      } else {
        onError?.(result.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      onError?.(error.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  }, [token, userId, articleId, newCommentContent, onError]);

  // Handle comment deletion
  const handleDeleteComment = useCallback(async (commentId) => {
    try {
      await api.deleteComment(token, commentId);
      
      // Remove comment from state (handles both top-level and nested)
      setComments(prev => {
        const removeComment = (commentList) => {
          return commentList.filter(c => {
            const id = c.id || c.Id;
            if (id === commentId) return false;
            
            // Also check nested replies
            const replies = c.replies || c.Replies || [];
            if (replies.length > 0) {
              c.replies = removeComment(replies);
            }
            return true;
          });
        };
        return removeComment(prev);
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      onError?.('Failed to delete comment');
    }
  }, [token, onError]);

  // Handle when a reply is added (for updating state)
  const handleReplyAdded = useCallback((newReply, parentCommentId) => {
    // The reply is already added to the local state in CommentItem
    // This callback can be used for any additional logic needed
    console.log('Reply added to comment:', parentCommentId, newReply);
  }, []);

  // Format date helper
  const formatCommentDate = useCallback((dateStr) => {
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
  }, []);

  return (
    <section className="section" id="comments">
      {/* Header */}
      <div className="section__header">
        <h3 className="heading-section">
          Comments ({totalCommentCount})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
        >
          {showComments ? 'Hide' : 'Show'}
        </Button>
      </div>

      {showComments && (
        <div className="section__content">
          {/* New Comment Form */}
          {userId ? (
            <form onSubmit={handleAddComment} className="stack stack--md mb-8">
              <Textarea
                placeholder="Join the discussion..."
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
              <div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || !newCommentContent.trim()}
                  loading={isSubmitting}
                >
                  Post Comment
                </Button>
              </div>
            </form>
          ) : (
            <Alert variant="info" className="mb-6">
              Please <a href="/login" className="link">log in</a> to join the discussion.
            </Alert>
          )}

          {/* Comments List */}
          <div className="stack stack--md">
            {commentTree.length > 0 ? (
              commentTree.map((comment) => (
                <CommentItem
                  key={comment.id || comment.Id}
                  comment={comment}
                  articleId={articleId}
                  depth={0}
                  onDelete={handleDeleteComment}
                  onReplyAdded={handleReplyAdded}
                  onError={onError}
                  formatDate={formatCommentDate}
                />
              ))
            ) : (
              <EmptyState
                title="No comments yet"
                description="Be the first to share your thoughts!"
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default CommentList;
