import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Card, Button, Spinner } from './ui';

function TrendingSidebar() {
  const { token } = useAuth();
  const [trending, setTrending] = useState([]);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pollsLoading, setPollsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  useEffect(() => {
    const fetchPolls = async () => {
      setPollsLoading(true);
      try {
        const pollsData = await api.getAllPolls(token);
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

  const getPollLink = (poll) => {
    const pollId = poll.id || poll.Id || poll.pollId || poll.PollId;
    return `/poll/${pollId}`;
  };

  const getArticleLink = (article) => {
    return `/articles/${article.id || article.Id}`;
  };

  return (
    <aside className="stack stack--md">
      {/* Blog Widget */}
      <Card className="sidebar-widget sidebar-widget--featured">
        <div className="sidebar-widget__header">
          <h4 className="heading-small">The TopicTrail Blog</h4>
        </div>
        <ul className="sidebar-list">
          <li className="sidebar-list__item">
            <span className="sidebar-list__bullet"></span>
            <span className="text-sm text-secondary">Observability in 2025: What you need to know</span>
          </li>
          <li className="sidebar-list__item">
            <span className="sidebar-list__bullet"></span>
            <span className="text-sm text-secondary">Podcast: How to build a better developer experience</span>
          </li>
        </ul>
      </Card>

      {/* Latest Polls Widget */}
      <Card className="sidebar-widget">
        <div className="sidebar-widget__header">
          <h4 className="heading-small">Latest Polls</h4>
          <Link to="/polls" className="text-sm link">View All</Link>
        </div>
        {pollsLoading ? (
          <div className="center py-4">
            <Spinner size="sm" />
          </div>
        ) : (
          <ul className="sidebar-list">
            {polls.slice(0, 5).map((poll, idx) => (
              <li key={poll.id || poll.Id || poll.pollId || poll.PollId || idx}>
                <Link to={getPollLink(poll)} className="sidebar-list__link">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm line-clamp-2">
                      {poll.title || poll.Title}
                    </span>
                    <span className="text-xs text-tertiary">
                      {poll.voteCount || poll.VoteCount || poll.totalVotes || 0} votes
                    </span>
                  </div>
                </Link>
              </li>
            ))}
            {polls.length === 0 && (
              <li className="sidebar-list__empty">
                <span className="text-sm text-secondary">No polls yet.</span>
                <Link to="/create-poll" className="text-sm link">Create one!</Link>
              </li>
            )}
          </ul>
        )}
      </Card>

      {/* Trending Widget */}
      <Card className="sidebar-widget">
        <div className="sidebar-widget__header">
          <h4 className="heading-small">Trending Questions</h4>
        </div>
        {loading ? (
          <div className="center py-4">
            <Spinner size="sm" />
          </div>
        ) : (
          <ul className="sidebar-list">
            {trending.slice(0, 5).map((article, idx) => (
              <li key={article.id || article.Id || idx}>
                <Link to={getArticleLink(article)} className="sidebar-list__link">
                  <span className="text-sm line-clamp-2">
                    {article.title || article.Title}
                  </span>
                </Link>
              </li>
            ))}
            {trending.length === 0 && (
              <li className="sidebar-list__empty">
                <span className="text-sm text-secondary">No trending items found.</span>
              </li>
            )}
          </ul>
        )}
      </Card>

      {/* Custom Filters Widget */}
      <Card className="sidebar-widget">
        <div className="sidebar-widget__header">
          <h4 className="heading-small">Custom Filters</h4>
          <button className="text-sm link">Edit</button>
        </div>
        <div className="p-3 text-center">
          <Button variant="secondary" size="sm" className="w-full">
            Create a custom filter
          </Button>
        </div>
      </Card>
    </aside>
  );
}

export default TrendingSidebar;