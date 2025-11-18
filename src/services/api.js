const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:7083';

export const api = {
  // ==================== AUTH ENDPOINTS ====================
  login: async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe: true }),
      });
      const data = await res.json();
      return { success: res.ok, ...data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  register: async (userData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      return { success: res.ok, ...data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  verifyOtp: async (identifier, otpCode) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/auth/verify-otp?identifier=${identifier}&otpCode=${otpCode}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await res.json();
      return { success: res.ok, ...data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ==================== ARTICLE ENDPOINTS ====================
  getArticles: async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article/home?pageNumber=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });          
            
      const data = await res.json();      
      return Array.isArray(data.articles) ? data.articles : [];
    } catch (error) {
      console.error('Error fetching articles:', error);
      return [];
    }
  },

  getArticleById: async (token, id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/articles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    } catch (error) {
      return null;
    }
  },

  createArticle: async (token, data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article/createarticle?userId=2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      return { success: res.ok, ...result };
    } catch (error) {
      return { success: false, error: error.message };
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
      return { success: res.ok };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  deleteArticle: async (token, id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/articles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: res.ok };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  searchArticles: async (token, query) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/articles/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    } catch (error) {
      return [];
    }
  },

  // ==================== LIKE ENDPOINTS ====================
  likeArticle: async (token, articleId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article/${articleId}/like?userId=3`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: res.ok };
    } catch (error) {
      return { success: false };
    }
  },

  unlikeArticle: async (token, articleId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/article/${articleId}/like?userId=3`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: res.ok };
    } catch (error) {
      return { success: false };
    }
  },

  // ==================== CATEGORY ENDPOINTS ====================
  getCategories: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/category/categories`);
      const data = await res.json();      
      return Array.isArray(data.data) ? data.data : [];      
    } catch (error) {
      return [];
    }
  },

  getSubCategories: async (categoryId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/category/subCategoriesByCategory?category=${categoryId}`
      );
      const data = await res.json();      
      return Array.isArray(data.data) ? data.data : [];      
    } catch (error) {
      return [];
    }
  },

  // ==================== MASTER DATA ENDPOINTS ====================
  getMasterData: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/masterdata/all`);
      const data = await res.json();      
      //return Array.isArray(data) ? data : [];
      return data;
    } catch (error) {
      console.error('Error fetching master data:', error);
      return [];
    }
  },

  getMasterDataByType: async (type) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/masterdata/${type}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error fetching master data for type ${type}:`, error);
      return [];
    }
  },

  // ==================== COMMENT ENDPOINTS ====================
  getComments: async (token, articleId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/comments/article/${articleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return await res.json();
    } catch (error) {
      return [];
    }
  },

  createComment: async (token, articleId, content) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/comments/article/${articleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      return { success: res.ok };
    } catch (error) {
      return { success: false };
    }
  },

  // ==================== USER ENDPOINTS ====================
  getUserProfile: async (token, userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    } catch (error) {
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
      return { success: res.ok };
    } catch (error) {
      return { success: false };
    }
  },

  getLoginHistory: async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/login-sessions/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    } catch (error) {
      return [];
    }
  },

  // ==================== HEALTH CHECK ====================
  healthCheck: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      return res.ok;
    } catch (error) {
      return false;
    }
  },
};