import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ArticleCard from './ArticleCard';
import { Spinner, EmptyState, Alert, Button } from './ui';
import { PageHeader } from './layout';

function ArticlesFeed() {
  const { token, user, userId } = useAuth();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const typeFilter = query.get('type');
  const tagFilter = query.get('tag');
  const isMyArticles = location.pathname === '/my-articles';

  const context = useOutletContext();
  const refreshTrigger = context?.refreshTrigger || 0;

  const [articles, setArticles] = useState([]);
  const [articleTypes, setArticleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState('newest');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedTypes = await api.getMasterDataByType('ArticleType');
        if (Array.isArray(fetchedTypes)) {
          setArticleTypes(fetchedTypes);
        }

        let articlesPromise;
        if (isMyArticles) {
          if (userId) {
            articlesPromise = api.getMyArticles(token, userId);
          } else {
            articlesPromise = Promise.resolve([]);
          }
        } else if (tagFilter) {
          articlesPromise = api.getArticlesByTag(token, tagFilter);
        } else if (typeFilter && fetchedTypes) {
          const targetType = fetchedTypes.find(t =>
            (t.name || t.Name || '').toLowerCase() === typeFilter.toLowerCase()
          );
          if (targetType) {
            const typeId = targetType.id || targetType.Id || targetType.value || targetType.Value;
            articlesPromise = api.getArticlesByType(token, typeId);
          } else {
            articlesPromise = token ? api.getArticles(token) : Promise.resolve([]);
          }
        } else {
          articlesPromise = token ? api.getArticles(token) : Promise.resolve([]);
        }

        const fetchedArticles = await articlesPromise;
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

  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    if (filterMode === 'newest') {
      filtered.sort((a, b) => new Date(b.createdDate || b.CreatedDate) - new Date(a.createdDate || a.CreatedDate));
    } else if (filterMode === 'active') {
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
      <div className="center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  const filterButtons = [
    { key: 'newest', label: 'Newest' },
    { key: 'active', label: 'Active' },
    { key: 'unanswered', label: 'Unanswered' },
  ];

  return (
    <div className="feed">
      <PageHeader title={getPageTitle()} />

      <div className="feed__toolbar">
        <span className="text-sm text-secondary">{filteredArticles.length} items</span>

        <div className="btn-group">
          {filterButtons.map(({ key, label }) => (
            <Button
              key={key}
              variant={filterMode === key ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterMode(key)}
              className={filterMode === key ? 'btn-group--active' : ''}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="feed__list">
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
          <EmptyState
            title="No articles found"
            description="There are no articles matching this filter."
          />
        )}
      </div>
    </div>
  );
}

export default ArticlesFeed;
