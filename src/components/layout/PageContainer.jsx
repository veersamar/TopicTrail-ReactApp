import React from 'react';

/**
 * PageContainer - Constrains content to a maximum width with responsive padding
 * 
 * Use this component to wrap page content for consistent horizontal margins
 * and maximum width constraints.
 * 
 * @param {React.ReactNode} children - Content to constrain
 * @param {string} size - Container size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'prose'
 * @param {string} className - Additional CSS classes
 */
function PageContainer({ children, size = 'xl', className = '', ...props }) {
  const sizeClass = size === 'xl' ? '' : `page-container--${size}`;
  
  return (
    <div 
      className={`page-container ${sizeClass} ${className}`.trim()} 
      {...props}
    >
      {children}
    </div>
  );
}

export default PageContainer;
