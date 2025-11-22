export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 number
  const re = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return re.test(password);
};

export const validateArticleTitle = (title) => {
  return title && title.trim().length >= 5 && title.length <= 200;
};

export const validateArticleContent = (content) => {
  return content && content.trim().length >= 50;
};

export const validateArticleType = (type) => {
  const validTypes = [
    'TECH', 'BUSINESS', 'LIFESTYLE', 'HEALTH',
    'SCIENCE', 'ENTERTAINMENT', 'SPORTS', 'EDUCATION'
  ];
  return validTypes.includes(type);
};