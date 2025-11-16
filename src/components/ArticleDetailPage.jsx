import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function ArticleDetailPage({ articleId, onBack }) {
  const { token } = useAuth();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const data = await api.getArticleById(token, articleId);
        setArticle(data);
        const commentsData = await api.getComments(token, articleId);
        setComments(commentsData || []);
      } catch (error) {
        console.error('Error fetching article:', error);
      }
      setLoading(false);
    };
    fetchArticle();
  }, [articleId, token]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await api.createComment(token, articleId, newComment);
      setNewComment('');
      const updated = await api.getComments(token, articleId);
      setComments(updated || []);
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="alert alert-danger">
        Article not found
      </div>
    );
  }

  return (
    <div className="container-lg my-4" style={{ maxWidth: '900px' }}>
      {/* Back Button */}
      <button className="btn btn-outline-secondary mb-3" onClick={onBack}>
        <i className="bi bi-arrow-left me-2"></i>Back
      </button>

      {/* Article */}
      <article className="card mb-4">
        <div className="card-body">
          <h1 className="card-title">{article.title}</h1>
          <div className="d-flex gap-3 text-muted small mb-3">
            <span>{new Date(article.createdDate).toLocaleDateString()}</span>
            <span><i className="bi bi-eye me-1"></i>{article.viewCount}</span>
            <span><i className="bi bi-heart me-1"></i>{article.likeCount}</span>
          </div>
          <div className="card-text">
            {article.content}
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Comments ({comments.length})</h5>
        </div>
        <div className="card-body">
          {/* New Comment */}
          <div className="mb-3">
            <textarea
              className="form-control mb-2"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows="3"
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleCommentSubmit}
              disabled={!newComment.trim()}
            >
              Post Comment
            </button>
          </div>

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="d-grid gap-3">
              {comments.map(comment => (
                <div key={comment.id} className="border-bottom pb-3">
                  <div className="d-flex justify-content-between">
                    <strong>{comment.userName}</strong>
                    <small className="text-muted">
                      {new Date(comment.createdDate).toLocaleString()}
                    </small>
                  </div>
                  <p className="mt-2 mb-0">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center">No comments yet. Be the first to comment!</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArticleDetailPage;