import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ArticleCard from './ArticleCard';

function ArticlesFeed({ refreshTrigger }) {
  const { token } = useAuth();
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // ========== FETCH CATEGORIES ==========
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await api.getCategories();
        
        // Validate data is an array
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.warn('Categories data is not an array:', data);
          setCategories([]);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // ========== FETCH ARTICLES ==========
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        if (!token) {
          console.warn('No token available');
          setArticles([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        const data = await api.getArticles(token);
        console.log('Articles fetched:', data);

        // Validate data is an array
        if (Array.isArray(data)) {
          // Validate each article has required properties
          const validArticles = data.filter(article => {
            if (!article || typeof article !== 'object') {
              console.warn('Invalid article object:', article);
              return false;
            }
            return true;
          });

          setArticles(validArticles);
          
          if (validArticles.length === 0) {
            console.info('No articles returned from API');
          }
        } else {
          console.error('API response is not an array:', data);
          setArticles([]);
          setError('Invalid data format received from server');
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError(`Failed to load articles: ${err.message}`);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [token, refreshTrigger]);

  // ========== FILTER ARTICLES ==========
  useEffect(() => {
    try {
      // Safely filter articles
      let filtered = articles.filter(article => {
        // Skip if article is invalid
        if (!article || typeof article !== 'object') {
          return false;
        }

        // Get safe versions of properties with fallback
        const title = String(article.title || '').toLowerCase();
        const description = String(article.description || '').toLowerCase();
        const safeSearchTerm = String(searchTerm || '').trim().toLowerCase();

        // Search match
        const matchesSearch = !safeSearchTerm || 
          title.includes(safeSearchTerm) ||
          description.includes(safeSearchTerm);

        // Category match
        let matchesCategory = true;
        if (selectedCategory !== 'all') {
          matchesCategory = article.categoryId === parseInt(selectedCategory);
        }

        return matchesSearch && matchesCategory;
      });

      setFilteredArticles(filtered);
    } catch (err) {
      console.error('Error filtering articles:', err);
      setError('Error filtering articles');
      setFilteredArticles([]);
    }
  }, [articles, searchTerm, selectedCategory]);

  // ========== RENDER LOADING STATE ==========
  if (loading) {
    return (
      <div className="container-lg my-4" style={{ maxWidth: '900px' }}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading articles...</p>
          </div>
        </div>
      </div>
    );
  }

  // ========== RENDER ERROR STATE ==========
  if (error && articles.length === 0) {
    return (
      <div className="container-lg my-4" style={{ maxWidth: '900px' }}>
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          <strong>Error Loading Articles</strong>
          <p className="mb-0 mt-2">{error}</p>
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      </div>
    );
  }

  // ========== RENDER MAIN CONTENT ==========
  return (
    <div className="container-lg my-4" style={{ maxWidth: '900px' }}>
      {/* Error Alert (non-critical) */}
      {error && articles.length > 0 && (
        <div className="alert alert-warning alert-dismissible fade show mb-3" role="alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-8">
          <input
            type="text"
            className="form-control form-control-lg"
            placeholder="🔍 Search articles by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={articles.length === 0}
          />
        </div>
        <div className="col-md-4">
          <select
            className="form-select form-select-lg"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={categoriesLoading || categories.length === 0}
          >
            <option value="all">
              {categoriesLoading ? 'Loading...' : 'All Categories'}
            </option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name || 'Unnamed Category'}
              </option>
            ))}
          </select>
          {categories.length === 0 && !categoriesLoading && (
            <small className="text-warning d-block mt-2">
              ⚠ No categories available
            </small>
          )}
        </div>
      </div>

      {/* Articles List */}
      <div className="row">
        <div className="col-12">
          {filteredArticles.length > 0 ? (
            <>
              <div className="mb-3">
                <small className="text-muted">
                  Showing {filteredArticles.length} of {articles.length} articles
                </small>
              </div>
              <div className="d-grid gap-3">
                {filteredArticles.map(article => {
                  try {
                    return (
                      <ArticleCard 
                        key={article.id} 
                        article={article} 
                        token={token} 
                      />
                    );
                  } catch (err) {
                    console.error('Error rendering article card:', err, article);
                    return null;
                  }
                })}
              </div>
            </>
          ) : (
            <div className="alert alert-info text-center" role="alert">
              <i className="bi bi-info-circle me-2"></i>
              {articles.length === 0
                ? 'No articles yet. Create one to get started! 📝'
                : searchTerm || selectedCategory !== 'all'
                ? 'No articles match your filters. Try adjusting your search.'
                : 'No articles found.'}
            </div>
          )}
        </div>
      </div>

      {/* Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="alert alert-secondary mt-4 small" style={{ fontSize: '0.85rem' }}>
          <strong>Debug Info:</strong>
          <p className="mb-1">Total Articles: {articles.length}</p>
          <p className="mb-1">Filtered Articles: {filteredArticles.length}</p>
          <p className="mb-1">Search Term: "{searchTerm}"</p>
          <p className="mb-0">Selected Category: {selectedCategory}</p>
        </div>
      )}
    </div>
  );
}

export default ArticlesFeed;