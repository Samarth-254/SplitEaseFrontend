import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
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
import { ResetPasswordScreen } from './screens/auth';
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
  const { isAuthenticated, isInitialLoadComplete } = useStore();
  
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
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isInitialLoadComplete } = useStore();
  
  if (isInitialLoadComplete && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const { initializeAuth, isAuthenticated } = useStore();
  
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [notificationPromptDismissed, setNotificationPromptDismissed] = useState(false);
  const { isInstallable, showInstructionsModal, closeInstructionsModal } = usePWAInstall();

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

  useEffect(() => {
    if (!isAuthenticated) {
      setShowNotificationPrompt(false);
      return;
    }

    if (!pushNotificationService.isPermissionDefault()) {
      setNotificationPromptDismissed(true);
      return;
    }

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

    const timer = setTimeout(() => {
      setShowNotificationPrompt(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !isInstallable) {
      setShowInstallPrompt(false);
      return;
    }

    if (!notificationPromptDismissed) {
      return;
    }

    const lastDismissed = localStorage.getItem('install-prompt-dismissed');
    const now = Date.now();
    
    if (lastDismissed) {
      const timeSinceDismissed = now - parseInt(lastDismissed);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (timeSinceDismissed < twentyFourHours) {
        return;
      }
    }

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

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Router>
        <RouteChangeTracker />
        
      <Toaster
  position="top-right"
  toastOptions={{
    style: {
      background: '#333',
      color: '#fff',
    },
  }}
/>

        
        <Routes>
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
          <Route 
  path="/reset-password/:token" 
  element={
    <PublicRoute>
      <ResetPasswordScreen />
    </PublicRoute>
  } 
/>
          
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
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <AnimatePresence>
          {showNotificationPrompt && (
            <NotificationPrompt
              onEnable={handleEnableNotifications}
              onDismiss={handleDismissNotification}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showInstallPrompt && isInstallable && (
            <InstallPrompt onDismiss={handleDismissInstall} />
          )}
        </AnimatePresence>
        
        <InstallInstructionsModal 
          isOpen={showInstructionsModal} 
          onClose={closeInstructionsModal} 
        />
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
