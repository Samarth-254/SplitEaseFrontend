import { useState } from 'react';
import { Modal, Button, Input } from '../ui';
import { Users, Plus, ChevronRight } from 'lucide-react';
import ReactGA from 'react-ga4';
import apiService from '../../services/api';
import { useStore } from '../../store/useStore';

const PRIMARY_EMOJIS = ['🏠', '🗽', '✈️', '🍕', '🍺', '⛰️', '🏖️', '🎬', '🎮', '💼', '🏋️', '🎓'];
const ALL_EMOJIS = [
  // Travel (14)
  '🏠', '🗽', '✈️', '🚗', '🚂', '🚌', '🚢', '🏕️', '🏖️', '🏔️', '🌋', '🏜️', '🌊', '🏝️',
  // Food & Drinks (21)
  '🍕', '🍔', '🌮', '🍜', '🍣', '🍛', '🍲', '🥗', '🍝', '🍳', '🥞', '🧇', '🥐', '🍰',
  '🍩', '🍫', '🍦', '🍧', '🍨', '🍹', '🍷', '🍺', '🥃', '☕', '🧃',
  // Sports & Fitness (25)
  '⚽', '🏀', '🏈', '⚾', '🥎', '🏐', '🏉', '🥏', '🎱', '🏏', '🥍', '🏒', '🏓', '🏸',
  '🏂', '⛷️', '🏄', '🏌️', '⛳', '🏆', '🥇', '🥈', '🥉', '🏅', '🏋️', '🚴', '🚵', '🏇',
  // Entertainment (16)
  '🎬', '🎥', '🎞️', '🎧', '🎤', '🎼', '🎹', '🥁', '🎸', '🎺', '🎻', '🎲', '🎯', '🎮',
  '🕹️', '🎪', '🎨', '🖼️', '🖌️', '✏️', '🖍️', '📚', '📖', '📰',
  // Work & Education (15)
  '💼', '👔', '💻', '⌨️', '🖱️', '🖥️', '🖨️', '📱', '📲', '💽', '💾', '💿', '📀',
  '🎓', '📚', '✏️', '📖', '📅', '📆', '📇', '📋', '📎', '📌', '📏', '📐',
  // People & Groups (10)
  '👥', '👤', '👩', '👨', '👧', '👦', '👩‍👩‍👧', '👨‍👩‍👦', '👨‍👩‍👦‍👦', '👨‍👨‍👧‍👧'
].filter((emoji, index, self) => self.indexOf(emoji) === index); // Remove duplicates

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
      
      // Track group creation
      ReactGA.event({
        category: 'Group',
        action: 'Created Group',
        label: emoji
      });
      
      setName('');
      setEmoji('🏠');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create group');
      
      // Track group creation failure
      ReactGA.event({
        category: 'Group',
        action: 'Group Creation Failed',
        label: err.message || 'Unknown Error'
      });
    } finally {
      setLoading(false);
    }
  };

  const moreCount = ALL_EMOJIS.length - PRIMARY_EMOJIS.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Group" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Primary Emojis - PERFECT MOBILE LAYOUT */}
        <div>
          <label className="text-sm text-neutral-400 mb-4 block">Choose an emoji</label>
          
          {/* Row 1: 6 Emojis */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3 p-1">
            {PRIMARY_EMOJIS.slice(0, 6).map((emojiOption) => (
              <button
                key={emojiOption}
                type="button"
                onClick={() => setEmoji(emojiOption)}
                className={`text-3xl sm:text-2xl p-3 rounded-xl transition-all flex items-center justify-center min-h-[56px] sm:min-h-0 ${
                  emoji === emojiOption
                    ? 'bg-secondary-500/30 ring-2 ring-secondary-400 shadow-lg'
                    : 'bg-primary-800/50 hover:bg-primary-700 active:scale-95'
                }`}
              >
                {emojiOption}
              </button>
            ))}
          </div>
          
          {/* Row 2: 5 Emojis + 1 More Button */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 p-1">
            {PRIMARY_EMOJIS.slice(6, 11).map((emojiOption) => (
              <button
                key={emojiOption}
                type="button"
                onClick={() => setEmoji(emojiOption)}
                className={`text-3xl sm:text-2xl p-3 rounded-xl transition-all flex items-center justify-center min-h-[56px] sm:min-h-0 ${
                  emoji === emojiOption
                    ? 'bg-secondary-500/30 ring-2 ring-secondary-400 shadow-lg'
                    : 'bg-primary-800/50 hover:bg-primary-700 active:scale-95'
                }`}
              >
                {emojiOption}
              </button>
            ))}
            {/* More Button - Perfectly sized */}
            <button
              type="button"
              onClick={() => setShowAllEmojis(true)}
              className="col-span-1 sm:col-span-1 text-lg sm:text-xl p-3 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 hover:from-neutral-700 border-2 border-dashed border-neutral-600 flex flex-col items-center justify-center min-h-[56px] sm:min-h-0 gap-1 text-neutral-400 hover:text-neutral-100 hover:border-neutral-500 transition-all shadow-md hover:shadow-lg active:scale-95"
              title={`+${moreCount} more emojis`}
            >
              <Plus size={18} className="sm:hidden" />
              <ChevronRight size={16} className="hidden sm:block" />
              <span className="text-xs sm:text-sm font-medium">+{moreCount}</span>
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

      {/* All Emojis Popup - Mobile Optimized */}
      <Modal isOpen={showAllEmojis} onClose={() => setShowAllEmojis(false)} title="Choose Emoji" size="lg">
        <div className="max-h-[50vh] overflow-y-auto p-3 sm:p-4">
          <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
            {ALL_EMOJIS.map((emojiOption) => (
              <button
                key={emojiOption}
                type="button"
                onClick={() => {
                  setEmoji(emojiOption);
                  setShowAllEmojis(false);
                }}
                className={`text-xl sm:text-2xl p-2 sm:p-3 rounded-xl transition-all flex items-center justify-center min-h-[48px] sm:min-h-0 ${
                  emoji === emojiOption
                    ? 'bg-secondary-500/40 ring-2 ring-secondary-400 shadow-lg scale-105'
                    : 'bg-primary-800/70 hover:bg-primary-700 active:scale-[0.96] hover:shadow-md'
                }`}
              >
                {emojiOption}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-neutral-800 px-2 sm:px-0">
          <Button variant="secondary" className="flex-1" onClick={() => setShowAllEmojis(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </Modal>
  );
};
