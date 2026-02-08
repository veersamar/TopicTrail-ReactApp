import React from 'react';

/**
 * Button - Enterprise button component with multiple variants
 * 
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'danger'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} fullWidth - Make button full width
 * @param {boolean} loading - Show loading state
 * @param {boolean} disabled - Disable the button
 * @param {boolean} iconOnly - Button contains only an icon
 * @param {React.ReactNode} leftIcon - Icon before text
 * @param {React.ReactNode} rightIcon - Icon after text
 * @param {React.ReactNode} children - Button content
 * @param {string} className - Additional CSS classes
 * @param {string} type - Button type attribute
 * @param {function} onClick - Click handler
 */
function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  iconOnly = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    fullWidth && 'btn--full',
    loading && 'btn--loading',
    iconOnly && 'btn--icon',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      aria-disabled={disabled || loading}
      {...props}
    >
      {leftIcon && !loading && <span className="btn__icon-left">{leftIcon}</span>}
      {children}
      {rightIcon && !loading && <span className="btn__icon-right">{rightIcon}</span>}
    </button>
  );
}

export default Button;
