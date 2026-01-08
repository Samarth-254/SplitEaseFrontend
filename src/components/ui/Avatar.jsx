import { forwardRef } from 'react';

/**
 * Avatar Component
 * 
 * Displays user avatar with fallback to initials
 * Multiple sizes for different contexts
 */

const sizes = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-20 w-20 text-xl',
};

// Generate consistent color based on name
const getAvatarColor = (name) => {
  const colors = [
    'bg-orange-600',
    'bg-amber-600',
    'bg-yellow-600',
    'bg-neutral-600',
    'bg-stone-600',
    'bg-orange-700',
    'bg-amber-700',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name) => {
  if (!name) return '?';
  
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const Avatar = forwardRef(({
  src,
  name = '',
  size = 'md',
  className = '',
  showRing = false,
  isCurrentUser = false,
  ...props
}, ref) => {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);
  
  const baseStyles = `
    inline-flex items-center justify-center
    rounded-full
    font-semibold
    select-none
    flex-shrink-0
    ${showRing ? 'ring-2 ring-secondary-500 ring-offset-2 ring-offset-primary-900' : ''}
    ${isCurrentUser ? 'ring-2 ring-secondary-500' : ''}
  `;

  if (src) {
    return (
      <img
        ref={ref}
        src={src}
        alt={name}
        className={`${baseStyles} ${sizes[size]} object-cover ${className}`}
        {...props}
      />
    );
  }

  return (
    <div
      ref={ref}
      className={`${baseStyles} ${sizes[size]} ${bgColor} text-white ${className}`}
      title={name}
      {...props}
    >
      {initials}
    </div>
  );
});

Avatar.displayName = 'Avatar';

/**
 * Avatar Group - Shows multiple avatars stacked
 */
export const AvatarGroup = ({ users = [], max = 4, size = 'md', className = '' }) => {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;
  
  const overlapSizes = {
    xs: '-ml-2',
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-4',
    xl: '-ml-5',
    '2xl': '-ml-6',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {visibleUsers.map((user, index) => (
        <Avatar
          key={user.id || user._id}
          name={user.name}
          src={user.profileImage || user.avatar}
          size={size}
          className={`${index > 0 ? overlapSizes[size] : ''} border-2 border-primary-900`}
        />
      ))}
      
      {remainingCount > 0 && (
        <div className={`
          ${sizes[size]}
          ${overlapSizes[size]}
          inline-flex items-center justify-center
          rounded-full
          bg-primary-700
          border-2 border-primary-900
          text-neutral-300
          font-medium
        `}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
};




