import React from 'react';

/**
 * EmptyState - Display when there's no content to show
 * 
 * @param {string} icon - Emoji or icon character
 * @param {string} title - Main message
 * @param {string} description - Secondary description
 * @param {React.ReactNode} action - Optional action button
 * @param {string} className - Additional CSS classes
 */
function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      {icon && <div className="empty-state__icon">{icon}</div>}
      {title && <h3 className="empty-state__title">{title}</h3>}
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}

export default EmptyState;
