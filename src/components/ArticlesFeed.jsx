import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ArticleCard from './ArticleCard';

function ArticlesFeed({ refreshTrigger }) {
  const { token } = useAuth();

  // State
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // ========== FETCH DATA ==========
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Articles and Categories in parallel
        const [fetchedArticles, fetchedCategories] = await Promise.all([
          token ? api.getArticles(token) : Promise.resolve([]),
          api.getCategories()
        ]);

        if (Array.isArray(fetchedArticles)) {
          setArticles(fetchedArticles);
        } else {
          setArticles([]);
        }

        if (Array.isArray(fetchedCategories)) {
          setCategories(fetchedCategories);
        } else {
          setCategories([]);
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

  // ========== DERIVED STATE: TRENDING & FILTERED ==========
  const { trendingArticles, filteredArticles } = useMemo(() => {
    if (!articles.length) return { trendingArticles: [], filteredArticles: [] };

    // 1. Trending: Sort by views (desc), take top 3
    // Note: Assuming 'viewCount' or 'likes' property exists. If not, fallback to recent.
    const sortedByPopularity = [...articles].sort((a, b) => {
      const viewsA = a.viewCount || a.views || 0;
      const viewsB = b.viewCount || b.views || 0;
      return viewsB - viewsA;
    });
    const trending = sortedByPopularity.slice(0, 3);

    // 2. Filtered List (for the main feed)
    let filtered = articles.filter(article => {
      const title = (article.title || '').toLowerCase();
      const desc = (article.description || '').toLowerCase();
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch = !search || title.includes(search) || desc.includes(search);
      const matchesCategory = selectedCategory === 'all' ||
        article.categoryId === parseInt(selectedCategory);

      return matchesSearch && matchesCategory;
    });

    return { trendingArticles: trending, filteredArticles: filtered };
  }, [articles, searchTerm, selectedCategory]);


  // ========== UI COMPONENTS ==========

  if (loading) {
    return (
      <div className="container my-5 text-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p className="text-muted">Curating your feed...</p>
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger shadow-sm border-0">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-lg my-4" style={{ maxWidth: '1100px' }}>

      {/* SECTION: HERO / TRENDING */}
      {searchTerm === '' && selectedCategory === 'all' && trendingArticles.length > 0 && (
        <section className="mb-5 animate-fade-in">
          <h4 className="fw-bold mb-3 text-secondary">
            <i className="bi bi-graph-up-arrow me-2 text-primary"></i>Trending Now
          </h4>
          <div className="row g-4">
            {/* Main Featured Article (Left) */}
            <div className="col-lg-7">
              <div className="card h-100 border-0 shadow-lg text-white"
                style={{
                  background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                <div className="card-body d-flex flex-column justify-content-end p-4 p-lg-5" style={{ minHeight: '300px' }}>
                  <span className="badge bg-warning text-dark mb-2 align-self-start">
                    🔥 Top Read
                  </span>
                  <h2 className="card-title fw-bold mb-2">{trendingArticles[0].title}</h2>
                  <p className="card-text mb-3 text-white-50 text-truncate">
                    {trendingArticles[0].description}
                  </p>
                  <div className="d-flex align-items-center gap-3 text-light small">
                    <span><i className="bi bi-eye me-1"></i> {trendingArticles[0].viewCount || 0} views</span>
                    <span><i className="bi bi-heart me-1"></i> {trendingArticles[0].likeCount || 0} likes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Trending (Right Stack) */}
            <div className="col-lg-5 d-flex flex-column gap-4">
              {trendingArticles.slice(1).map(article => (
                <div key={article.id} className="card border-0 shadow-sm flex-fill" style={{ borderRadius: '12px' }}>
                  <div className="card-body d-flex flex-column justify-content-center">
                    <h6 className="text-muted text-uppercase small mb-1">Trending</h6>
                    <h5 className="card-title fw-bold text-primary mb-2 text-truncate">{article.title}</h5>
                    <p className="small text-muted mb-2 text-truncate">{article.description}</p>
                    <div className="d-flex align-items-center gap-2 small text-secondary">
                      <i className="bi bi-stopwatch"></i>
                      <span>Recent Popularity</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION: FILTERS & CATEGORIES */}
      <section className="mb-4 sticky-top bg-light py-3 border-bottom" style={{ zIndex: 100, top: '0px', margin: '0 -15px', padding: '0 15px' }}>
        <div className="row g-3 align-items-center">
          {/* Search */}
          <div className="col-md-6 col-lg-7">
            <div className="input-group input-group-lg shadow-sm">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search for topics, ideas, or guides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Categories Pills */}
          <div className="col-md-6 col-lg-5">
            <select
              className="form-select form-select-lg shadow-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">📚 All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* SECTION: LATEST ARTICLES FEED */}
      <section>
        <h5 className="fw-bold mb-4 text-secondary">
          {searchTerm || selectedCategory !== 'all' ? 'Search Results' : 'Latest Articles'}
        </h5>

        {filteredArticles.length > 0 ? (
          <div className="d-flex flex-column gap-4">
            {filteredArticles.map(article => (
              <ArticleCard key={article.id} article={article} token={token} />
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <div className="mb-3">
              <i className="bi bi-journal-x text-muted" style={{ fontSize: '3rem' }}></i>
            </div>
            <h5 className="text-muted">No articles found</h5>
            <p className="text-muted small">Try adjusting your search or category filters.</p>
          </div>
        )}
      </section>

      <style>{`
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default ArticlesFeed;