import React from 'react';

/**
 * Divider - Visual separator between content sections
 * 
 * @param {boolean} subtle - Use lighter color
 * @param {boolean} thick - Make line thicker
 * @param {string} className - Additional CSS classes
 */
function Divider({ subtle = false, thick = false, className = '' }) {
  const classes = [
    'divider',
    subtle && 'divider--subtle',
    thick && 'divider--thick',
    className
  ].filter(Boolean).join(' ');

  return <hr className={classes} />;
}

export default Divider;
