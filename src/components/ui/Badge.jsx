import React from 'react';

/**
 * Badge - Small label for status, categories, or counts
 * 
 * @param {string} variant - 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'tag'
 * @param {React.ReactNode} children - Badge content
 * @param {string} className - Additional CSS classes
 */
function Badge({ variant = 'default', children, className = '', ...props }) {
  const classes = [
    'badge',
    `badge--${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}

export default Badge;
