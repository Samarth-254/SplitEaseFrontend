import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthScreen } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { useStore } from '../../store/useStore';
import apiService from '../../services/api';

/**
 * Login Screen
 * 
 * UX Decisions:
 * - Google Sign-In as primary option
 * - Single column form for easy scanning
 * - Large touch targets (48px+ inputs)
 * - Clear visual hierarchy
 */

export const LoginScreen = () => {
  const navigate = useNavigate();
  const { setUser } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.googleLogin(credentialResponse.credential);
      apiService.setToken(response.token);
      await setUser(response.user);
      
      const inviteToken = localStorage.getItem('inviteToken');
      if (inviteToken) {
        try {
          const joinedGroup = await apiService.joinGroup(inviteToken);
          localStorage.removeItem('inviteToken');
          // Add the group to store immediately
          const { addGroup } = useStore.getState();
          addGroup(joinedGroup);
          navigate(`/group/${joinedGroup._id || joinedGroup.id}`);
        } catch (err) {
          localStorage.removeItem('inviteToken');
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }
      
      const response = await apiService.login(email, password);
      apiService.setToken(response.token);
      await setUser(response.user);
      
      const inviteToken = localStorage.getItem('inviteToken');
      if (inviteToken) {
        try {
          const joinedGroup = await apiService.joinGroup(inviteToken);
          localStorage.removeItem('inviteToken');
          // Add the group to store immediately
          const { addGroup } = useStore.getState();
          addGroup(joinedGroup);
          navigate(`/group/${joinedGroup._id || joinedGroup.id}`);
        } catch (err) {
          localStorage.removeItem('inviteToken');
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm mx-auto"
        >
          {/* Logo & Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="text-5xl mb-4"
            >
              💸
            </motion.div>
            <h1 className="text-2xl font-bold text-neutral-100 mb-2">
              Welcome back
            </h1>
            <p className="text-neutral-500">
              Sign in to manage your expenses
            </p>
          </div>

          {/* Google Sign In */}
          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed')}
              useOneTap
              theme="filled_black"
              size="large"
              width="100%"
            />
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-primary-950 text-neutral-500">Or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={20} />}
              autoComplete="email"
              size="lg"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={20} />}
              autoComplete="current-password"
              size="lg"
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 text-center"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              size="xl"
              fullWidth
              loading={loading}
              iconRight={!loading && <ArrowRight size={20} />}
              className="mt-6"
            >
              Sign In
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-neutral-500">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="text-secondary-500 hover:text-secondary-400 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </AuthScreen>
  );
};




