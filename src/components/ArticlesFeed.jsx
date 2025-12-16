import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ArticleCard from './ArticleCard';

function ArticlesFeed() {
  const { token } = useAuth();

  // Try to get context, fallback to empty if not provided
  // Try to get context, fallback to empty if not provided
  const context = useOutletContext();
  const refreshTrigger = context?.refreshTrigger || 0;

  // State
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter State
  const [filterMode, setFilterMode] = useState('newest'); // newest, active, unanswered

  // ========== FETCH DATA ==========
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedArticles = await (token ? api.getArticles(token) : Promise.resolve([]));
        if (Array.isArray(fetchedArticles)) {
          setArticles(fetchedArticles);
        } else {
          setArticles([]);
        }
      } catch (err) {
        console.error('Error loading feed:', err);
        setError('Failed to load content.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, refreshTrigger]);

  // ========== FILTER & SORT ==========
  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    // Sort logic
    if (filterMode === 'newest') {
      filtered.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    } else if (filterMode === 'active') {
      // Mock "active" by recently updated or viewed
      filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (filterMode === 'unanswered') {
      filtered = filtered.filter(a => (a.commentCount || 0) === 0);
    }

    return filtered;
  }, [articles, filterMode]);


  if (loading) {
    return (
      <div className="py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger my-4">{error}</div>;
  }

  return (
    <div className="articles-feed">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3">
        <h3 className="mb-0 fw-normal">All Questions</h3>
        <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>Ask Question</button>
        {/* Note: In real app, Ask Question is in Header (Navbar), this button here is redundant or could open modal too */}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="fs-5 text-secondary">{filteredArticles.length} questions</div>

        <div className="btn-group btn-group-sm outline-group" role="group">
          <button
            type="button"
            className={`btn btn-outline-secondary ${filterMode === 'newest' ? 'active' : ''}`}
            onClick={() => setFilterMode('newest')}
          >Newest</button>
          <button
            type="button"
            className={`btn btn-outline-secondary ${filterMode === 'active' ? 'active' : ''}`}
            onClick={() => setFilterMode('active')}
          >Active</button>
          <button
            type="button"
            className={`btn btn-outline-secondary ${filterMode === 'unanswered' ? 'active' : ''}`}
            onClick={() => setFilterMode('unanswered')}
          >Unanswered</button>
        </div>
      </div>

      {/* List */}
      <div className="d-flex flex-column border-top">
        {filteredArticles.length > 0 ? (
          filteredArticles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))
        ) : (
          <div className="py-5 text-center text-muted">
            No questions found.
          </div>
        )}
      </div>

      <style>{`
        .outline-group .btn-outline-secondary {
            border-color: #9fa6ad;
            color: #6a737c;
        }
        .outline-group .btn-outline-secondary:hover {
            background-color: #f8f9f9;
            color: #525960;
        }
        .outline-group .btn-outline-secondary.active {
            background-color: #e3e6e8;
            color: #3b4045;
            border-color: #9fa6ad;
        }
        .text-truncate-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default ArticlesFeed;