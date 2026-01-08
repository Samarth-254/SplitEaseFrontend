import { useState } from 'react';
import { Modal, Button, Input } from '../ui';
import { Users } from 'lucide-react';
import apiService from '../../services/api';
import { useStore } from '../../store/useStore';

const EMOJI_OPTIONS = ['🏠', '🗽', '✈️', '🍕', '🍺', '⛰️', '🏖️', '🎬', '🎮', '💼', '🏋️', '🎓'];

export const CreateGroupModal = ({ isOpen, onClose }) => {
  const { addGroup } = useStore();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏠');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const group = await apiService.createGroup(name.trim(), emoji);
      addGroup(group);
      setName('');
      setEmoji('🏠');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Group"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm text-neutral-400 mb-3 block">Choose an emoji</label>
          <div className="grid grid-cols-6 gap-2">
            {EMOJI_OPTIONS.map((emojiOption) => (
              <button
                key={emojiOption}
                type="button"
                onClick={() => setEmoji(emojiOption)}
                className={`text-2xl sm:text-3xl p-2 sm:p-3 rounded-xl transition-all ${
                  emoji === emojiOption
                    ? 'bg-secondary-500/20 ring-2 ring-secondary-500'
                    : 'bg-primary-800 hover:bg-primary-700'
                }`}
              >
                {emojiOption}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Group Name"
          placeholder="e.g., NYC Trip, Roommates"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<Users size={20} />}
          autoFocus
        />

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            fullWidth
          >
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
};
