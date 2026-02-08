import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ArticleCard from './ArticleCard';

function CommunityArticles({ communityId, isMember = false }) {
  const { token } = useAuth();
  const [articles, setArticles] = useState([]);
  const [articleTypes, setArticleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!communityId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch articles and article types in parallel
        const [articlesResult, types] = await Promise.all([
          api.getCommunityArticles(token, communityId),
          api.getMasterDataByType('ArticleType')
        ]);

        if (articlesResult.success) {
          // Transform community posts to article format for ArticleCard
          const posts = articlesResult.articles || [];
          const transformedArticles = posts.map(post => ({
            id: post.ArticleId || post.articleId || post.Id || post.id,
            Id: post.ArticleId || post.articleId || post.Id || post.id,
            title: post.ArticleTitle || post.articleTitle || post.Title || post.title,
            Title: post.ArticleTitle || post.articleTitle || post.Title || post.title,
            description: post.ArticleDescription || post.articleDescription || post.Description || post.description,
            Description: post.ArticleDescription || post.articleDescription || post.Description || post.description,
            creator: post.PosterName || post.posterName || post.Creator || post.creator,
            Creator: post.PosterName || post.posterName || post.Creator || post.creator,
            createdDate: post.PostedAt || post.postedAt || post.CreatedDate || post.createdDate,
            CreatedDate: post.PostedAt || post.postedAt || post.CreatedDate || post.createdDate,
            viewCount: post.ViewCount || post.viewCount || 0,
            ViewCount: post.ViewCount || post.viewCount || 0,
            commentCount: post.CommentCount || post.commentCount || 0,
            CommentCount: post.CommentCount || post.commentCount || 0,
            likeCount: post.LikeCount || post.likeCount || 0,
            LikeCount: post.LikeCount || post.likeCount || 0,
            // Keep original post data
            ...post
          }));
          setArticles(transformedArticles);
        } else {
          setError(articlesResult.error || 'Failed to load articles');
        }

        if (Array.isArray(types)) {
          setArticleTypes(types);
        }
      } catch (err) {
        setError('Failed to load articles');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [communityId, token]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">{error}</div>
    );
  }

  return (
    <div className="community-articles">
      {/* Header with post button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0 text-muted">
          {articles.length} {articles.length === 1 ? 'Article' : 'Articles'}
        </h6>
        {isMember && (
          <Link 
            to={`/create-article?communityId=${communityId}`} 
            className="btn btn-primary btn-sm"
          >
            <i className="bi bi-plus-lg me-1"></i>
            Post Article
          </Link>
        )}
      </div>

      {/* Articles List */}
      {articles.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <p>No articles in this community yet.</p>
          {isMember && (
            <Link 
              to={`/create-article?communityId=${communityId}`} 
              className="btn btn-outline-primary btn-sm"
            >
              Be the first to post!
            </Link>
          )}
        </div>
      ) : (
        <div className="border rounded">
          {articles.map((article) => (
            <ArticleCard 
              key={article.id || article.Id} 
              article={article} 
              articleTypes={articleTypes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommunityArticles;
