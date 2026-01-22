// src/screens/auth/ResetPasswordScreen.jsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactGA from 'react-ga4';
import { AuthScreen } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import apiService from '../../services/api';


export const ResetPasswordScreen = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!password || !confirmPassword) {
        throw new Error('Please fill in all fields');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      await apiService.resetPassword(token, password);
      
      toast.success('Password reset successful!');
      
      ReactGA.event({
        category: 'User',
        action: 'Password Reset Success',
        label: 'Reset Password'
      });
      
      setResetSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      toast.error(err.message || 'Failed to reset password');
      
      ReactGA.event({
        category: 'User',
        action: 'Password Reset Failed',
        label: 'Error'
      });
      setLoading(false);
    }
  };


  if (resetSuccess) {
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
                <CheckCircle size={40} className="text-green-400" />
              </motion.div>
              <h1 className="text-2xl font-bold text-neutral-100 mb-2">
                Password reset successful!
              </h1>
              <p className="text-neutral-400 mb-6">
                Your password has been changed successfully.
              </p>
              <p className="text-sm text-neutral-500">
                Redirecting you to login...
              </p>
            </div>

            <Button
              size="xl"
              fullWidth
              onClick={() => navigate('/login')}
            >
              Go to Login
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
              Create new password
            </h1>
            <p className="text-neutral-500">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={20} />}
              autoComplete="new-password"
              size="lg"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock size={20} />}
              autoComplete="new-password"
              size="lg"
            />

            <Button
              type="submit"
              size="xl"
              fullWidth
              loading={loading}
              iconRight={!loading && <ArrowRight size={20} />}
              className="mt-6"
            >
              Reset Password
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-neutral-500">
            Remember your password?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-secondary-500 hover:text-secondary-400 font-medium transition-colors"
            >
              Back to Login
            </button>
          </p>
        </motion.div>
      </div>
    </AuthScreen>
  );
};
