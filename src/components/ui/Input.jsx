import React, { forwardRef } from 'react';

/**
 * Input - Form input component with consistent styling
 * 
 * @param {string} label - Label text
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean|string} error - Show error state or error message
 * @param {string} hint - Helper text below input
 * @param {string} className - Additional CSS classes
 */
const Input = forwardRef(function Input({
  label,
  size = 'md',
  error = false,
  hint,
  className = '',
  type = 'text',
  id,
  ...props
}, ref) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : null;

  const inputClasses = [
    'input',
    size !== 'md' && `input--${size}`,
    hasError && 'input--error',
  ].filter(Boolean).join(' ');

  // If no label, render just the input
  if (!label) {
    return (
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`${inputClasses} ${className}`}
        aria-invalid={hasError}
        {...props}
      />
    );
  }

  // With label, render full form group
  return (
    <div className={`form-group ${className}`}>
      <label htmlFor={inputId} className="form-label">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={inputClasses}
        aria-invalid={hasError}
        aria-describedby={errorMessage ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {errorMessage && (
        <span id={`${inputId}-error`} className="form-error" role="alert">
          {errorMessage}
        </span>
      )}
      {hint && !errorMessage && (
        <span id={`${inputId}-hint`} className="form-hint">
          {hint}
        </span>
      )}
    </div>
  );
});

export default Input;
