import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Input Component
 * 
 * Features:
 * - Large touch targets for mobile
 * - Clear visual states (focus, error, disabled)
 * - Password visibility toggle
 * - Icon support (left and right)
 * - Floating label option
 */

export const Input = forwardRef(({
  label,
  error,
  hint,
  icon,
  iconRight,
  type = 'text',
  className = '',
  inputClassName = '',
  fullWidth = true,
  size = 'md',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const sizes = {
    sm: 'h-10 text-sm',
    md: 'h-12 text-base',
    lg: 'h-14 text-lg',
  };

  const baseInputStyles = `
    w-full
    bg-primary-800
    border border-border
    rounded-xl
    px-4
    text-neutral-100
    placeholder:text-neutral-500
    transition-all duration-200
    focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/50
    disabled:opacity-50 disabled:cursor-not-allowed
    ${icon ? 'pl-11' : ''}
    ${iconRight || isPassword ? 'pr-11' : ''}
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}
    ${sizes[size]}
  `;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={`${baseInputStyles} ${inputClassName}`}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
        
        {iconRight && !isPassword && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">
            {iconRight}
          </div>
        )}
      </div>
      
      {(error || hint) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-red-400' : 'text-neutral-500'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

/**
 * Select Component
 */
export const Select = forwardRef(({
  label,
  error,
  hint,
  icon,
  options = [],
  className = '',
  fullWidth = true,
  size = 'md',
  placeholder = 'Select an option',
  ...props
}, ref) => {
  const sizes = {
    sm: 'h-10 text-sm',
    md: 'h-12 text-base',
    lg: 'h-14 text-lg',
  };

  const baseStyles = `
    w-full
    bg-primary-800
    border border-border
    rounded-xl
    px-4
    text-neutral-100
    transition-all duration-200
    focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/50
    disabled:opacity-50 disabled:cursor-not-allowed
    appearance-none
    cursor-pointer
    ${icon ? 'pl-11' : ''}
    pr-10
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}
    ${sizes[size]}
  `;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
            {icon}
          </div>
        )}
        
        <select ref={ref} className={baseStyles} {...props}>
          <option value="" disabled>{placeholder}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.427 6.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 6H4.604a.25.25 0 00-.177.427z" />
          </svg>
        </div>
      </div>
      
      {(error || hint) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-red-400' : 'text-neutral-500'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';




