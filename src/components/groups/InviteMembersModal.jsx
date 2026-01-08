import { useState } from 'react';
import { Modal, Button, Input } from '../ui';
import { Link2, Mail, Copy, Check } from 'lucide-react';
import apiService from '../../services/api';

export const InviteMembersModal = ({ isOpen, onClose, groupId, groupName }) => {
  const [inviteLink, setInviteLink] = useState('');
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
