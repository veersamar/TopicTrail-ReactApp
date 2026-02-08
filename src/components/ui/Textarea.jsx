import React, { forwardRef } from 'react';

/**
 * Textarea - Multi-line text input with consistent styling
 * 
 * @param {boolean} error - Show error state
 * @param {string} className - Additional CSS classes
 * @param {number} rows - Number of visible text lines
 */
const Textarea = forwardRef(function Textarea({
  error = false,
  className = '',
  rows = 4,
  ...props
}, ref) {
  const classes = [
    'textarea',
    error && 'input--error',
    className
  ].filter(Boolean).join(' ');

  return (
    <textarea
      ref={ref}
      rows={rows}
      className={classes}
      {...props}
    />
  );
});

export default Textarea;
