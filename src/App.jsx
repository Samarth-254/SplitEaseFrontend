import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AnimatePresence } from 'framer-motion';
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
import pushNotificationService from './services/pushNotification';

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

  useEffect(() => {
    initializeAuth();
  }, []);

  // ✅ SIMPLE: Show notification prompt every 24 hours until enabled
  useEffect(() => {
    if (!isAuthenticated) {
      setShowNotificationPrompt(false);
      return;
    }

    // ✅ Only show if permission is default (not granted or denied)
    if (!pushNotificationService.isPermissionDefault()) {
      return;
    }

    // ✅ Check when last dismissed
    const lastDismissed = localStorage.getItem('notification-prompt-dismissed');
    const now = Date.now();
    
    if (lastDismissed) {
      const timeSinceDismissed = now - parseInt(lastDismissed);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      // If dismissed less than 24 hours ago, don't show
      if (timeSinceDismissed < twentyFourHours) {
        const hoursRemaining = Math.round((twentyFourHours - timeSinceDismissed) / 1000 / 60 / 60);
        
        return;
      }
    }

    // ✅ Show prompt after 10 seconds
    const timer = setTimeout(() => {
      setShowNotificationPrompt(true);
      
    }, 10000);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const handleEnableNotifications = async () => {
    const granted = await pushNotificationService.requestPermission();
    if (granted) {
      
    }
    setShowNotificationPrompt(false);
    // ✅ Clear dismissed timestamp since they enabled it
    localStorage.removeItem('notification-prompt-dismissed');
  };

  const handleDismissPrompt = () => {
    setShowNotificationPrompt(false);
    // ✅ Save timestamp - will show again after 24 hours
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
    
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

        {/* Notification Prompt - Shows every 24 hours until enabled */}
        <AnimatePresence>
          {showNotificationPrompt && (
            <NotificationPrompt
              onEnable={handleEnableNotifications}
              onDismiss={handleDismissPrompt}
            />
          )}
        </AnimatePresence>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
