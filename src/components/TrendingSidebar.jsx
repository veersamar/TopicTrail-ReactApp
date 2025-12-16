import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function TrendingSidebar() {
  const { token } = useAuth();
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now if API fails or just for visual consistency with SO style
    // But we will try to fetch if possible.
    const fetchTrending = async () => {
      try {
        // Use existing endpoint
        const response = await axios.get(`https://localhost:7083/api/article/trending`);
        const data = response.data?.data || response.data || [];
        setTrending(Array.isArray(data) ? data : []);
      } catch (e) {
        console.log("Failed to fetch trending, using empty", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return (
    <aside className="trending-sidebar w-100">
      {/* Yellow Widget Style (StackOverflow "The Overflow Blog" / Meta style) */}
      <div className="card mb-3 border border-warning shadow-sm" style={{ backgroundColor: '#FDF7E2', borderColor: '#F1E5BC' }}>
        <div className="card-header bg-transparent border-bottom border-warning py-2" style={{ borderColor: '#F1E5BC' }}>
          <h6 className="mb-0 small fw-bold text-secondary">The TopicTrail Blog</h6>
        </div>
        <div className="card-body p-0">
          <ul className="list-group list-group-flush bg-transparent">
            <li className="list-group-item bg-transparent border-0 d-flex gap-2 py-2 small">
              <i className="bi bi-pencil-fill mt-1" style={{ fontSize: '0.7rem' }}></i>
              <span className="text-secondary">Observability in 2025: What you need to know</span>
            </li>
            <li className="list-group-item bg-transparent border-0 d-flex gap-2 py-2 small">
              <i className="bi bi-pencil-fill mt-1" style={{ fontSize: '0.7rem' }}></i>
              <span className="text-secondary">Podcast: How to build a better developer experience</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Featured / Trending Widget */}
      <div className="card border shadow-sm">
        <div className="card-header bg-light py-2">
          <h6 className="mb-0 small fw-bold text-secondary">Trending Questions</h6>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="p-3 text-center text-muted small">Loading...</div>
          ) : (
            <div className="list-group list-group-flush">
              {trending.slice(0, 5).map((article, idx) => (
                <Link
                  key={idx}
                  to={`/articles/${article.id || article.Id}`}
                  className="list-group-item list-group-item-action d-flex align-items-start gap-2 border-0 py-2"
                >
                  <div className="mt-1 flex-shrink-0" style={{
                    width: '16px',
                    height: '16px',
                    background: '#5effba', // bright green icon or customized
                    borderRadius: '3px',
                    display: 'none' // Hidden for standard look, or use icon
                  }}></div>
                  <i className="bi bi-chat-square-text text-secondary mt-1" style={{ fontSize: '0.8rem' }}></i>
                  <span className="small text-secondary text-truncate-2" style={{ lineHeight: '1.3' }}>
                    {article.title || article.Title}
                  </span>
                </Link>
              ))}
              {trending.length === 0 && (
                <Link to="#" className="list-group-item border-0 small text-muted fst-italic">
                  No trending items found.
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom "Ignored Tags" or other widgets placeholder */}
      <div className="card mt-3 border shadow-sm">
        <div className="card-header bg-light py-2 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 small fw-bold text-secondary">Custom Filters</h6>
          <a href="#" className="small text-decoration-none">Edit</a>
        </div>
        <div className="card-body p-3 text-center">
          <button className="btn btn-outline-secondary btn-sm small w-100">Create a custom filter</button>
        </div>
      </div>

    </aside>
  );
}

export default TrendingSidebar;