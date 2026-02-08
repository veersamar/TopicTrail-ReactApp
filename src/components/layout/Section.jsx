import React from 'react';

/**
 * Section - Consistent section spacing and structure
 * 
 * @param {string} title - Optional section title
 * @param {string} subtitle - Optional subtitle/description
 * @param {React.ReactNode} actions - Optional action buttons
 * @param {React.ReactNode} children - Section content
 * @param {string} className - Additional CSS classes
 */
function Section({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`section ${className}`.trim()}>
      {(title || actions) && (
        <div className="section__header">
          <div>
            {title && <h2 className="section__title">{title}</h2>}
            {subtitle && <p className="section__subtitle">{subtitle}</p>}
          </div>
          {actions && (
            <div className="section__actions">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <div className="section__content">
        {children}
      </div>
    </section>
  );
}

export default Section;
