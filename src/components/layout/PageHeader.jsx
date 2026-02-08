import React from 'react';

/**
 * PageHeader - Consistent page title area with optional description and actions
 * 
 * @param {string} title - Main page title
 * @param {string} description - Optional description text
 * @param {React.ReactNode} actions - Optional action buttons
 * @param {string} className - Additional CSS classes
 */
function PageHeader({ title, description, actions, className = '' }) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-header__title">{title}</h1>
          {description && (
            <p className="page-header__description">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="page-header__actions">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

export default PageHeader;
