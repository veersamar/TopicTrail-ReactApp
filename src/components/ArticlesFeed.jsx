import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ArticleCard from './ArticleCard';

function ArticlesFeed() {
  const { token, user, userId } = useAuth();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const typeFilter = query.get('type'); // post, question, poll
  const tagFilter = query.get('tag'); // NEW: tag filter
  const isMyArticles = location.pathname === '/my-articles';

  // Try to get context, fallback to empty if not provided
  const context = useOutletContext();
  const refreshTrigger = context?.refreshTrigger || 0;

  // State
  const [articles, setArticles] = useState([]);
  const [articleTypes, setArticleTypes] = useState([]); // Master data for types
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
        console.log('ArticlesFeed loading data. Path:', location.pathname, 'isMyArticles:', isMyArticles, 'typeFilter:', typeFilter, 'User:', user, 'UserId:', userId);

        // First fetch article types to get the type ID for filtering
        const fetchedTypes = await api.getMasterDataByType('ArticleType');
        if (Array.isArray(fetchedTypes)) {
          setArticleTypes(fetchedTypes);
        }

        // Determine which API call to make
        let articlesPromise;
        if (isMyArticles) {
          if (userId) {
            console.log('Fetching MY articles for user:', userId);
            articlesPromise = api.getMyArticles(token, userId);
          } else {
            console.log('User ID missing for My Articles');
            articlesPromise = Promise.resolve([]);
          }
        } else if (tagFilter) {
          console.log('Fetching articles for tag:', tagFilter);
          articlesPromise = api.getArticlesByTag(token, tagFilter);
        } else if (typeFilter && fetchedTypes) {
          // Use the dedicated type endpoint for Posts and Questions
          const targetType = fetchedTypes.find(t =>
            (t.name || t.Name || '').toLowerCase() === typeFilter.toLowerCase()
          );
          if (targetType) {
            const typeId = targetType.id || targetType.Id || targetType.value || targetType.Value;
            console.log('Fetching articles by type:', typeFilter, 'TypeId:', typeId);
            articlesPromise = api.getArticlesByType(token, typeId);
          } else {
            console.log('Type not found, fetching all articles');
            articlesPromise = token ? api.getArticles(token) : Promise.resolve([]);
          }
        } else {
          console.log('Fetching ALL articles');
          articlesPromise = token ? api.getArticles(token) : Promise.resolve([]);
        }

        const fetchedArticles = await articlesPromise;
        console.log('Fetched articles:', fetchedArticles);

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
  }, [token, refreshTrigger, isMyArticles, user, userId, tagFilter, typeFilter, location.search]);

  // ========== FILTER & SORT ==========
  // Note: Type filtering is now done by the API via getArticlesByType
  // This useMemo now only handles sorting and the unanswered filter
  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    // Sort logic
    if (filterMode === 'newest') {
      filtered.sort((a, b) => new Date(b.createdDate || b.CreatedDate) - new Date(a.createdDate || a.CreatedDate));
    } else if (filterMode === 'active') {
      // Sort by most viewed
      filtered.sort((a, b) => (b.viewCount || b.ViewCount || 0) - (a.viewCount || a.ViewCount || 0));
    } else if (filterMode === 'unanswered') {
      filtered = filtered.filter(a => (a.commentCount || a.CommentCount || 0) === 0);
    }

    return filtered;
  }, [articles, filterMode]);

  const getPageTitle = () => {
    if (isMyArticles) return 'My Articles';
    if (tagFilter) return `Articles tagged [${tagFilter}]`;
    if (!typeFilter) return 'All Articles';
    const type = articleTypes.find(t => (t.name || t.Name || '').toLowerCase() === typeFilter.toLowerCase());
    return type ? `${type.name || type.Name}s` : 'Articles';
  };

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
        <h3 className="mb-0 fw-normal">{getPageTitle()}</h3>
        {/* Note: In real app, Ask Question is in Header (Navbar), this button here is redundant or could open modal too */}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="fs-5 text-secondary">{filteredArticles.length} items</div>

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
            <ArticleCard 
              key={article.id || article.Id || Math.random()} 
              article={article} 
              isAssumedOwner={isMyArticles}
              articleTypes={articleTypes}
            />
          ))
        ) : (
          <div className="py-5 text-center text-muted">
            No articles found for this filter.
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
