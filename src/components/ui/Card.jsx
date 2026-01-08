import { forwardRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Card Component
 * 
 * Container for content with consistent styling
 * Supports different variants and interactive states
 */

const variants = {
  default: 'bg-primary-900 border border-border',
  elevated: 'bg-surface-elevated border border-border shadow-lg',
  ghost: 'bg-transparent',
  interactive: 'bg-primary-900 border border-border hover:border-border-light hover:bg-primary-800 cursor-pointer transition-colors',
};

export const Card = forwardRef(({
  children,
  variant = 'default',
  className = '',
  padding = 'md',
  rounded = 'xl',
  as: Component = 'div',
  animate = false,
  ...props
}, ref) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
    xl: 'p-6',
  };
  
  const roundings = {
    none: '',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
  };

  const baseStyles = `${variants[variant]} ${paddings[padding]} ${roundings[rounded]}`;
  
  if (animate) {
    return (
      <motion.div
        ref={ref}
        className={`${baseStyles} ${className}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <Component
      ref={ref}
      className={`${baseStyles} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
});

Card.displayName = 'Card';

/**
 * Card Header
 */
export const CardHeader = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    {children}
  </div>
);

/**
 * Card Title
 */
export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-neutral-100 ${className}`}>
    {children}
  </h3>
);

/**
 * Card Description
 */
export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-neutral-400 ${className}`}>
    {children}
  </p>
);

/**
 * Card Content
 */
export const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

/**
 * Card Footer
 */
export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-border flex items-center justify-end gap-3 ${className}`}>
    {children}
  </div>
);



