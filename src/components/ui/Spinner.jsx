import React from 'react';

/**
 * Spinner - Loading indicator
 * 
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} className - Additional CSS classes
 */
function Spinner({ size = 'md', className = '' }) {
  const classes = [
    'spinner',
    size !== 'md' && `spinner--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  );
}

export default Spinner;
