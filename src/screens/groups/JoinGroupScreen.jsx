import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, CheckCircle, XCircle, Loader, UserPlus } from 'lucide-react';
import ReactGA from 'react-ga4';
import { Button } from '../../components/ui';
import apiService from '../../services/api';
import { useStore } from '../../store/useStore';

export const JoinGroupScreen = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { addGroup } = useStore();
  const [status, setStatus] = useState('checking');
  const [group, setGroup] = useState(null);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkInvite = async () => {
      const authToken = localStorage.getItem('token');
      
      if (!authToken) {
        try {
          const info = await apiService.getInviteInfo(token);
          setInviteInfo(info);
          
          // Track invite link viewed (not logged in)
          ReactGA.event({
            category: 'Group',
            action: 'Viewed Invite Link',
            label: 'Not Authenticated'
          });
        } catch (err) {
          // Ignore error
        }
        setStatus('needsAuth');
        return;
      }

      setStatus('loading');
      
      try {
        const joinedGroup = await apiService.joinGroup(token);
        setGroup(joinedGroup);
        addGroup(joinedGroup);
        setStatus('success');
        
        // Track successful group join via invite link
        ReactGA.event({
          category: 'Group',
          action: 'Joined via Invite Link',
          label: joinedGroup.name || 'Unknown Group'
        });
        
        setTimeout(() => {
          navigate(`/group/${joinedGroup._id || joinedGroup.id}`);
        }, 2000);
      } catch (err) {
        setStatus('error');
        setError(err.message || 'Invalid or expired invite link');
        
        // Track invite link error
        ReactGA.event({
          category: 'Group',
          action: 'Invite Link Failed',
          label: err.message || 'Invalid/Expired Link'
        });
      }
    };

    checkInvite();
  }, [token]);

  return (
    <div className="min-h-screen bg-primary-950 flex flex-col items-center justify-center p-4">
      {/* Logo & App Name - Same Line */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-12"
      >
        <img 
          src="/icon-192.png" 
          alt="SplitEase" 
          className="w-16 h-16 rounded-2xl shadow-lg shadow-secondary-500/20"
        />
        <h1 className="text-4xl font-bold text-neutral-100">SplitEase</h1>
      </motion.div>

      {/* Main Content - Centered */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md"
      >
        <div className="bg-primary-900 border border-border rounded-2xl p-8 text-center">
          {status === 'needsAuth' && (
            <>
              <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-6">
                {inviteInfo?.groupEmoji ? (
                  <span className="text-4xl">{inviteInfo.groupEmoji}</span>
                ) : (
                  <UserPlus size={40} className="text-orange-400" />
                )}
              </div>
              <h2 className="text-2xl font-semibold text-neutral-100 mb-3">
                {inviteInfo?.groupName ? `Join ${inviteInfo.groupName}` : 'Join Group'}
              </h2>
              <p className="text-neutral-300 mb-2">
                {inviteInfo?.invitedByName ? (
                  <>
                    <span className="font-semibold text-neutral-100">{inviteInfo.invitedByName}</span> invited you to join this group
                  </>
                ) : (
                  'You\'ve been invited to join a group'
                )}
              </p>
              {inviteInfo?.memberCount && (
                <p className="text-sm text-neutral-500 mb-8">
                  {inviteInfo.memberCount} {inviteInfo.memberCount === 1 ? 'member' : 'members'} in this group
                </p>
              )}
              <p className="text-sm text-neutral-400 mb-8">
                Please log in to accept the invitation
              </p>
              <div className="space-y-3">
                <Button
                  fullWidth
                  size="xl"
                  onClick={() => {
                    localStorage.setItem('inviteToken', token);
                    
                    // Track redirect to login from invite
                    ReactGA.event({
                      category: 'User',
                      action: 'Clicked Login from Invite',
                      label: inviteInfo?.groupName || 'Unknown Group'
                    });
                    
                    navigate('/login');
                  }}
                >
                  Log In
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  size="xl"
                  onClick={() => {
                    localStorage.setItem('inviteToken', token);
                    
                    // Track redirect to signup from invite
                    ReactGA.event({
                      category: 'User',
                      action: 'Clicked Signup from Invite',
                      label: inviteInfo?.groupName || 'Unknown Group'
                    });
                    
                    navigate('/signup');
                  }}
                >
                  Sign Up
                </Button>
              </div>
            </>
          )}

          {status === 'loading' && (
            <>
              <Loader size={56} className="text-secondary-500 animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-neutral-100 mb-3">
                Joining Group...
              </h2>
              <p className="text-neutral-400">Please wait while we add you to the group</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={56} className="text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-neutral-100 mb-3">
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
              <XCircle size={56} className="text-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-neutral-100 mb-3">
                Unable to Join Group
              </h2>
              <p className="text-neutral-400 mb-8">{error}</p>
              <Button
                fullWidth
                size="xl"
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
