import React from 'react';

/**
 * ArticleLayout - Optimized single-column layout for reading long-form content
 * 
 * Provides optimal line length (60-75ch), generous spacing, and clear content hierarchy.
 * 
 * @param {React.ReactNode} header - Article header (title, meta, author)
 * @param {React.ReactNode} children - Article content
 * @param {React.ReactNode} footer - Article footer (tags, actions, related)
 * @param {string} className - Additional CSS classes
 */
function ArticleLayout({ header, children, footer, className = '' }) {
  return (
    <article className={`article-layout ${className}`.trim()}>
      {header && (
        <header className="article-layout__header">
          {header}
        </header>
      )}
      
      <div className="article-layout__content prose">
        {children}
      </div>
      
      {footer && (
        <footer className="article-layout__footer">
          {footer}
        </footer>
      )}
    </article>
  );
}

export default ArticleLayout;
