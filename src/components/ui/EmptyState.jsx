import { Button } from './Button';

/**
 * Empty State Component
 * 
 * Used when there's no content to display
 * Provides clear messaging and optional CTA
 */

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`
      flex flex-col items-center justify-center
      text-center
      py-12 px-6
      ${className}
    `}>
      {icon && (
        <div className="mb-4 p-4 rounded-2xl bg-primary-800/50 text-neutral-500">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-neutral-200 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-neutral-500 max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {action && (
        action
      )}
      
      {!action && actionLabel && onAction && (
        <Button onClick={onAction} size="lg">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};



