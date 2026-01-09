import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
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

/**
 * App Root Component
 * 
 * Routing structure:
 * - Public routes: /login, /signup
 * - Protected routes: /dashboard, /groups, /group/:id, /add-expense, /settle, /activity, /profile
 * 
 * Default redirect to dashboard if authenticated, login otherwise
 */

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route wrapper (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const { initializeAuth, isInitialLoadComplete } = useStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  // Show loading screen while initializing auth and loading data
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
    </Router>
    </GoogleOAuthProvider>
  );
}

export default App;



