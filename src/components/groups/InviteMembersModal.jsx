import { useState, useEffect } from 'react';
import { Modal, Button, Input, Avatar } from '../ui';
import { Link2, Mail, Copy, Check, UserPlus, Users, Loader2 } from 'lucide-react';
import apiService from '../../services/api';

export const InviteMembersModal = ({ isOpen, onClose, groupId, groupName, existingMembers = [] }) => {
  const [inviteLink, setInviteLink] = useState('');
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'link'
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [addingFriends, setAddingFriends] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'friends') {
      fetchFriends();
    }
    // Reset selected friends when modal closes
    if (!isOpen) {
      setSelectedFriends([]);
    }
  }, [isOpen, activeTab, existingMembers]);

  const fetchFriends = async () => {
    setFriendsLoading(true);
    try {
      const response = await apiService.get('/api/friends');
      // Filter out friends who are already members of the group
      const existingMemberIds = existingMembers.map(m => (m._id || m.id).toString());
      const availableFriends = response.filter(friend => 
        !existingMemberIds.includes((friend._id || friend.id).toString())
      );
      setFriends(availableFriends);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    } finally {
      setFriendsLoading(false);
    }
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const addFriendsToGroup = async () => {
    if (selectedFriends.length === 0) return;
    
    setAddingFriends(true);
    setError('');
    setSuccess('');

    try {
      await apiService.post(`/api/groups/${groupId}/add-friends`, {
        friendIds: selectedFriends
      });
      
      // Remove added friends from the list immediately
      setFriends(prev => prev.filter(friend => 
        !selectedFriends.includes(friend._id || friend.id)
      ));
      
      setSuccess(`Added ${selectedFriends.length} friend${selectedFriends.length !== 1 ? 's' : ''} to group!`);
      setSelectedFriends([]);
      
      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to add friends');
    } finally {
      setAddingFriends(false);
    }
  };

  const generateLink = async () => {
    setLoading(true);
    setError('');
    try {
      const { inviteLink: link } = await apiService.generateInviteLink(groupId);
      setInviteLink(link);
    } catch (err) {
      setError(err.message || 'Failed to generate invite link');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setEmailLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.sendInviteEmail(groupId, email.trim());
      setSuccess('Invite sent successfully!');
      setEmail('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to send invite');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invite to ${groupName}`}
      size="md"
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 bg-primary-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'friends'
                ? 'bg-secondary-500 text-black'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <UserPlus size={16} className="inline mr-2" />
            Add Friends
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'link'
                ? 'bg-secondary-500 text-black'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Link2 size={16} className="inline mr-2" />
            Invite Link
          </button>
        </div>

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="space-y-4">
            {friendsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-secondary-500 animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-neutral-400">
                <Users size={48} className="mx-auto mb-3 opacity-50" />
                <p>No friends yet</p>
                <p className="text-sm mt-1">Join groups with others to make friends</p>
              </div>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {friends.map((friend) => (
                    <button
                      key={friend._id}
                      onClick={() => toggleFriendSelection(friend._id)}
                      className={`w-full p-3 rounded-lg border transition-all ${
                        selectedFriends.includes(friend._id)
                          ? 'border-secondary-500 bg-secondary-500/10'
                          : 'border-neutral-700 bg-primary-800 hover:bg-primary-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={friend.profileImage}
                          name={friend.name}
                          size="sm"
                        />
                        <div className="flex-1 text-left min-w-0">
                          <h4 className="font-medium text-neutral-100 truncate">
                            {friend.name}
                          </h4>
                          <p className="text-xs text-neutral-400 truncate">
                            {friend.email}
                          </p>
                        </div>
                        {selectedFriends.includes(friend._id) && (
                          <Check size={20} className="text-secondary-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                
                {selectedFriends.length > 0 && (
                  <Button
                    onClick={addFriendsToGroup}
                    loading={addingFriends}
                    fullWidth
                  >
                    Add {selectedFriends.length} Friend{selectedFriends.length !== 1 ? 's' : ''}
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {/* Link Tab */}
        {activeTab === 'link' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                <Link2 size={16} />
                Share Invite Link
              </h3>
              
              {!inviteLink ? (
                <Button
                  onClick={generateLink}
                  loading={loading}
                  fullWidth
                  variant="secondary"
                >
                  Generate Invite Link
                </Button>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 bg-primary-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-300 truncate">
                    {inviteLink}
                  </div>
                  <Button
                    onClick={copyLink}
                    variant="secondary"
                    size="md"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </Button>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-primary-900 text-neutral-500">OR</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                <Mail size={16} />
                Send Email Invite
              </h3>
              
              <form onSubmit={sendEmail} className="space-y-3">
                <Input
                  type="email"
                  placeholder="friend@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail size={20} />}
                />
                
                <Button
                  type="submit"
                  loading={emailLoading}
                  fullWidth
                >
                  Send Invite
                </Button>
              </form>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        
        {success && (
          <p className="text-sm text-green-400">{success}</p>
        )}
      </div>
    </Modal>
  );
};
