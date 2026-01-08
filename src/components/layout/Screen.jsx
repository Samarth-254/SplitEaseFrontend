import { BottomNav, Sidebar } from './Navigation';

/**
 * Screen Wrapper Component
 * 
 * Provides consistent layout structure across all screens
 * - Handles safe areas
 * - Responsive padding for mobile vs desktop
 * - Bottom nav spacing on mobile
 */

export const Screen = ({
  children,
  showNav = true,
  className = '',
  padded = true,
  scrollable = true,
}) => {
  return (
    <div className="min-h-screen bg-primary-pure">
      {/* Desktop Sidebar */}
      {showNav && <Sidebar />}
      
      {/* Main Content */}
      <main className={`
        min-h-screen
        ${showNav ? 'lg:ml-64' : ''}
        ${showNav ? 'pb-20 lg:pb-0' : ''}
        ${padded ? 'px-4 py-4 lg:px-8 lg:py-6' : ''}
        ${scrollable ? '' : 'overflow-hidden'}
        ${className}
      `}>
        <div className="max-w-screen-xl mx-auto">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Nav */}
      {showNav && <BottomNav />}
    </div>
  );
};

/**
 * Auth Screen Layout - No navigation
 */
export const AuthScreen = ({ children, className = '' }) => {
  return (
    <div className={`
      min-h-screen
      bg-primary-pure
      flex flex-col
      ${className}
    `}>
      {children}
    </div>
  );
};




