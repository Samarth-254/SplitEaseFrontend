/**
 * Badge Component
 * 
 * Small status indicator or label
 * Used for amounts, statuses, counts
 */

const variants = {
  default: 'bg-primary-800 text-neutral-300 border border-border',
  positive: 'bg-green-950/50 text-green-400 border border-green-900/50',
  negative: 'bg-red-950/50 text-red-400 border border-red-900/50',
  warning: 'bg-orange-950/50 text-orange-400 border border-orange-900/50',
  info: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
  accent: 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/30',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) => {
  return (
    <span className={`
      inline-flex items-center gap-1.5
      font-medium
      rounded-full
      ${variants[variant]}
      ${sizes[size]}
      ${className}
    `}>
      {dot && (
        <span className={`
          w-1.5 h-1.5 rounded-full
          ${variant === 'positive' ? 'bg-green-400' : ''}
          ${variant === 'negative' ? 'bg-red-400' : ''}
          ${variant === 'warning' ? 'bg-orange-400' : ''}
          ${variant === 'accent' ? 'bg-secondary-400' : ''}
          ${variant === 'default' || variant === 'info' ? 'bg-neutral-400' : ''}
        `} />
      )}
      {children}
    </span>
  );
};

/**
 * Amount Badge - Specifically for displaying money amounts
 */
export const AmountBadge = ({ amount, showSign = true, className = '' }) => {
  const isPositive = amount >= 0;
  const variant = amount === 0 ? 'info' : isPositive ? 'positive' : 'negative';
  const sign = showSign && amount !== 0 ? (isPositive ? '+' : '') : '';
  
  return (
    <Badge variant={variant} className={className}>
      {sign}₹{Math.abs(amount).toFixed(2)}
    </Badge>
  );
};





