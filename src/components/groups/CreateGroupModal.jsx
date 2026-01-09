import { useState } from 'react';
import { Modal, Button, Input } from '../ui';
import { Users, Plus, ChevronRight } from 'lucide-react';
import apiService from '../../services/api';
import { useStore } from '../../store/useStore';

const PRIMARY_EMOJIS = ['🏠', '🗽', '✈️', '🍕', '🍺', '⛰️', '🏖️', '🎬', '🎮', '💼', '🏋️', '🎓'];
const ALL_EMOJIS = [
  // Travel
  '🏠', '🗽', '✈️', '🚗', '🚂', '🚌', '🚢', '🏕️', '🏖️', '🏔️', '🌋', '🏜️', '🌊', '🏝️',
  // Food & Drinks
  '🍕', '🍔', '🌮', '🍜', '🍣', '🍛', '🍲', '🥗', '🍝', '🍳', '🥞', '🧇', '🥐', '🍰',
  '🍩', '🍫', '🍦', '🍧', '🍨', '🍹', '🍷', '🍺', '🥃', '☕', '🧃',
  // Sports & Fitness
  '⚽', '🏀', '🏈', '⚾', '🥎', '🏐', '🏉', '🥏', '🎱', '🏏', '🥍', '🏒', '🏓', '🏸',
  '🏂', '⛷️', '🏄', '🏌️', '⛳', '🏆', '🥇', '🥈', '🥉', '🏅', '🏋️', '🚴', '🚵', '🏇',
  // Entertainment
  '🎬', '🎥', '🎞️', '🎧', '🎤', '🎼', '🎹', '🥁', '🎸', '🎺', '🎻', '🎲', '🎯', '🎮',
  '🕹️', '🎪', '🎨', '🖼️', '🖌️', '✏️', '🖍️', '📚', '📖', '📰',
  // Work & Education
  '💼', '👔', '💻', '⌨️', '🖱️', '🖥️', '🖨️', '📱', '📲', '💽', '💾', '💿', '📀',
  '🎓', '📚', '✏️', '📖', '📅', '📆', '📇', '📋', '📎', '📌', '📏', '📐',
  // People & Groups
  '👥', '👤', '👩', '👨', '👧', '👦', '👩‍👩‍👧', '👨‍👩‍👦', '👨‍👩‍👦‍👦', '👨‍👨‍👧‍👧'
];

export const CreateGroupModal = ({ isOpen, onClose }) => {
  const { addGroup } = useStore();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏠');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAllEmojis, setShowAllEmojis] = useState(false);

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
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Group" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Primary Emojis - 2 Rows */}
        <div>
          <label className="text-sm text-neutral-400 mb-3 block">Choose an emoji</label>
          
          {/* Row 1 */}
          <div className="grid grid-cols-6 gap-2 mb-2">
            {PRIMARY_EMOJIS.slice(0, 6).map((emojiOption) => (
              <button
                key={emojiOption}
                type="button"
                onClick={() => setEmoji(emojiOption)}
                className={`text-2xl p-2 rounded-xl transition-all ${
                  emoji === emojiOption
                    ? 'bg-secondary-500/20 ring-2 ring-secondary-500'
                    : 'bg-primary-800 hover:bg-primary-700'
                }`}
              >
                {emojiOption}
              </button>
            ))}
          </div>
          
          {/* Row 2 + More Button */}
          <div className="grid grid-cols-6 gap-2">
            {PRIMARY_EMOJIS.slice(6).map((emojiOption) => (
              <button
                key={emojiOption}
                type="button"
                onClick={() => setEmoji(emojiOption)}
                className={`text-2xl p-2 rounded-xl transition-all ${
                  emoji === emojiOption
                    ? 'bg-secondary-500/20 ring-2 ring-secondary-500'
                    : 'bg-primary-800 hover:bg-primary-700'
                }`}
              >
                {emojiOption}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowAllEmojis(true)}
              className="text-2xl p-2 rounded-xl bg-primary-800 hover:bg-primary-700 border-2 border-dashed border-neutral-600 flex items-center justify-center text-neutral-400 hover:text-neutral-200 transition-all"
              title="More emojis"
            >
              +{ALL_EMOJIS.length - PRIMARY_EMOJIS.length}
              <ChevronRight size={14} className="ml-1" />
            </button>
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
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button type="submit" loading={loading} fullWidth>
            Create Group
          </Button>
        </div>
      </form>

      {/* All Emojis Popup */}
      <Modal
        isOpen={showAllEmojis}
        onClose={() => setShowAllEmojis(false)}
        title="Choose Emoji"
        size="lg"
      >
        <div className="max-h-[400px] overflow-y-auto p-2">
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
            {ALL_EMOJIS.map((emojiOption) => (
              <button
                key={emojiOption}
                type="button"
                onClick={() => {
                  setEmoji(emojiOption);
                  setShowAllEmojis(false);
                }}
                className={`text-2xl p-3 rounded-xl transition-all ${
                  emoji === emojiOption
                    ? 'bg-secondary-500/30 ring-2 ring-secondary-500 scale-110'
                    : 'bg-primary-800 hover:bg-primary-700 hover:scale-105'
                }`}
              >
                {emojiOption}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-neutral-800">
          <Button 
            variant="secondary" 
            fullWidth
            onClick={() => setShowAllEmojis(false)}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </Modal>
  );
};
