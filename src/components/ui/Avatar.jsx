import React from 'react';

/**
 * Avatar - User avatar component with fallback to initials
 * 
 * @param {string} src - Image URL
 * @param {string} alt - Alt text for image
 * @param {string} name - User name (used for fallback initials)
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} className - Additional CSS classes
 */
function Avatar({ src, alt, name, size = 'md', className = '', ...props }) {
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const classes = [
    'avatar',
    size !== 'md' && `avatar--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {src ? (
        <img src={src} alt={alt || name || 'Avatar'} />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

export default Avatar;
