import React from 'react';

/**
 * AppShell - The root layout container for the application
 * 
 * Provides the basic structure: header, main content area, and optional footer.
 * This component ensures consistent full-height layout across all pages.
 * 
 * @param {React.ReactNode} header - Navigation/header component
 * @param {React.ReactNode} children - Main content
 * @param {React.ReactNode} footer - Optional footer component
 * @param {string} className - Additional CSS classes
 */
function AppShell({ header, children, footer, className = '' }) {
  return (
    <div className={`app-shell ${className}`}>
      {header && (
        <div className="app-shell__header">
          {header}
        </div>
      )}
      
      <main className="app-shell__main">
        {children}
      </main>
      
      {footer && (
        <footer className="app-shell__footer">
          {footer}
        </footer>
      )}
    </div>
  );
}

export default AppShell;
