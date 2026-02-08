import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AttachmentsSection from './AttachmentsSection';
import ArticleReactions from './ArticleReactions';
import CommentList from './CommentList';
import { ArticleLayout } from './layout';
import { Button, Badge, Avatar, Spinner, Alert, Divider } from './ui';
import 'react-quill-new/dist/quill.snow.css';

function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, userId } = useAuth();

  // Guard against double-fetch in React StrictMode
  const hasFetched = useRef(false);

  // ========== STATE ==========
  const [pageState, setPageState] = useState({
    article: null,
    loading: true,
    error: null,
    likeCount: 0,
    dislikeCount: 0,
    userReaction: null,
    comments: [],
  });

  const [activePage, setActivePage] = useState(0);
  const [attachments, setAttachments] = useState([]);

  // ========== FETCH ARTICLE ON MOUNT ==========
  useEffect(() => {
    if (!id || !token) {
      setPageState(prev => ({
        ...prev,
        error: 'Invalid article or token',
        loading: false,
      }));
      return;
    }

    // Prevent double-fetch in StrictMode (fixes view count incrementing by 2)
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchArticle();
  }, [id, token]);

  // ========== FETCH ARTICLE ==========
  const fetchArticle = useCallback(async () => {
    try {
      setPageState(prev => ({ ...prev, loading: true, error: null }));

      const article = await api.getArticleById(token, id);

      if (!article) {
        setPageState(prev => ({
          ...prev,
          error: 'Article not found',
          loading: false,
        }));
        return;
      }

      console.log('Article fetched:', article);

      // Check if this is a poll article - redirect to poll page
      const articleTypeName = article.articleTypeName || article.ArticleTypeName || '';
      const pollId = article.pollId || article.PollId;
      if (articleTypeName.toLowerCase() === 'poll' && pollId) {
        navigate(`/poll/${pollId}`, { replace: true });
        return;
      }

      // Fetch comments for this article (with userId for reaction data)
      const commentsData = await api.getComments(token, id, userId);
      const commentsList = Array.isArray(commentsData?.comments) 
        ? commentsData.comments 
        : (Array.isArray(commentsData?.Comments) ? commentsData.Comments : []);

      // Fetch article reactions summary
      const reactions = await api.getArticleReactions(token, id, userId);

      setPageState(prev => ({
        ...prev,
        article,
        comments: commentsList,
        likeCount: reactions.likeCount ?? article.likeCount ?? article.LikeCount ?? 0,
        dislikeCount: reactions.dislikeCount ?? article.dislikeCount ?? article.DislikeCount ?? 0,
        userReaction: reactions.currentUserReaction ?? article.currentUserReaction ?? article.CurrentUserReaction ?? null,
        loading: false,
      }));

      // Fetch attachments separately using the dedicated API
      const fetchedAttachments = await api.getArticleAttachments(token, id);
      setAttachments(fetchedAttachments.map(att => ({
        id: att.id || att.Id,
        fileName: att.fileName || att.FileName,
        fileSize: att.fileSize || att.FileSize || 0,
        downloadUrl: att.downloadUrl || att.DownloadUrl || api.getAttachmentDownloadUrl(att.id || att.Id),
      })));
    } catch (error) {
      console.error('Error fetching article:', error);
      setPageState(prev => ({
        ...prev,
        error: error.message || 'Failed to load article',
        loading: false,
      }));
    }
  }, [id, token, userId, navigate]);

  // ========== HANDLE ERROR ==========
  const handleError = useCallback((errorMessage) => {
    setPageState(prev => ({ ...prev, error: errorMessage }));
    // Auto-clear error after 5 seconds
    setTimeout(() => {
      setPageState(prev => ({ ...prev, error: null }));
    }, 5000);
  }, []);

  // ========== SAFE PROPERTY ACCESSORS ==========
  const getTitle = () => pageState.article?.title || pageState.article?.article?.Title || pageState.article?.Title || 'Untitled';

  const getContent = () =>
    pageState.article?.content || pageState.article?.article?.Content || pageState.article?.Content || 'No content available';

  // eslint-disable-next-line no-unused-vars
  const getDescription = () =>
    pageState.article?.description || pageState.article?.article?.Description || pageState.article?.Description || '';

  const getCategory = () =>
    pageState.article?.categoryName || pageState.article?.article?.CategoryName || pageState.article?.CategoryName || 'General';

  const getCreatorName = () =>
    pageState.article?.creatorName || pageState.article?.article?.CreatorName || pageState.article?.CreatorName || 'Anonymous';

  const getCreatorEmail = () =>
    pageState.article?.creatorEmail || pageState.article?.CreatorEmail || '';

  const getCreatedDate = () => {
    const dateStr = pageState.article?.createdDate || pageState.article?.article?.CreatedDate || pageState.article?.CreatedDate;
    if (!dateStr) return 'Unknown date';

    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  const getViewCount = () => pageState.article?.viewCount || pageState.article?.ViewCount || pageState.article?.article?.viewCount || pageState.article?.article?.ViewCount || 0;

  const getArticleType = () => pageState.article?.articleType || pageState.article?.ArticleType || '';
  const getIntentType = () => pageState.article?.intentType || pageState.article?.IntentType || '';
  const getAudienceType = () => pageState.article?.audienceType || pageState.article?.AudienceType || '';
  const getTags = () => {
    const tags = pageState.article?.tags || pageState.article?.Tags;
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(t => t);
    return [];
  };

  const { article, loading, error, likeCount, dislikeCount, userReaction, comments } = pageState;

  // ========== RENDER LOADING STATE ==========
  if (loading) {
    return (
      <div className="center flex-col py-16" style={{ minHeight: '400px' }}>
        <Spinner size="lg" />
        <p className="text-secondary mt-4">Loading article...</p>
      </div>
    );
  }

  // ========== RENDER ERROR STATE ==========
  if (!article && !loading) {
    return (
      <div className="article-layout">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/articles')}
          className="mb-4"
        >
          ← Back to Articles
        </Button>
        <Alert variant="error">
          {error || 'Article not found'}
        </Alert>
      </div>
    );
  }

  // ========== CONTENT PAGES ==========
  const contentPages = getContent().split('<!-- PAGE_BREAK -->');
  const hasMultiplePages = contentPages.length > 1;

  // ========== RENDER MAIN CONTENT ==========
  return (
    <ArticleLayout
      header={
        <>
          {/* Back Link */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/articles')}
            className="mb-6"
          >
            ← Back to Articles
          </Button>

          {/* Category Badge */}
          <Badge variant="primary" className="mb-4">
            {getCategory()}
          </Badge>

          {/* Title */}
          <h1 className="heading-page mb-6">{getTitle()}</h1>

          {/* Author Info Bar */}
          <div className="flex items-center gap-4 py-4 border-t border-b mb-8">
            <Avatar name={getCreatorName()} size="lg" />
            <div className="flex-1">
              <div className="font-semibold text-primary">{getCreatorName()}</div>
              {getCreatorEmail() && (
                <div className="text-sm text-tertiary">{getCreatorEmail()}</div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-secondary">
              <span>📅 {getCreatedDate()}</span>
              <span>👁 {getViewCount()} views</span>
            </div>
          </div>
        </>
      }
      footer={
        <>
          {/* Tags */}
          {getTags().length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {getTags().map((tag, idx) => (
                <Badge key={idx} variant="tag">
                  #{typeof tag === 'string' ? tag.trim() : tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-between py-4 mb-8">
            <div className="flex items-center gap-4">
              <ArticleReactions
                articleId={parseInt(id)}
                initialLikeCount={likeCount}
                initialDislikeCount={dislikeCount}
                initialUserReaction={userReaction}
                onError={handleError}
              />
              <Button variant="secondary">
                📤 Share
              </Button>
            </div>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <section className="mb-8">
              <AttachmentsSection attachments={attachments} />
            </section>
          )}

          {/* Article Metadata */}
          {(getArticleType() || getIntentType() || getAudienceType()) && (
            <div className="card p-6 bg-secondary mt-8">
              <h4 className="heading-small mb-4">About this Article</h4>
              <div className="grid grid--3 gap-4">
                {getArticleType() && (
                  <div>
                    <div className="text-xs text-tertiary uppercase font-medium mb-1">Type</div>
                    <div className="text-primary">{getArticleType()}</div>
                  </div>
                )}
                {getIntentType() && (
                  <div>
                    <div className="text-xs text-tertiary uppercase font-medium mb-1">Intent</div>
                    <div className="text-primary">{getIntentType()}</div>
                  </div>
                )}
                {getAudienceType() && (
                  <div>
                    <div className="text-xs text-tertiary uppercase font-medium mb-1">Audience</div>
                    <div className="text-primary">{getAudienceType()}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <Divider className="my-8" />

          {/* Comments Section */}
          <CommentList
            articleId={parseInt(id)}
            initialComments={comments}
            onError={handleError}
          />
        </>
      }
    >
      {/* Error Alert */}
      {error && (
        <Alert 
          variant="error" 
          className="mb-6"
          onDismiss={() => setPageState(prev => ({ ...prev, error: null }))}
        >
          {error}
        </Alert>
      )}

      {/* Pagination Top */}
      {hasMultiplePages && (
        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg mb-6">
          <Button
            variant="ghost"
            size="sm"
            disabled={activePage === 0}
            onClick={() => setActivePage(prev => Math.max(0, prev - 1))}
          >
            ← Previous
          </Button>
          <span className="text-sm font-medium text-secondary">
            Part {activePage + 1} of {contentPages.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={activePage >= contentPages.length - 1}
            onClick={() => setActivePage(prev => Math.min(contentPages.length - 1, prev + 1))}
          >
            Next →
          </Button>
        </div>
      )}

      {/* Article Content */}
      <div 
        className="prose"
        dangerouslySetInnerHTML={{ __html: contentPages[activePage] }}
      />

      {/* Pagination Bottom */}
      {hasMultiplePages && (
        <div className="flex justify-center gap-2 mt-8">
          {contentPages.map((_, idx) => (
            <button
              key={idx}
              className={`btn btn--sm ${activePage === idx ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setActivePage(idx)}
              style={{ width: '36px', height: '36px', padding: 0 }}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}
    </ArticleLayout>
  );
}

export default ArticleDetail;