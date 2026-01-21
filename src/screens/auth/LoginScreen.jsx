import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { AuthScreen } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { useStore } from '../../store/useStore';
import apiService from '../../services/api';
import ReactGA from 'react-ga4';

export const LoginScreen = () => {
  const navigate = useNavigate();
  const { setUser } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    
    try {
      const response = await apiService.googleLogin(credentialResponse.credential);
      
      apiService.setToken(response.token);
      await setUser(response.user);
      
      ReactGA.event({
        category: 'User',
        action: 'Login',
        label: 'Google OAuth'
      });
      
      const inviteToken = localStorage.getItem('inviteToken');
      if (inviteToken) {
        try {
          const joinedGroup = await apiService.joinGroup(inviteToken);
          localStorage.removeItem('inviteToken');
          const { addGroup } = useStore.getState();
          addGroup(joinedGroup);
          
          ReactGA.event({
            category: 'Group',
            action: 'Joined via Invite',
            label: 'After Google Login'
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
      console.error('❌ Google Login Error:', err);
      toast.error(err.message || 'Google sign-in failed');
      
      ReactGA.event({
        category: 'User',
        action: 'Login Failed',
        label: 'Google OAuth Error'
      });
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!email) {
        throw new Error('Please enter your email address');
      }
      
      await apiService.forgotPassword(email);
      
      toast.success('Password reset email sent! Check your inbox.');
      
      ReactGA.event({
        category: 'User',
        action: 'Forgot Password Requested',
        label: 'Email'
      });
      
      setTimeout(() => {
        setResetEmailSent(true);
        setLoading(false);
      }, 500);
      
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email');
      
      ReactGA.event({
        category: 'User',
        action: 'Forgot Password Failed',
        label: 'Error'
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }
      
      const response = await apiService.login(email, password);
      apiService.setToken(response.token);
      await setUser(response.user);
      
      ReactGA.event({
        category: 'User',
        action: 'Login',
        label: 'Email/Password'
      });
      
      const inviteToken = localStorage.getItem('inviteToken');
      if (inviteToken) {
        try {
          const joinedGroup = await apiService.joinGroup(inviteToken);
          localStorage.removeItem('inviteToken');
          const { addGroup } = useStore.getState();
          addGroup(joinedGroup);
          
          ReactGA.event({
            category: 'Group',
            action: 'Joined via Invite',
            label: 'After Email Login'
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
      toast.error(err.message || 'Login failed');
      
      ReactGA.event({
        category: 'User',
        action: 'Login Failed',
        label: 'Email/Password Error'
      });
      setLoading(false);
    }
  };

  if (resetEmailSent) {
    return (
      <AuthScreen>
        <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm mx-auto"
          >
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-green-500/10 mb-4"
              >
                <Mail size={40} className="text-green-400" />
              </motion.div>
              <h1 className="text-2xl font-bold text-neutral-100 mb-2">
                Check your email
              </h1>
              <p className="text-neutral-400 mb-6">
                If an account exists for <strong className="text-neutral-300">{email}</strong>, you'll receive password reset instructions.
              </p>
              <p className="text-sm text-neutral-500">
                Check your spam folder if you don't see the email within a few minutes.
              </p>
            </div>

            <Button
              size="xl"
              fullWidth
              onClick={() => {
                setResetEmailSent(false);
                setForgotPasswordMode(false);
                setEmail('');
              }}
            >
              Back to Login
            </Button>
          </motion.div>
        </div>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm mx-auto"
        >
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
              {forgotPasswordMode ? 'Reset password' : 'Welcome back'}
            </h1>
            <p className="text-neutral-500">
              {forgotPasswordMode 
                ? 'Enter your email to receive a reset link' 
                : 'Sign in to manage your expenses'}
            </p>
          </div>

          {!forgotPasswordMode && (
            <>
              <div className="mb-6">
                <div style={{ colorScheme: 'light' }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      console.error('❌ Google OAuth failed');
                      toast.error('Google sign-in failed');
                    }}
                    theme="filled_black"
                    size="large"
                    width="100%"
                    shape="rectangular"
                    text="signin_with"
                  />
                </div>
                {googleLoading && (
                  <div className="mt-2 text-center">
                    <div className="inline-block w-4 h-4 border-2 border-secondary-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-neutral-400">Signing in...</span>
                  </div>
                )}
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-primary-950 text-neutral-500">Or continue with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={forgotPasswordMode ? handleForgotPassword : handleSubmit} className="space-y-5">
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

            {!forgotPasswordMode && (
              <div>
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
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordMode(true)}
                    className="text-sm text-secondary-500 hover:text-secondary-400 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              size="xl"
              fullWidth
              loading={loading}
              iconRight={!loading && <ArrowRight size={20} />}
              className="mt-6"
            >
              {forgotPasswordMode ? 'Send Reset Link' : 'Sign In'}
            </Button>

            {forgotPasswordMode && (
              <Button
                type="button"
                size="xl"
                fullWidth
                variant="ghost"
                onClick={() => {
                  setForgotPasswordMode(false);
                }}
              >
                Back to Login
              </Button>
            )}
          </form>

          {!forgotPasswordMode && (
            <p className="mt-8 text-center text-sm text-neutral-500">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="text-secondary-500 hover:text-secondary-400 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </AuthScreen>
  );
};
