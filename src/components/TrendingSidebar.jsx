import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function TrendingSidebar() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`https://localhost:7083/api/article/trending`, {
        timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || 10000)
      });

      // Normalize possible response shapes to an array
      const payload = response?.data;
      const normalized = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.articles)
        ? payload.articles
        : [];

      setTrending(normalized);
    } catch (err) {
      console.error('Error fetching trending articles:', err);
      setError(err.response?.data?.message || 'Failed to load trending articles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <aside className="trending-sidebar" style={styles.sidebar}>
        <div className="card">
          <div className="card-header">
            <h5 style={{ margin: 0 }}>🔥 Trending Now</h5>
          </div>
          <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="trending-sidebar" style={styles.sidebar}>
        <div className="card">
          <div className="card-header">
            <h5 style={{ margin: 0 }}>🔥 Trending Now</h5>
          </div>
          <div className="card-body">
            <div className="alert alert-danger" style={{ fontSize: '0.9rem' }}>
              {error}
            </div>
            <button
              onClick={fetchTrending}
              className="btn-outline btn-sm w-100"
            >
              Try Again
            </button>
          </div>
        </div>
      </aside>
    );
  }

  if (!trending || trending.length === 0) {
    return (
      <aside className="trending-sidebar" style={styles.sidebar}>
        <div className="card">
          <div className="card-header">
            <h5 style={{ margin: 0 }}>🔥 Trending Now</h5>
          </div>
          <div className="card-body">
            <p className="text-secondary" style={{ textAlign: 'center', margin: 0 }}>
              No trending articles yet
            </p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="trending-sidebar" style={styles.sidebar}>
      <div className="card">
        <div className="card-header">
          <h5 style={{ margin: 0 }}>🔥 Trending Now</h5>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div style={styles.trendingList}>
            {(Array.isArray(trending) ? trending : []).map((article, index) => (
              <Link
                key={article.Id || index}
                to={`/articles/${article.Id}`}
                style={styles.trendingItem}
                className="trending-item"
              >
                <div style={styles.trendingRank}>#{index + 1}</div>
                <div style={{ flex: 1 }}>
                  <h6 style={styles.trendingTitle}>{article.Title}</h6>
                  <div style={styles.trendingMeta}>
                    <span>{article.CreatorName || 'Anonymous'}</span>
                    <span style={{ margin: '0 0.5rem' }}>•</span>
                    <span>{article.views || 0} views</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    position: 'sticky',
    top: '80px',
    height: 'fit-content',
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto'
  },
  trendingList: {
    display: 'flex',
    flexDirection: 'column'
  },
  trendingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-md)',
    borderBottom: '1px solid var(--border-color)',
    textDecoration: 'none',
    color: 'var(--text-primary)',
    transition: 'background-color var(--transition-base)'
  },
  trendingRank: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'var(--primary-color)',
    minWidth: '30px'
  },
  trendingTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    margin: '0 0 0.25rem 0',
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  },
  trendingMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  }
};

export default TrendingSidebar;