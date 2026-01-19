import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import { useStore } from './store/useStore';
import {
  LoginScreen,
  SignupScreen,
  DashboardScreen,
  GroupsScreen,
  GroupDetailScreen,
  JoinGroupScreen,
  AddExpenseScreen,
  SettleUpScreen,
  ActivityScreen,
  ProfileScreen,
} from './screens';
import { FriendsScreen } from './screens/friends';
import { NotificationPrompt } from './components/NotificationPrompt';
import { InstallPrompt } from './components/InstallPrompt';
import { usePWAInstall } from './utils/usePWAInstall';
import pushNotificationService from './services/pushNotification';
import { InstallInstructionsModal } from './components/InstallInstructionsModal';

// Component to track route changes for Google Analytics
const RouteChangeTracker = () => {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({ 
      hitType: "pageview", 
      page: location.pathname + location.search 
    });
  }, [location]);

  return null;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const { initializeAuth, isInitialLoadComplete, isAuthenticated } = useStore();
  
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [notificationPromptDismissed, setNotificationPromptDismissed] = useState(false);
  const { isInstallable, showInstructionsModal, closeInstructionsModal } = usePWAInstall();

  // Initialize Google Analytics
  useEffect(() => {
    const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
    
    if (GA_MEASUREMENT_ID) {
      ReactGA.initialize(GA_MEASUREMENT_ID, {
        gaOptions: {
          siteSpeedSampleRate: 100
        }
      });
    } else {
      console.warn('⚠️ GA Measurement ID not found in environment variables');
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, []);

  // ✅ Show NOTIFICATION prompt first (after 5 seconds)
  useEffect(() => {
    if (!isAuthenticated) {
      setShowNotificationPrompt(false);
      return;
    }

    // Only show if permission is default (not granted or denied)
    if (!pushNotificationService.isPermissionDefault()) {
      setNotificationPromptDismissed(true);
      return;
    }

    // Check when last dismissed
    const lastDismissed = localStorage.getItem('notification-prompt-dismissed');
    const now = Date.now();
    
    if (lastDismissed) {
      const timeSinceDismissed = now - parseInt(lastDismissed);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (timeSinceDismissed < twentyFourHours) {
        setNotificationPromptDismissed(true);
        return;
      }
    }

    // Show prompt after 5 seconds
    const timer = setTimeout(() => {
      setShowNotificationPrompt(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // ✅ Show INSTALL prompt AFTER notification is dismissed (with 5 second cooldown)
  useEffect(() => {
    if (!isAuthenticated || !isInstallable) {
      setShowInstallPrompt(false);
      return;
    }

    // ✅ ONLY show if notification prompt has been dismissed/handled
    if (!notificationPromptDismissed) {
      return;
    }

    // Check when last dismissed
    const lastDismissed = localStorage.getItem('install-prompt-dismissed');
    const now = Date.now();
    
    if (lastDismissed) {
      const timeSinceDismissed = now - parseInt(lastDismissed);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (timeSinceDismissed < twentyFourHours) {
        return;
      }
    }

    // ✅ Show prompt 5 seconds AFTER notification is dismissed
    const timer = setTimeout(() => {
      setShowInstallPrompt(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, notificationPromptDismissed, isInstallable]);

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
    
    ReactGA.event({
      category: 'PWA',
      action: 'Install Prompt Dismissed'
    });
  };

  // ✅ Handle Notifications
  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const granted = await pushNotificationService.requestPermission();
        if (granted) {
          ReactGA.event({
            category: 'Notification',
            action: 'Permission Granted'
          });
        }
        
        localStorage.removeItem('notification-prompt-dismissed');
        return 'granted';
      } else if (permission === 'denied') {
        ReactGA.event({
          category: 'Notification',
          action: 'Permission Denied'
        });
        
        localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
        return 'denied';
      } else {
        return 'default';
      }
    } catch (error) {
      console.error('Notification error:', error);
      return 'denied';
    }
  };

  const handleDismissNotification = () => {
    setShowNotificationPrompt(false);
    setNotificationPromptDismissed(true);
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
    
    ReactGA.event({
      category: 'Notification',
      action: 'Prompt Dismissed'
    });
  };

  if (!isInitialLoadComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary-pure">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Router>
        <RouteChangeTracker />
        
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginScreen />
              </PublicRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <SignupScreen />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardScreen />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/groups" 
            element={
              <ProtectedRoute>
                <GroupsScreen />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/group/:groupId" 
            element={
              <ProtectedRoute>
                <GroupDetailScreen />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/join/:token" 
            element={<JoinGroupScreen />}
          />
          <Route 
            path="/add-expense" 
            element={
              <ProtectedRoute>
                <AddExpenseScreen />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settle" 
            element={
              <ProtectedRoute>
                <SettleUpScreen />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/activity" 
            element={
              <ProtectedRoute>
                <ActivityScreen />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/friends" 
            element={
              <ProtectedRoute>
                <FriendsScreen />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfileScreen />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        {/* ✅ Notification Prompt - Shows FIRST */}
        <AnimatePresence>
          {showNotificationPrompt && (
            <NotificationPrompt
              onEnable={handleEnableNotifications}
              onDismiss={handleDismissNotification}
            />
          )}
        </AnimatePresence>

        {/* ✅ Install Prompt - Shows AFTER notification (5s cooldown) */}
        <AnimatePresence>
          {showInstallPrompt && isInstallable && (
            <InstallPrompt onDismiss={handleDismissInstall} />
          )}
        </AnimatePresence>
        {/* Install Instructions Modal */}
<InstallInstructionsModal 
  isOpen={showInstructionsModal} 
  onClose={closeInstructionsModal} 
/>

      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
