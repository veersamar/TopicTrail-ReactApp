import React from 'react';

/**
 * Alert - Contextual feedback messages
 * 
 * @param {string} variant - 'info' | 'success' | 'warning' | 'error'
 * @param {string} title - Optional alert title
 * @param {React.ReactNode} children - Alert message content
 * @param {boolean} dismissible - Show dismiss button
 * @param {function} onDismiss - Optional dismiss handler
 * @param {string} className - Additional CSS classes
 */
function Alert({ 
  variant = 'info', 
  title, 
  children, 
  dismissible,
  onDismiss, 
  className = '' 
}) {
  const icons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    error: '✕'
  };

  const showDismiss = dismissible || onDismiss;

  const classes = [
    'alert',
    `alert--${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="alert">
      <span className="alert__icon">{icons[variant]}</span>
      <div className="alert__content">
        {title && <div className="alert__title">{title}</div>}
        <div>{children}</div>
      </div>
      {showDismiss && (
        <button 
          className="alert__dismiss btn btn--ghost btn--icon btn--sm" 
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default Alert;
