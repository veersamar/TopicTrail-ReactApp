import React from 'react';

/**
 * Card - Container component for grouping related content
 * 
 * @param {boolean} elevated - Add shadow elevation
 * @param {boolean} interactive - Add hover/focus states
 * @param {boolean} compact - Reduced padding
 * @param {React.ReactNode} header - Card header content
 * @param {React.ReactNode} children - Card body content
 * @param {React.ReactNode} footer - Card footer content
 * @param {string} className - Additional CSS classes
 * @param {function} onClick - Click handler (for interactive cards)
 */
function Card({
  elevated = false,
  interactive = false,
  compact = false,
  header,
  children,
  footer,
  className = '',
  onClick,
  ...props
}) {
  const classes = [
    'card',
    elevated && 'card--elevated',
    interactive && 'card--interactive',
    compact && 'card--compact',
    className
  ].filter(Boolean).join(' ');

  const CardWrapper = interactive ? 'button' : 'div';

  return (
    <CardWrapper 
      className={classes} 
      onClick={interactive ? onClick : undefined}
      {...props}
    >
      {header && <div className="card__header">{header}</div>}
      {children && <div className="card__body">{children}</div>}
      {footer && <div className="card__footer">{footer}</div>}
    </CardWrapper>
  );
}

// Named export for simple card body without header/footer structure
export function CardSimple({ elevated, interactive, className = '', children, ...props }) {
  const classes = [
    'card',
    elevated && 'card--elevated',
    interactive && 'card--interactive',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      <div className="card__body">{children}</div>
    </div>
  );
}

export default Card;
