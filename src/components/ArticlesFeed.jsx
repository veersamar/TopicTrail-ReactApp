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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const data = await api.getCategories();
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  // Fetch articles
  useEffect(() => {
    const fetchArticles = async () => {
      if (token) {
        setLoading(true);
        const data = await api.getArticles(token);
        setArticles(data || []);
        setLoading(false);
      }
    };
    fetchArticles();
  }, [token, refreshTrigger]);

  // Filter articles
  useEffect(() => {
    let filtered = articles.filter(a =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.categoryId === parseInt(selectedCategory));
    }

    setFilteredArticles(filtered);
  }, [articles, searchTerm, selectedCategory]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-lg my-4" style={{ maxWidth: '900px' }}>
      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-8">
          <input
            type="text"
            className="form-control form-control-lg"
            placeholder="🔍 Search articles by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <select
            className="form-select form-select-lg"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles List */}
      <div className="row">
        <div className="col-12">
          {filteredArticles.length > 0 ? (
            <div className="d-grid gap-3">
              {filteredArticles.map(article => (
                <ArticleCard key={article.id} article={article} token={token} />
              ))}
            </div>
          ) : (
            <div className="alert alert-info text-center" role="alert">
              <i className="bi bi-info-circle me-2"></i>
              {articles.length === 0
                ? 'No articles yet. Create one to get started!'
                : 'No articles match your search.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArticlesFeed;