import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ThemeToggle - Button to switch between light and dark themes
 * 
 * @param {string} className - Additional CSS classes
 */
function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      className={`btn btn--ghost btn--icon ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <span role="img" aria-hidden="true">☀️</span>
      ) : (
        <span role="img" aria-hidden="true">🌙</span>
      )}
    </button>
  );
}

export default ThemeToggle;
