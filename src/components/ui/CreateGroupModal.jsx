import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Link2, Mail, Copy, Check } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import apiService from '../../services/api';

const EMOJI_OPTIONS = ['🏠', '✈️', '🍕', '🎬', '⛰️', '🎉', '🎓', '💼', '🏖️', '🎮', '🍺', '🚗'];

export const CreateGroupModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏠');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [createdGroup, setCreatedGroup] = useState(null);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    
    setLoading(true);
    try {
      const group = await apiService.createGroup(groupName, selectedEmoji);
      setCreatedGroup(group);
      
      const { inviteLink: link } = await apiService.generateInviteLink(group._id);
      setInviteLink(link);
      
      setStep(2);
      onSuccess?.(group);
    } catch (err) {
      alert(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    if (!inviteEmail.trim() || !createdGroup) return;
    
    setLoading(true);
    try {
      await apiService.sendInviteEmail(createdGroup._id, inviteEmail);
      alert('Invite sent successfully!');
      setInviteEmail('');
    } catch (err) {
      alert(err.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setGroupName('');
    setSelectedEmoji('🏠');
    setInviteLink('');
    setInviteEmail('');
    setCreatedGroup(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 1 ? 'Create Group' : 'Invite Members'}
      size="md"
    >
      {step === 1 ? (
        <div className="space-y-5">
          <Input
            label="Group Name"
            placeholder="e.g., Weekend Trip, Roommates"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            icon={<Users size={20} />}
          />

          <div>
            <label className="text-sm text-neutral-400 block mb-3">Choose Emoji</label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`
                    aspect-square text-3xl rounded-xl transition-all
                    ${selectedEmoji === emoji 
                      ? 'bg-secondary-500 scale-110' 
                      : 'bg-primary-800 hover:bg-primary-700'
                    }
                  `}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={handleCreateGroup}
            loading={loading}
            disabled={!groupName.trim()}
          >
            Create Group
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="text-center p-4 bg-primary-800 rounded-xl">
            <div className="text-5xl mb-2">{selectedEmoji}</div>
            <p className="text-lg font-semibold text-neutral-100">{groupName}</p>
            <p className="text-sm text-neutral-400 mt-1">Group created successfully!</p>
          </div>

          <div>
            <label className="text-sm text-neutral-400 block mb-2">Share Invite Link</label>
            <div className="flex gap-2">
              <Input
                value={inviteLink}
                readOnly
                icon={<Link2 size={18} />}
              />
              <Button
                variant={copied ? 'success' : 'secondary'}
                onClick={handleCopyLink}
                icon={copied ? <Check size={18} /> : <Copy size={18} />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Link expires in 7 days</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-primary-900 text-neutral-500">Or invite by email</span>
            </div>
          </div>

          <div>
            <div className="flex gap-2">
              <Input
                placeholder="friend@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                icon={<Mail size={18} />}
                type="email"
              />
              <Button
                onClick={handleSendEmail}
                loading={loading}
                disabled={!inviteEmail.trim()}
              >
                Send
              </Button>
            </div>
          </div>

          <Button
            fullWidth
            variant="secondary"
            onClick={handleClose}
          >
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
};
