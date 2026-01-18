import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function TrendingSidebar() {
  const { token } = useAuth();
  const [trending, setTrending] = useState([]);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pollsLoading, setPollsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch trending articles
        const trendingData = await api.getTrendingArticles();
        setTrending(trendingData || []);
      } catch (e) {
        console.log("Failed to fetch trending", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Separate effect for fetching polls from dedicated Poll API
  useEffect(() => {
    const fetchPolls = async () => {
      setPollsLoading(true);
      try {
        // Use dedicated Poll API endpoint
        const pollsData = await api.getAllPolls(token);
        console.log('Fetched polls for sidebar:', pollsData);
        setPolls(Array.isArray(pollsData) ? pollsData : []);
      } catch (e) {
        console.log("Failed to fetch polls", e);
        setPolls([]);
      } finally {
        setPollsLoading(false);
      }
    };
    fetchPolls();
  }, [token]);

  // Get link for poll
  const getPollLink = (poll) => {
    const pollId = poll.id || poll.Id || poll.pollId || poll.PollId;
    return `/poll/${pollId}`;
  };

  // Get link for article
  const getArticleLink = (article) => {
    return `/articles/${article.id || article.Id}`;
  };

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

      {/* Latest Polls Widget */}
      <div className="card mb-3 border shadow-sm" style={{ borderColor: '#E0D4F7' }}>
        <div className="card-header py-2 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#F5F0FF' }}>
          <h6 className="mb-0 small fw-bold" style={{ color: '#6B46C1' }}>
            <i className="bi bi-bar-chart-fill me-1"></i>Latest Polls
          </h6>
          <Link to="/polls" className="small text-decoration-none" style={{ color: '#6B46C1' }}>
            View All
          </Link>
        </div>
        <div className="card-body p-0">
          {pollsLoading ? (
            <div className="p-3 text-center text-muted small">Loading...</div>
          ) : (
            <div className="list-group list-group-flush">
              {polls.slice(0, 5).map((poll, idx) => (
                <Link
                  key={poll.id || poll.Id || poll.pollId || poll.PollId || idx}
                  to={getPollLink(poll)}
                  className="list-group-item list-group-item-action d-flex align-items-start gap-2 border-0 py-2"
                >
                  <i className="bi bi-ui-radios text-primary mt-1" style={{ fontSize: '0.8rem' }}></i>
                  <div className="flex-grow-1">
                    <span className="small text-secondary d-block text-truncate-2" style={{ lineHeight: '1.3' }}>
                      {poll.title || poll.Title}
                    </span>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {poll.voteCount || poll.VoteCount || poll.totalVotes || 0} votes
                    </small>
                  </div>
                </Link>
              ))}
              {polls.length === 0 && (
                <div className="list-group-item border-0 small text-muted fst-italic text-center py-3">
                  <i className="bi bi-bar-chart d-block mb-1" style={{ fontSize: '1.2rem' }}></i>
                  No polls yet. 
                  <Link to="/create-poll" className="d-block mt-1 text-primary">Create one!</Link>
                </div>
              )}
            </div>
          )}
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
                  key={article.id || article.Id || idx}
                  to={getArticleLink(article)}
                  className="list-group-item list-group-item-action d-flex align-items-start gap-2 border-0 py-2"
                >
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