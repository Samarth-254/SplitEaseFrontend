import { forwardRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Button Component
 * 
 * Variants:
 * - primary: Orange background, used for main CTAs
 * - secondary: Dark background with border, used for secondary actions
 * - ghost: Transparent, used for tertiary actions
 * - danger: Red tinted, used for destructive actions
 * 
 * Sizes:
 * - sm: Small buttons, icons
 * - md: Default size
 * - lg: Large CTAs, primary actions
 */

const variants = {
  primary: 'bg-secondary-500 hover:bg-secondary-600 active:bg-secondary-700 text-black font-semibold shadow-md hover:shadow-lg',
  secondary: 'bg-primary-800 hover:bg-primary-700 active:bg-primary-600 text-neutral-100 border border-border-light',
  ghost: 'bg-transparent hover:bg-primary-800 active:bg-primary-700 text-neutral-300 hover:text-neutral-100',
  danger: 'bg-red-950/50 hover:bg-red-900/50 active:bg-red-800/50 text-red-400 border border-red-900/50',
};

const sizes = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
  xl: 'h-14 px-8 text-lg gap-3 rounded-2xl',
  icon: 'h-10 w-10 rounded-xl',
  'icon-sm': 'h-8 w-8 rounded-lg',
  'icon-lg': 'h-12 w-12 rounded-xl',
};

export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  as: Component = 'button',
  ...props
}, ref) => {
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    select-none
    ${fullWidth ? 'w-full' : ''}
  `;

  const MotionComponent = motion.create(Component);

  return (
    <MotionComponent
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
        </>
      )}
    </MotionComponent>
  );
});

Button.displayName = 'Button';




