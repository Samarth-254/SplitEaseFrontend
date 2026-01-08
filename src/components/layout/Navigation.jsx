import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Users, Plus, Receipt, User, LogOut } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useState } from 'react';
import { Modal, Button } from '../ui';
import { AddExpenseModal } from '../../screens/expense/AddExpenseModal';

/**
 * Bottom Navigation
 * 
 * Mobile-first bottom navigation bar
 * - Large touch targets (48px min)
 * - Clear active states
 * - Safe area padding for notched devices
 */

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/groups', icon: Users, label: 'Groups' },
  { path: '/add-expense', icon: Plus, label: 'Add', isAction: true },
  { path: '/activity', icon: Receipt, label: 'Activity' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export const BottomNav = () => {
  const location = useLocation();
  const [showAddExpense, setShowAddExpense] = useState(false);
  
  return (
    <>
      <nav className="
        fixed bottom-0 left-0 right-0
        bg-primary-950/95 backdrop-blur-lg
        border-t border-border
        safe-bottom
        z-[--z-sticky]
        lg:hidden
      ">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {navItems.map(({ path, icon: Icon, label, isAction }) => {
            const isActive = location.pathname === path || 
              (path === '/groups' && location.pathname.startsWith('/group/'));
            
            if (isAction) {
              return (
                <button
                  key={path}
                  onClick={() => setShowAddExpense(true)}
                  className="flex items-center justify-center -mt-4"
                >
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="
                      w-14 h-14
                      bg-secondary-500
                      rounded-full
                      flex items-center justify-center
                      shadow-lg shadow-secondary-500/30
                    "
                  >
                    <Icon size={24} className="text-black" strokeWidth={2.5} />
                  </motion.div>
                </button>
              );
            }
            
            return (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => `
                  relative
                  flex flex-col items-center justify-center
                  w-16 h-full
                  transition-colors duration-200
                  ${isActive ? 'text-secondary-500' : 'text-neutral-500'}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 w-8 h-0.5 bg-secondary-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs mt-1 font-medium">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
      
      {/* Add Expense Modal */}
      <AddExpenseModal 
        isOpen={showAddExpense} 
        onClose={() => setShowAddExpense(false)} 
      />
    </>
  );
};

/**
 * Desktop Sidebar Navigation
 */
export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getTotalBalance, currentUser, logout } = useStore();
  const balance = getTotalBalance();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const sidebarItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/groups', icon: Users, label: 'Groups' },
    { path: '/activity', icon: Receipt, label: 'Activity' },
  ];

  return (
    <aside className="
      hidden lg:flex
      flex-col
      w-64
      h-screen
      bg-primary-950
      border-r border-border
      fixed left-0 top-0
      z-[--z-sticky]
    ">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
          <span className="text-2xl">💸</span>
          SplitEase
        </h1>
      </div>
      
      {/* Balance Summary */}
      {/* <div className="p-4 mx-4 mt-4 rounded-xl bg-primary-900 border border-border">
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Your Balance</p>
        <p className={`text-2xl font-bold ?${balance.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {balance.netBalance >= 0 ? '+' : '-'}?${Math.abs(balance.netBalance).toFixed(2)}
        </p>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="text-green-400">+?${balance.totalOwed.toFixed(2)} owed</span>
          <span className="text-red-400">-?${balance.totalOwing.toFixed(2)} owing</span>
        </div>
      </div> */}
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {sidebarItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path ||
            (path === '/groups' && location.pathname.startsWith('/group/'));
          
          return (
            <NavLink
              key={path}
              to={path}
              className={`
                flex items-center gap-3
                px-4 py-3
                rounded-xl
                font-medium
                transition-colors duration-200
                ${isActive 
                  ? 'bg-secondary-500/10 text-secondary-500' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-primary-800'
                }
              `}
            >
              <Icon size={20} />
              {label}
            </NavLink>
          );
        })}
        
        {/* Add Expense Button */}
        {/* <button
          type="button"
          onClick={() => setShowAddExpense(true)}
          className="
            flex items-center justify-center gap-2
            mt-4 px-4 py-3
            bg-secondary-500 hover:bg-secondary-600
            text-black font-semibold
            rounded-xl
            transition-colors duration-200
          "
        >
          <Plus size={20} />
          Add Expense
        </button> */}
      </nav>
      
      {/* User */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <NavLink 
            to="/profile"
            className="flex items-center gap-3 flex-1 hover:bg-primary-800 rounded-xl p-2 transition-colors min-w-0"
          >
            {currentUser?.profileImage ? (
              <img 
                src={currentUser.profileImage} 
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-200 truncate">
                {currentUser?.name || 'User'}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {currentUser?.email || 'user@email.com'}
              </p>
            </div>
          </NavLink>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-2 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors flex-shrink-0"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Sign Out"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        }
      >
        <p className="text-neutral-300">
          Are you sure you want to sign out? You'll need to sign in again to access your account.
        </p>
      </Modal>

      {/* Add Expense Modal */}
      <AddExpenseModal 
        isOpen={showAddExpense} 
        onClose={() => setShowAddExpense(false)} 
      />
    </aside>
  );
};





