import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreVertical } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * Header Component
 * 
 * Page header with optional back button
 * Used on detail screens
 */

export const Header = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  rightIcon,
  onRightAction,
  transparent = false,
  className = '',
}) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={`
      sticky top-0
      z-[--z-sticky]
      ${transparent ? 'bg-transparent' : 'bg-primary-pure/95 backdrop-blur-lg border-b border-border'}
      ${className}
    `}>
      <div className="flex items-center justify-between h-14 px-4 max-w-screen-xl mx-auto lg:px-6">
        {/* Left - Back button or spacer */}
        <div className="w-10 flex justify-start">
          {showBack && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleBack}
              className="text-neutral-300 hover:text-neutral-100 -ml-2"
            >
              <ChevronLeft size={24} />
            </Button>
          )}
        </div>
        
        {/* Center - Title */}
        <div className="flex-1 text-center min-w-0 px-2">
          <h1 className="text-base font-semibold text-neutral-100 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-neutral-500 truncate">{subtitle}</p>
          )}
        </div>
        
        {/* Right - Action button or spacer */}
        <div className="w-10 flex justify-end">
          {(rightAction || onRightAction) && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onRightAction}
              className="text-neutral-300 hover:text-neutral-100 -mr-2"
            >
              {rightIcon || <MoreVertical size={20} />}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

/**
 * Page Title - Used at top of main pages
 */
export const PageTitle = ({ 
  title, 
  subtitle, 
  action,
  className = '' 
}) => {
  return (
    <div className={`flex items-start justify-between mb-6 ${className}`}>
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-neutral-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
};




