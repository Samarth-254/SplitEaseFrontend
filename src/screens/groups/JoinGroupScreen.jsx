import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '../../components/ui';
import apiService from '../../services/api';
import { useStore } from '../../store/useStore';

export const JoinGroupScreen = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { addGroup } = useStore();
  const [status, setStatus] = useState('checking');
  const [group, setGroup] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const attemptJoin = async () => {
      // Check localStorage token directly instead of Zustand state
      const authToken = localStorage.getItem('token');
      
      if (!authToken) {
        setStatus('needsAuth');
        return;
      }

      setStatus('loading');
      
      try {
        const joinedGroup = await apiService.joinGroup(token);
        setGroup(joinedGroup);
        addGroup(joinedGroup);
        setStatus('success');
        
        setTimeout(() => {
          navigate(`/group/${joinedGroup._id || joinedGroup.id}`);
        }, 2000);
      } catch (err) {
        setStatus('error');
        setError(err.message || 'Invalid or expired invite link');
      }
    };

    attemptJoin();
  }, [token]);

  return (
    <div className="min-h-screen bg-primary-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💸</div>
          <h1 className="text-2xl font-bold text-neutral-100">SplitEase</h1>
        </div>

        <div className="bg-primary-900 border border-border rounded-2xl p-8 text-center">
          {status === 'needsAuth' && (
            <>
              <Users size={48} className="text-secondary-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-neutral-100 mb-2">
                Join Group
              </h2>
              <p className="text-neutral-400 mb-6">
                Please log in to join this group
              </p>
              <Button
                fullWidth
                onClick={() => {
                  localStorage.setItem('inviteToken', token);
                  navigate('/login');
                }}
              >
                Log In
              </Button>
              <Button
                variant="ghost"
                fullWidth
                className="mt-2"
                onClick={() => {
                  localStorage.setItem('inviteToken', token);
                  navigate('/signup');
                }}
              >
                Sign Up
              </Button>
            </>
          )}

          {status === 'loading' && (
            <>
              <Loader size={48} className="text-secondary-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-neutral-100 mb-2">
                Joining Group...
              </h2>
              <p className="text-neutral-400">Please wait while we add you to the group</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-neutral-100 mb-2">
                Welcome to {group?.emoji} {group?.name}!
              </h2>
              <p className="text-neutral-400 mb-4">
                You've successfully joined the group
              </p>
              <p className="text-sm text-neutral-500">
                Redirecting to group...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-neutral-100 mb-2">
                Unable to Join Group
              </h2>
              <p className="text-neutral-400 mb-6">{error}</p>
              <Button
                fullWidth
                onClick={() => navigate('/groups')}
              >
                Go to Groups
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
