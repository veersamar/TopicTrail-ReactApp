import React from 'react';

/**
 * ContentLayout - Three-column layout with optional sidebars
 * 
 * Provides a flexible layout system with:
 * - Optional left sidebar (navigation, filters)
 * - Main content area (flexible width)
 * - Optional right sidebar (widgets, ads)
 * 
 * Sidebars are sticky and hide responsively on smaller screens.
 * 
 * @param {React.ReactNode} sidebar - Left sidebar content
 * @param {React.ReactNode} children - Main content
 * @param {React.ReactNode} aside - Right sidebar content
 * @param {boolean} hideSidebars - Force hide both sidebars
 * @param {string} className - Additional CSS classes
 */
function ContentLayout({ 
  sidebar, 
  children, 
  aside, 
  hideSidebars = false,
  className = '' 
}) {
  return (
    <div className={`content-layout ${className}`.trim()}>
      {/* Left Sidebar */}
      {sidebar && !hideSidebars && (
        <aside className="content-layout__sidebar hide-mobile">
          {sidebar}
        </aside>
      )}

      {/* Main Content Area */}
      <div className="content-layout__main">
        {children}
      </div>

      {/* Right Sidebar */}
      {aside && !hideSidebars && (
        <aside className="content-layout__aside">
          {aside}
        </aside>
      )}
    </div>
  );
}

export default ContentLayout;
