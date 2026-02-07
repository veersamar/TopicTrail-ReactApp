const envUrl = process.env.REACT_APP_API_URL;
const API_BASE_URL = (envUrl && envUrl !== 'undefined' && envUrl.startsWith('http'))
  ? envUrl
  : 'http://localhost:5064';

console.log('API Config:', { envUrl, API_BASE_URL }); // Debug log

// Response interceptor for common error handling
const handleResponse = async (res) => {
  // Always try to parse JSON response
  let data = {};
  try {
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await res.json();
    }
  } catch (e) {
    console.error('Failed to parse JSON response:', e);
  }

  // Success case (2xx status)
  if (res.ok) {
    if (Array.isArray(data)) {
      return {
        success: true,
        status: res.status,
        data: data
      };
    }
    return {
      success: true,
      status: res.status,
      ...data,
    };
  }

  // Error case (4xx, 5xx status)
  throw {
    status: res.status,
    message: data?.message || data?.error || `HTTP ${res.status}`,
    data,
  };
};

// Cache for frequently accessed data
const cache = {
  categories: null,
  masterData: null,
  lastFetch: {},
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const isCacheValid = (key) => {
  const lastFetch = cache.lastFetch[key];
  if (!lastFetch) return false;
  return Date.now() - lastFetch < CACHE_DURATION;
};

export const api = {
  // ==================== AUTH ENDPOINTS ====================
  login: async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe: true }),
      });
      return await handleResponse(res);
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed',
        status: error.status,
      };
    }
  },

  register: async (userData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return await handleResponse(res);
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed',
        status: error.status,
      };
    }
  },

  verifyOtp: async (identifier, otpCode) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/auth/verify-otp?identifier=${identifier}&otpCode=${otpCode}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );
      return await handleResponse(res);
    } catch (error) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        error: error.message || 'OTP verification failed',
        status: error.status,
      };
    }
  },

  forgotPassword: async (email) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await handleResponse(res);
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        error: error.message || 'Failed to process request',
        status: error.status,
      };
    }
  },

  resetPassword: async (data) => {
    // data: { email, token, newPassword }
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleResponse(res);
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message || 'Password reset failed',
        status: error.status,
      };
    }
  },

  // ==================== ARTICLE ENDPOINTS ====================
  getArticles: async (token, pageNumber = 1) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article/home?pageNumber=${pageNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await handleResponse(res);
      return Array.isArray(data.articles) ? data.articles : [];
    } catch (error) {
      console.error('Error fetching articles:', error);
      return [];
    }
  },

  /**
   * Get articles by article type (Post, Question, etc.)
   * @param {string} token - Auth token
   * @param {number} articleTypeId - Article type ID (e.g., 13 for Post, 15 for Question)
   * @param {number} pageNumber - Page number (default 1)
   * @param {number} pageSize - Page size (default 20)
   * @returns {Promise<Array>} - List of articles
   */
  getArticlesByType: async (token, articleTypeId, pageNumber = 1, pageSize = 20) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/Article/type/${articleTypeId}?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await handleResponse(res);
      console.log('getArticlesByType response:', data);
      return Array.isArray(data.articles) ? data.articles : (Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching articles by type:', error);
      return [];
    }
  },

  getTrendingArticles: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article/trending`);
      const data = await handleResponse(res);
      return Array.isArray(data.articles) ? data.articles : [];
    } catch (error) {
      console.error('Error fetching trending articles:', error);
      return [];
    }
  },

  getMyArticles: async (token, userId, pageNumber = 1) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article/myarticles?userId=${userId}&pageNumber=${pageNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await handleResponse(res);
      // Adjust based on actual response structure if different
      return Array.isArray(data.articles) ? data.articles : (Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching my articles:', error);
      return [];
    }
  },

  getArticleById: async (token, id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await handleResponse(res);
    } catch (error) {
      console.error('Error fetching article:', error);
      return null;
    }
  },

  createArticle: async (token, userId, data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article/createarticle?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const response = await handleResponse(res);
      console.log('Create article response:', response);

      return {
        success: response.success || response.status === 200 || response.status === 201,
        id: response.id || response.articleId,
        error: response.error || response.message,
        ...response,
      };
    } catch (error) {
      console.error('Error creating article:', error);
      return {
        success: false,
        error: error.message || 'Failed to create article',
        status: error.status,
      };
    }
  },

  updateArticle: async (token, id, userId, data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article/${id}?userId=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const response = await handleResponse(res);
      return {
        success: response.success || response.status === 200,
        ...response,
      };
    } catch (error) {
      console.error('Error updating article:', error);
      return {
        success: false,
        error: error.message || 'Failed to update article',
        status: error.status,
      };
    }
  },

  deleteArticle: async (token, id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const response = await handleResponse(res);
      return {
        success: response.success || response.status === 200,
        ...response,
      };
    } catch (error) {
      console.error('Error deleting article:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete article',
        status: error.status,
      };
    }
  },

  searchArticles: async (token, query) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/article/search?query=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await handleResponse(res);
      // Check data.data (array response) -> data (array response old? no) -> data.articles (object response)
      return Array.isArray(data.data) ? data.data : (Array.isArray(data.articles) ? data.articles : []);
    } catch (error) {
      console.error('Error searching articles:', error);
      return [];
    }
  },

  // ==================== ARTICLE REACTION ENDPOINTS ====================
  /**
   * React to an article (Like or Dislike)
   * @param {string} token - Auth token
   * @param {number} articleId - Article ID
   * @param {string} reactionType - 'Like' or 'Dislike'
   * @param {number} userId - User ID
   * @returns {Promise<{success: boolean, likeCount: number, dislikeCount: number, userReaction: string|null}>}
   */
  reactToArticle: async (token, articleId, reactionType, userId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/articles/${articleId}/reactions/${reactionType}?userId=${userId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const response = await handleResponse(res);
      return {
        success: response.success || response.Success || res.ok,
        likeCount: response.likeCount ?? response.LikeCount ?? 0,
        dislikeCount: response.dislikeCount ?? response.DislikeCount ?? 0,
        userReaction: response.userReaction ?? response.UserReaction ?? null,
        ...response,
      };
    } catch (error) {
      console.error('Error reacting to article:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Remove reaction from an article
   * @param {string} token - Auth token
   * @param {number} articleId - Article ID
   * @param {number} userId - User ID
   * @returns {Promise<{success: boolean, likeCount: number, dislikeCount: number}>}
   */
  removeArticleReaction: async (token, articleId, userId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/articles/${articleId}/reactions?userId=${userId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const response = await handleResponse(res);
      return {
        success: response.success || response.Success || res.ok,
        likeCount: response.likeCount ?? response.LikeCount ?? 0,
        dislikeCount: response.dislikeCount ?? response.DislikeCount ?? 0,
        userReaction: null,
        ...response,
      };
    } catch (error) {
      console.error('Error removing article reaction:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get reaction summary for an article
   * @param {string} token - Auth token
   * @param {number} articleId - Article ID
   * @param {number} userId - User ID (optional)
   * @returns {Promise<{likeCount: number, dislikeCount: number, currentUserReaction: string|null}>}
   */
  getArticleReactions: async (token, articleId, userId) => {
    try {
      const url = userId 
        ? `${API_BASE_URL}/api/articles/${articleId}/reactions?userId=${userId}`
        : `${API_BASE_URL}/api/articles/${articleId}/reactions`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const response = await handleResponse(res);
      return {
        likeCount: response.likeCount ?? response.LikeCount ?? 0,
        dislikeCount: response.dislikeCount ?? response.DislikeCount ?? 0,
        currentUserReaction: response.currentUserReaction ?? response.CurrentUserReaction ?? null,
      };
    } catch (error) {
      console.error('Error getting article reactions:', error);
      return { likeCount: 0, dislikeCount: 0, currentUserReaction: null };
    }
  },

  // Legacy like/unlike methods (kept for backwards compatibility)
  likeArticle: async (token, articleId, userId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/article/${articleId}/like?userId=${userId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const response = await handleResponse(res);
      return {
        success: response.success || response.status === 200,
        ...response,
      };
    } catch (error) {
      console.error('Error liking article:', error);
      return { success: false, error: error.message };
    }
  },

  unlikeArticle: async (token, articleId, userId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/article/${articleId}/like?userId=${userId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const response = await handleResponse(res);
      return {
        success: response.success || response.status === 200,
        ...response,
      };
    } catch (error) {
      console.error('Error unliking article:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== COMMENT REACTION ENDPOINTS ====================
  /**
   * React to a comment (Like or Dislike)
   * @param {string} token - Auth token
   * @param {number} commentId - Comment ID
   * @param {string} reactionType - 'Like' or 'Dislike'
   * @param {number} userId - User ID
   * @returns {Promise<{success: boolean, likeCount: number, dislikeCount: number, userReaction: string|null}>}
   */
  reactToComment: async (token, commentId, reactionType, userId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/comments/${commentId}/reactions/${reactionType}?userId=${userId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const response = await handleResponse(res);
      return {
        success: response.success || response.Success || res.ok,
        likeCount: response.likeCount ?? response.LikeCount ?? 0,
        dislikeCount: response.dislikeCount ?? response.DislikeCount ?? 0,
        userReaction: response.userReaction ?? response.UserReaction ?? null,
        ...response,
      };
    } catch (error) {
      console.error('Error reacting to comment:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Remove reaction from a comment
   * @param {string} token - Auth token
   * @param {number} commentId - Comment ID
   * @param {number} userId - User ID
   * @returns {Promise<{success: boolean, likeCount: number, dislikeCount: number}>}
   */
  removeCommentReaction: async (token, commentId, userId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/comments/${commentId}/reactions?userId=${userId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const response = await handleResponse(res);
      return {
        success: response.success || response.Success || res.ok,
        likeCount: response.likeCount ?? response.LikeCount ?? 0,
        dislikeCount: response.dislikeCount ?? response.DislikeCount ?? 0,
        userReaction: null,
        ...response,
      };
    } catch (error) {
      console.error('Error removing comment reaction:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get reaction summary for a comment
   * @param {string} token - Auth token
   * @param {number} commentId - Comment ID
   * @param {number} userId - User ID (optional)
   * @returns {Promise<{likeCount: number, dislikeCount: number, currentUserReaction: string|null}>}
   */
  getCommentReactions: async (token, commentId, userId) => {
    try {
      const url = userId 
        ? `${API_BASE_URL}/api/comments/${commentId}/reactions?userId=${userId}`
        : `${API_BASE_URL}/api/comments/${commentId}/reactions`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const response = await handleResponse(res);
      return {
        likeCount: response.likeCount ?? response.LikeCount ?? 0,
        dislikeCount: response.dislikeCount ?? response.DislikeCount ?? 0,
        currentUserReaction: response.currentUserReaction ?? response.CurrentUserReaction ?? null,
      };
    } catch (error) {
      console.error('Error getting comment reactions:', error);
      return { likeCount: 0, dislikeCount: 0, currentUserReaction: null };
    }
  },

  /**
   * Get batch comment reactions
   * @param {string} token - Auth token
   * @param {number[]} commentIds - Array of comment IDs
   * @param {number} userId - User ID (optional)
   * @returns {Promise<Object>} - Map of commentId to reaction data
   */
  getBatchCommentReactions: async (token, commentIds, userId) => {
    try {
      const url = userId 
        ? `${API_BASE_URL}/api/comments/reactions/batch?commentIds=${commentIds.join(',')}&userId=${userId}`
        : `${API_BASE_URL}/api/comments/reactions/batch?commentIds=${commentIds.join(',')}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const response = await handleResponse(res);
      return response;
    } catch (error) {
      console.error('Error getting batch comment reactions:', error);
      return {};
    }
  },

  // ==================== CATEGORY ENDPOINTS ====================
  getCategories: async () => {
    try {
      if (isCacheValid('categories') && cache.categories) {
        console.log('Returning cached categories', cache.categories);
        return cache.categories;
      }

      const res = await fetch(`${API_BASE_URL}/api/category/categories`);
      const data = await handleResponse(res);
      const categories = Array.isArray(data.data) ? data.data : [];

      cache.categories = categories;
      cache.lastFetch['categories'] = Date.now();

      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return cache.categories || [];
    }
  },

  getSubCategories: async (categoryId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/category/subCategoriesByCategory?category=${categoryId}`
      );
      const data = await handleResponse(res);
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      return [];
    }
  },

  clearCategoryCache: () => {
    cache.categories = null;
    cache.lastFetch['categories'] = 0;
  },

  // ==================== MASTER DATA ENDPOINTS ====================
  getMasterData: async () => {
    try {
      if (isCacheValid('masterData') && cache.masterData) {
        return cache.masterData;
      }

      const res = await fetch(`${API_BASE_URL}/api/masterdata/all`);
      const data = await handleResponse(res);

      cache.masterData = data;
      cache.lastFetch['masterData'] = Date.now();

      return data;
    } catch (error) {
      console.error('Error fetching master data:', error);
      return cache.masterData || {};
    }
  },

  getMasterDataByType: async (type) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/masterdata/${type}`);
      const data = await handleResponse(res);
      // Data might be in data.data (from array wrap) or just data (if handleResponse spread it and I missed something)
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.error(`Error fetching master data for type ${type}:`, error);
      return [];
    }
  },

  clearMasterDataCache: () => {
    cache.masterData = null;
    cache.lastFetch['masterData'] = 0;
  },

  // ==================== COMMENT ENDPOINTS ====================
  getComments: async (token, articleId, userId) => {
    try {
      const url = userId 
        ? `${API_BASE_URL}/api/comment/article/${articleId}?userId=${userId}`
        : `${API_BASE_URL}/api/comment/article/${articleId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await handleResponse(res);
      return data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return { comments: [] };
    }
  },

  /**
   * Create a comment on an article
   * @param {string} token - Auth token
   * @param {number} articleId - Article ID
   * @param {string} content - Comment content
   * @param {number} userId - User ID
   * @param {number|null} parentCommentId - Parent comment ID for replies (null for top-level)
   * @returns {Promise<{success: boolean, id?: number, error?: string}>}
   */
  createComment: async (token, articleId, content, userId, parentCommentId = null) => {
    try {
      console.log('Creating comment:', { articleId, userId, content, parentCommentId });

      const body = { content };
      if (parentCommentId) {
        body.parentCommentId = parentCommentId;
      }

      const res = await fetch(
        `${API_BASE_URL}/api/comment/article/${articleId}?userId=${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const response = await handleResponse(res);
      console.log('Create comment response:', response);

      return {
        success: response.success || response.status === 200 || response.status === 201,
        id: response.id || response.Id || response.commentId,
        creatorName: response.creator || response.Creator || response.creatorName,
        creatorEmail: response.creatorEmail,
        parentCommentId: response.parentCommentId ?? response.ParentCommentId ?? parentCommentId,
        depth: response.depth ?? response.Depth ?? 0,
        likeCount: response.likeCount ?? response.LikeCount ?? 0,
        dislikeCount: response.dislikeCount ?? response.DislikeCount ?? 0,
        error: response.error || response.message,
        ...response,
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      return {
        success: false,
        error: error.message || 'Failed to create comment',
        status: error.status,
      };
    }
  },

  /**
   * Create a reply to a comment
   * @param {string} token - Auth token
   * @param {number} parentCommentId - Parent comment ID
   * @param {string} content - Reply content
   * @param {number} userId - User ID
   * @returns {Promise<{success: boolean, id?: number, error?: string}>}
   */
  createReply: async (token, parentCommentId, content, userId) => {
    try {
      console.log('Creating reply:', { parentCommentId, userId, content });

      const res = await fetch(
        `${API_BASE_URL}/api/comment/${parentCommentId}/reply?userId=${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      const response = await handleResponse(res);
      console.log('Create reply response:', response);

      return {
        success: response.success || response.status === 200 || response.status === 201,
        id: response.id || response.Id || response.commentId,
        creatorName: response.creator || response.Creator || response.creatorName,
        creatorEmail: response.creatorEmail,
        parentCommentId: response.parentCommentId ?? response.ParentCommentId ?? parentCommentId,
        depth: response.depth ?? response.Depth ?? 1,
        likeCount: response.likeCount ?? response.LikeCount ?? 0,
        dislikeCount: response.dislikeCount ?? response.DislikeCount ?? 0,
        error: response.error || response.message,
        ...response,
      };
    } catch (error) {
      console.error('Error creating reply:', error);
      return {
        success: false,
        error: error.message || 'Failed to create reply',
        status: error.status,
      };
    }
  },

  /**
   * Get replies for a comment
   * @param {string} token - Auth token
   * @param {number} commentId - Parent comment ID
   * @param {number} userId - User ID (optional)
   * @returns {Promise<Array>} - List of replies
   */
  getCommentReplies: async (token, commentId, userId) => {
    try {
      const url = userId
        ? `${API_BASE_URL}/api/comment/${commentId}/replies?userId=${userId}`
        : `${API_BASE_URL}/api/comment/${commentId}/replies`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await handleResponse(res);
      return Array.isArray(data) ? data : (data.replies || data.data || []);
    } catch (error) {
      console.error('Error fetching comment replies:', error);
      return [];
    }
  },

  deleteComment: async (token, commentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/comment/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const response = await handleResponse(res);
      return {
        success: response.success || response.status === 200,
        ...response,
      };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete comment',
        status: error.status,
      };
    }
  },

  // ==================== USER ENDPOINTS ====================
  getUserProfile: async (token, userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await handleResponse(res);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  updateProfile: async (token, userId, data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const response = await handleResponse(res);
      return {
        success: response.success || response.status === 200,
        ...response,
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile',
        status: error.status,
      };
    }
  },

  getLoginHistory: async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/login-sessions/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await handleResponse(res);
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.error('Error fetching login history:', error);
      return [];
    }
  },

  // ==================== HEALTH CHECK ====================
  healthCheck: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },

  // ==================== UTILITY ====================
  clearAllCache: () => {
    cache.categories = null;
    cache.masterData = null;
    cache.lastFetch = {};
  },

  // ==================== TAG ENDPOINTS ====================
  suggestTags: async (query) => {
    try {
      if (!query || query.length < 2) return [];
      const res = await fetch(`${API_BASE_URL}/api/tags/suggest?q=${encodeURIComponent(query)}`);
      const data = await handleResponse(res);
      return Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
      return [];
    }
  },

  getTags: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tags`);
      const data = await handleResponse(res);
      // Response structure: { success: true, tags: [...], ... }
      return Array.isArray(data.tags) ? data.tags : [];
    } catch (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
  },

  // ==================== MEDIA/ATTACHMENT ENDPOINTS ====================

  /**
   * Get all inline media for an article
   * @param {string} token - Auth token
   * @param {number} articleId - Article ID
   * @returns {Promise<Array<{id: string, fileName: string, url: string}>>}
   */
  getArticleMedia: async (token, articleId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article/${articleId}/media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await handleResponse(res);
      return Array.isArray(data) ? data : (data.data || data.media || []);
    } catch (error) {
      console.error('Error fetching article media:', error);
      return [];
    }
  },

  /**
   * Get all attachments for an article
   * @param {string} token - Auth token
   * @param {number} articleId - Article ID
   * @returns {Promise<Array<{id: string, fileName: string, fileSize: number, downloadUrl: string}>>}
   */
  getArticleAttachments: async (token, articleId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article/${articleId}/attachment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await handleResponse(res);
      return Array.isArray(data) ? data : (data.data || data.attachments || []);
    } catch (error) {
      console.error('Error fetching article attachments:', error);
      return [];
    }
  },


  /**
   * Upload inline image for article content
   * @param {string} token - Auth token
   * @param {number} articleId - Article ID
   * @param {File} file - Image file to upload
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  uploadArticleMedia: async (token, articleId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE_URL}/api/article/${articleId}/media`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const response = await handleResponse(res);
      console.log('uploadArticleMedia response:', response);

      // Extract URL from various possible property names
      let imageUrl = response.url || response.Url || response.imageUrl || response.ImageUrl || response.filePath || response.FilePath;

      // If URL is relative, prepend the API base URL
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }

      console.log('Constructed image URL:', imageUrl);

      return {
        ...response,
        success: response.success || response.status === 200 || response.status === 201,
        url: imageUrl,
        id: response.id || response.Id || response.mediaId || response.MediaId,
      };
    } catch (error) {
      console.error('Error uploading article media:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image',
        status: error.status,
      };
    }
  },

  /**
   * Upload file attachment for article
   * @param {string} token - Auth token
   * @param {number} articleId - Article ID
   * @param {File} file - File to upload (PDF, Word, Excel, images)
   * @returns {Promise<{success: boolean, id?: string, fileName?: string, downloadUrl?: string, error?: string}>}
   */
  uploadArticleAttachment: async (token, articleId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE_URL}/api/article/${articleId}/attachment`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const response = await handleResponse(res);
      return {
        success: response.success || response.status === 200 || response.status === 201,
        id: response.id || response.Id || response.attachmentId || response.AttachmentId,
        fileName: response.fileName || response.FileName || file.name,
        downloadUrl: response.downloadUrl || response.DownloadUrl,
        fileSize: response.fileSize || response.FileSize || file.size,
        ...response,
      };
    } catch (error) {
      console.error('Error uploading article attachment:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload attachment',
        status: error.status,
      };
    }
  },

  /**
   * Delete inline media from article
   * @param {string} token - Auth token
   * @param {number} articleId - Article ID
   * @param {string} mediaId - Media ID to delete
   */
  deleteArticleMedia: async (token, articleId, mediaId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article/${articleId}/media/${mediaId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await handleResponse(res);
      return {
        success: response.success || response.status === 200,
        ...response,
      };
    } catch (error) {
      console.error('Error deleting article media:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete media',
        status: error.status,
      };
    }
  },

  /**
   * Delete attachment from article
   * @param {string} token - Auth token
   * @param {number} articleId - Article ID
   * @param {string} attachmentId - Attachment ID to delete
   */
  deleteArticleAttachment: async (token, articleId, attachmentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article/${articleId}/attachment/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await handleResponse(res);
      return {
        success: response.success || response.status === 200,
        ...response,
      };
    } catch (error) {
      console.error('Error deleting article attachment:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete attachment',
        status: error.status,
      };
    }
  },

  /**
   * Get download URL for attachment
   * @param {string} attachmentId - Attachment ID
   * @returns {string} Full download URL
   */
  getAttachmentDownloadUrl: (attachmentId) => {
    return `${API_BASE_URL}/api/attachment/${attachmentId}/download`;
  },

  getArticlesByTag: async (token, tagName, pageNumber = 1) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article?tag=${encodeURIComponent(tagName)}&pageNumber=${pageNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await handleResponse(res);
      return Array.isArray(data.articles) ? data.articles : (Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching articles by tag:', error);
      return [];
    }
  },

  // ==================== POLL ENDPOINTS ====================

  /**
   * Get all polls (list endpoint)
   * @param {string} token - Auth token
   * @param {number} pageNumber - Page number (default 1)
   * @returns {Promise<Array>} - List of polls
   */
  getAllPolls: async (token, pageNumber = 1) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/polls?pageNumber=${pageNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await handleResponse(res);
      console.log('Get all polls response:', data);
      // Handle different response formats
      return Array.isArray(data) ? data : 
             Array.isArray(data.polls) ? data.polls : 
             Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.error('Error fetching polls:', error);
      return [];
    }
  },

  /**
   * Create a new poll
   * @param {string} token - Auth token
   * @param {object} pollData - Poll creation data matching CreatePollRequest schema
   * @returns {Promise<{success: boolean, pollId?: number, error?: string}>}
   */
  createPoll: async (token, pollData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pollData),
      });

      const response = await handleResponse(res);
      console.log('Create poll response:', response);

      return {
        success: response.success || response.status === 200 || response.status === 201,
        pollId: response.pollId || response.PollId || response.id || response.Id,
        error: response.error || response.message,
        ...response,
      };
    } catch (error) {
      console.error('Error creating poll:', error);
      return {
        success: false,
        error: error.message || error.data?.message || 'Failed to create poll',
        status: error.status,
        data: error.data,
      };
    }
  },

  /**
   * Get poll by ID (includes questions and options)
   * @param {string} token - Auth token
   * @param {number} pollId - Poll ID
   * @returns {Promise<object|null>}
   */
  getPollById: async (token, pollId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/polls/${pollId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await handleResponse(res);
      
      // Normalize the response - the API might return the poll object directly
      // or wrapped in a data property
      const poll = data.data || data;
      
      // Ensure consistent property access (handle both camelCase and PascalCase)
      return {
        success: true,
        // Core poll properties
        id: poll.id || poll.Id,
        title: poll.title || poll.Title,
        description: poll.description || poll.Description,
        categoryId: poll.categoryId || poll.CategoryId,
        categoryName: poll.categoryName || poll.CategoryName,
        subCategoryId: poll.subCategoryId || poll.SubCategoryId,
        subCategoryName: poll.subCategoryName || poll.SubCategoryName,
        isPublic: poll.isPublic ?? poll.IsPublic,
        startDate: poll.startDate || poll.StartDate,
        endDate: poll.endDate || poll.EndDate,
        resultVisibility: poll.resultVisibility || poll.ResultVisibility,
        oneVotePerUser: poll.oneVotePerUser ?? poll.OneVotePerUser,
        allowVoteChange: poll.allowVoteChange ?? poll.AllowVoteChange,
        createdBy: poll.createdBy || poll.CreatedBy,
        creatorName: poll.creatorName || poll.CreatorName,
        createdDate: poll.createdDate || poll.CreatedDate || poll.createdOn || poll.CreatedOn,
        modifiedDate: poll.modifiedDate || poll.ModifiedDate,
        // Questions array
        questions: (poll.questions || poll.Questions || []).map(q => ({
          id: q.id || q.Id,
          questionText: q.questionText || q.QuestionText,
          pollType: q.pollType || q.PollType,
          minScale: q.minScale || q.MinScale,
          maxScale: q.maxScale || q.MaxScale,
          lowLabel: q.lowLabel || q.LowLabel,
          highLabel: q.highLabel || q.HighLabel,
          options: (q.options || q.Options || []).map(opt => ({
            id: opt.id || opt.Id,
            optionText: opt.optionText || opt.OptionText,
            displayOrder: opt.displayOrder || opt.DisplayOrder,
          })),
        })),
        // Vote status
        hasVoted: poll.hasVoted ?? poll.HasVoted ?? poll.userVote ?? poll.UserVote ?? false,
        voteCount: poll.voteCount || poll.VoteCount || poll.totalVotes || poll.TotalVotes || 0,
        // Tags
        tags: poll.tags || poll.Tags || [],
      };
    } catch (error) {
      console.error('Error fetching poll:', error);
      return null;
    }
  },

  /**
   * Submit vote(s) for a poll
   * @param {string} token - Auth token
   * @param {object} voteData - Vote submission matching SubmitVoteRequest schema
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  submitPollVote: async (token, voteData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/polls/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(voteData),
      });

      const response = await handleResponse(res);
      console.log('Submit vote response:', response);

      return {
        success: response.success || response.status === 200 || response.status === 201,
        error: response.error || response.message,
        ...response,
      };
    } catch (error) {
      console.error('Error submitting vote:', error);
      return {
        success: false,
        error: error.message || error.data?.message || 'Failed to submit vote',
        status: error.status,
        data: error.data,
      };
    }
  },

  /**
   * Get poll results (aggregated data)
   * @param {string} token - Auth token
   * @param {number} pollId - Poll ID
   * @param {number|null} userId - User ID (optional, for checking vote status)
   * @param {string|null} anonymousSessionId - Anonymous session ID (optional, for non-logged-in users)
   * @returns {Promise<{success: boolean, results?: object, hasUserVoted?: boolean|null, allowVoteChange?: boolean, error?: string}>}
   */
  getPollResults: async (token, pollId, userId = null, anonymousSessionId = null) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (userId) {
        params.append('userId', userId);
      }
      if (anonymousSessionId) {
        params.append('anonymousSessionId', anonymousSessionId);
      }
      const queryString = params.toString();
      const url = `${API_BASE_URL}/api/polls/results/${pollId}${queryString ? `?${queryString}` : ''}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawData = await handleResponse(res);
      
      // Normalize the response data - handle nested response structures
      // The API might return { data: { ... } } or { result: { ... } } or directly { ... }
      const data = rawData.data || rawData.result || rawData.Result || rawData;
      
      // Check for alternative response structures
      const questionsArray = data.questions || data.Questions || 
                            data.questionResults || data.QuestionResults ||
                            data.results?.questions || data.Results?.Questions || [];
      
      const totalResponsesValue = data.totalResponses || data.TotalResponses || 
                                  data.totalVotes || data.TotalVotes ||
                                  data.responseCount || data.ResponseCount ||
                                  data.voteCount || data.VoteCount || 0;
      
      // Normalize questions with results
      const normalizedQuestions = questionsArray.map(q => {
        
        const pollType = q.pollType || q.PollType;
        
        // For rating scale, extract from RatingScale object
        const ratingScaleData = q.ratingScale || q.RatingScale;
        
        // For rating scale, build options from ratingDistribution or ratings if options is empty
        let options = q.options || q.Options || [];
        
        // Handle null options
        if (options === null) options = [];
        
        const ratingDistribution = q.ratingDistribution || q.RatingDistribution || 
                                   q.ratings || q.Ratings ||
                                   q.scaleResults || q.ScaleResults ||
                                   ratingScaleData?.Distribution || ratingScaleData?.distribution;
        
        // If this is a rating poll and we have rating distribution but no options
        if ((pollType === 3 || pollType === 'RatingScale') && ratingDistribution && options.length === 0) {
          // Convert rating distribution object/array to options format
          if (Array.isArray(ratingDistribution)) {
            options = ratingDistribution.map(r => ({
              id: r.value || r.Value || r.rating || r.Rating || r.scale || r.Scale,
              value: r.value || r.Value || r.rating || r.Rating || r.scale || r.Scale,
              voteCount: r.count || r.Count || r.voteCount || r.VoteCount || r.votes || r.Votes || 0,
            }));
          } else if (typeof ratingDistribution === 'object') {
            // Object format: { "1": 5, "2": 3, ... }
            options = Object.entries(ratingDistribution).map(([value, count]) => ({
              id: parseInt(value, 10),
              value: parseInt(value, 10),
              voteCount: count,
            }));
          }
        }
        
        // Normalize options
        const normalizedOptions = options.map(opt => ({
          id: opt.id || opt.Id,
          optionText: opt.optionText || opt.OptionText,
          value: opt.value || opt.Value,
          voteCount: opt.voteCount || opt.VoteCount || opt.count || opt.Count || opt.votes || opt.Votes || 0,
        }));
        
        // Get total votes for this question
        const questionTotalVotes = q.totalVotes || q.TotalVotes || 
                                   q.responseCount || q.ResponseCount ||
                                   q.voteCount || q.VoteCount || 
                                   totalResponsesValue || 0;
        
        // Get average rating - check RatingScale object first
        const avgRating = ratingScaleData?.Average || ratingScaleData?.average ||
                         q.averageRating || q.AverageRating || 
                         q.average || q.Average ||
                         q.avgRating || q.AvgRating ||
                         q.mean || q.Mean;
        
        // Get min/max scale from RatingScale object
        const minScale = ratingScaleData?.Min || ratingScaleData?.min || q.minScale || q.MinScale || 1;
        const maxScale = ratingScaleData?.Max || ratingScaleData?.max || q.maxScale || q.MaxScale || 5;
        
        return {
          id: q.id || q.Id || q.questionId || q.QuestionId,
          questionText: q.questionText || q.QuestionText || q.text || q.Text,
          pollType: pollType,
          totalVotes: questionTotalVotes,
          averageRating: avgRating,
          minScale: minScale,
          maxScale: maxScale,
          options: normalizedOptions,
          textAnswers: q.textAnswers || q.TextAnswers || [],
        };
      });
      
      return {
        success: true,
        results: {
          pollId: data.pollId || data.PollId || pollId,
          title: data.title || data.Title,
          totalResponses: totalResponsesValue,
          questions: normalizedQuestions,
        },
        hasUserVoted: data.hasUserVoted ?? data.HasUserVoted ?? null,
        allowVoteChange: data.allowVoteChange ?? data.AllowVoteChange ?? false,
      };
    } catch (error) {
      console.error('Error fetching poll results:', error);
      // Handle 403 Forbidden - results not visible yet
      if (error.status === 403) {
        return {
          success: false,
          error: 'Results are not available yet',
          forbidden: true,
          status: error.status,
        };
      }
      return {
        success: false,
        error: error.message || 'Failed to fetch results',
        status: error.status,
      };
    }
  },

  /**
   * Check if user has already voted on a poll
   * @param {string} token - Auth token  
   * @param {number} pollId - Poll ID
   * @param {number} userId - User ID
   * @returns {Promise<{hasVoted: boolean, userAnswers?: object}>}
   */
  getUserPollVote: async (token, pollId, userId) => {
    try {
      // This would typically be returned as part of getPollById, but we check separately
      const poll = await api.getPollById(token, pollId);
      if (poll && poll.userVote) {
        return {
          hasVoted: true,
          userAnswers: poll.userVote,
        };
      }
      return { hasVoted: false };
    } catch (error) {
      console.error('Error checking user vote:', error);
      return { hasVoted: false };
    }
  },
};