const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:7083';

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

  updateArticle: async (token, id, data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/articles/${id}`, {
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
      const res = await fetch(`${API_BASE_URL}/api/articles/${id}`, {
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
        `${API_BASE_URL}/api/articles/search?query=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await handleResponse(res);
      return Array.isArray(data) ? data : data.articles || [];
    } catch (error) {
      console.error('Error searching articles:', error);
      return [];
    }
  },

  // ==================== LIKE ENDPOINTS ====================
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

  // ==================== CATEGORY ENDPOINTS ====================
  getCategories: async () => {
    try {
      if (isCacheValid('categories') && cache.categories) {
        console.log('Returning cached categories');
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
      return Array.isArray(data) ? data : [];
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
  getComments: async (token, articleId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/comment/article/${articleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await handleResponse(res);
      return data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return { comments: [] };
    }
  },

  createComment: async (token, articleId, content, userId) => {
    try {
      console.log('Creating comment:', { articleId, userId, content });
      
      const res = await fetch(
        `${API_BASE_URL}/api/comment/article/${articleId}?userId=${userId}`,
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
      console.log('Create comment response:', response);
      
      return {
        success: response.success || response.status === 200 || response.status === 201,
        id: response.id || response.commentId,
        creatorName: response.creatorName,
        creatorEmail: response.creatorEmail,
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
      return Array.isArray(data) ? data : [];
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
};