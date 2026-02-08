import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import CommunityCard from '../components/CommunityCard';

function CommunitiesPage() {
  const { token, isAuthenticated } = useAuth();
  
  // State
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch communities
  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.getCommunities(token, {
        search: debouncedSearch || undefined,
      });

      console.log('Communities API result:', result);

      if (result.success) {
        setCommunities(result.communities);
      } else {
        setError(result.error || 'Failed to load communities');
      }
    } catch (err) {
      console.error('Error fetching communities:', err);
      setError('Failed to load communities');
    } finally {
      setLoading(false);
    }
  }, [token, debouncedSearch]);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  return (
    <div className="communities-page">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div>
          <h3 className="mb-1 fw-normal">Communities</h3>
          <p className="text-muted small mb-0">
            Discover and join communities that match your interests
          </p>
        </div>
        {isAuthenticated && (
          <Link to="/communities/create" className="btn btn-primary">
            <i className="bi bi-plus-lg me-1"></i>
            Create Community
          </Link>
        )}
      </div>

      {/* Search & Filters */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="btn btn-outline-secondary" 
                type="button"
                onClick={() => setSearchQuery('')}
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
        </div>
        <div className="col-md-6 text-md-end mt-3 mt-md-0">
          <span className="text-muted small">
            {communities.length} {communities.length === 1 ? 'community' : 'communities'} found
          </span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2 small">Loading communities...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="alert alert-danger d-flex align-items-center">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button 
            className="btn btn-outline-danger btn-sm ms-auto"
            onClick={fetchCommunities}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && communities.length === 0 && (
        <div className="text-center py-5">
          <h5 className="text-muted">No communities found</h5>
          {debouncedSearch ? (
            <p className="text-muted small">
              Try adjusting your search terms or{' '}
              <button 
                className="btn btn-link p-0 text-decoration-none"
                onClick={() => setSearchQuery('')}
              >
                clear the search
              </button>
            </p>
          ) : (
            <p className="text-muted small">
              Be the first to{' '}
              <Link to="/communities/create">create a community</Link>!
            </p>
          )}
        </div>
      )}

      {/* Communities Grid */}
      {!loading && !error && communities.length > 0 && (
        <div className="row g-4">
          {communities.map((community) => (
            <div key={community.id || community.Id} className="col-md-6 col-lg-4">
              <CommunityCard community={community} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CommunitiesPage;
