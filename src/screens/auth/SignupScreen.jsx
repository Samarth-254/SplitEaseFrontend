import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthScreen } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { useStore } from '../../store/useStore';
import apiService from '../../services/api';
import ReactGA from 'react-ga4';

/**
 * Signup Screen
 * 
 * UX Decisions:
 * - Google Sign-Up as primary option
 * - Minimal required fields (name, email, password)
 * - Clear password requirements hint
 * - Same layout as login for consistency
 */

export const SignupScreen = () => {
  const navigate = useNavigate();
  const { setUser } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSuccess = async (credentialResponse) => {
  try {
    setGoogleLoading(true);
    setError('');
    
    const response = await apiService.googleLogin(credentialResponse.credential);
    
    apiService.setToken(response.token);
    await setUser(response.user);
    
    // Track Google signup success
    ReactGA.event({
      category: 'User',
      action: 'Signup',
      label: 'Google OAuth'
    });
    
    const inviteToken = localStorage.getItem('inviteToken');
    if (inviteToken) {
      try {
        const joinedGroup = await apiService.joinGroup(inviteToken);
        localStorage.removeItem('inviteToken');
        const { addGroup } = useStore.getState();
        addGroup(joinedGroup);
        
        // Track group joined via invite after signup
        ReactGA.event({
          category: 'Group',
          action: 'Joined via Invite',
          label: 'After Google Signup'
        });
        
        navigate(`/group/${joinedGroup._id || joinedGroup.id}`);
      } catch (err) {
        localStorage.removeItem('inviteToken');
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  } catch (err) {
    console.error('❌ Google Signup Error:', err);
    setError(err.message || 'Google sign-up failed');
    
    // Track Google signup failure
    ReactGA.event({
      category: 'User',
      action: 'Signup Failed',
      label: 'Google OAuth Error'
    });
  } finally {
    setGoogleLoading(false);
  }
};


 const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  
  try {
    if (!name || !email || !password) {
      throw new Error('Please fill in all fields');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    const response = await apiService.register(name, email, password);
    apiService.setToken(response.token);
    await setUser(response.user);
    
    // Track email signup success
    ReactGA.event({
      category: 'User',
      action: 'Signup',
      label: 'Email/Password'
    });
    
    const inviteToken = localStorage.getItem('inviteToken');
    if (inviteToken) {
      try {
        const joinedGroup = await apiService.joinGroup(inviteToken);
        localStorage.removeItem('inviteToken');
        const { addGroup } = useStore.getState();
        addGroup(joinedGroup);
        
        // Track group joined via invite after signup
        ReactGA.event({
          category: 'Group',
          action: 'Joined via Invite',
          label: 'After Email Signup'
        });
        
        navigate(`/group/${joinedGroup._id || joinedGroup.id}`);
      } catch (err) {
        localStorage.removeItem('inviteToken');
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  } catch (err) {
    setError(err.message || 'Could not create account');
    
    // Track email signup failure
    ReactGA.event({
      category: 'User',
      action: 'Signup Failed',
      label: err.message.includes('6 characters') ? 'Weak Password' : 'Email/Password Error'
    });
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
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-secondary-500 mb-4 overflow-hidden"
            >
              <img 
                src="/icon-192.png" 
                alt="SplitEase" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            <h1 className="text-2xl font-bold text-neutral-100 mb-2">
              Create account
            </h1>
            <p className="text-neutral-500">
              Start splitting expenses with friends
            </p>
          </div>

          {/* Google Signup with dark theme fix */}
          <div className="mb-6">
            <div style={{ colorScheme: 'light' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.error('❌ Google OAuth failed');
                  setError('Google sign-up failed');
                }}
                theme="filled_black"
                size="large"
                width="100%"
                text="signup_with"
                shape="rectangular"
              />
            </div>
            {googleLoading && (
              <div className="mt-2 text-center">
                <div className="inline-block w-4 h-4 border-2 border-secondary-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-neutral-400">Creating account...</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-primary-950 text-neutral-500">Or sign up with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User size={20} />}
              autoComplete="name"
              size="lg"
            />

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
              autoComplete="new-password"
              hint="At least 6 characters"
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
              Create Account
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-secondary-500 hover:text-secondary-400 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-neutral-600">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </AuthScreen>
  );
};
