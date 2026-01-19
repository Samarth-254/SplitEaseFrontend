import { useState } from 'react';
import { Modal, Button, Input } from '../ui';
import { Users, Plus } from 'lucide-react';
import ReactGA from 'react-ga4';
import apiService from '../../services/api';
import { useStore } from '../../store/useStore';

const PRIMARY_EMOJIS = ['🏠', '🗽', '✈️', '🍕', '🍺', '⛰️', '🏖️', '🎬', '🎮', '💼', '🏋️'];
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
].filter((emoji, index, self) => self.indexOf(emoji) === index);

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
        {/* Emoji Picker - 2 ROWS ON MOBILE */}
        <div>
          <label className="text-sm text-neutral-400 mb-3 block">Choose an emoji</label>
          
          <div className="space-y-2">
            {/* Row 1: First 6 Emojis */}
            <div className="grid grid-cols-6 gap-2">
              {PRIMARY_EMOJIS.slice(0, 6).map((emojiOption) => (
                <button
                  key={emojiOption}
                  type="button"
                  onClick={() => setEmoji(emojiOption)}
                  className={`text-2xl sm:text-3xl p-2 sm:p-3 rounded-xl transition-all flex items-center justify-center aspect-square ${
                    emoji === emojiOption
                      ? 'bg-orange-500/20 ring-2 ring-orange-500 shadow-lg'
                      : 'bg-neutral-800/50 hover:bg-neutral-700 active:scale-95'
                  }`}
                >
                  {emojiOption}
                </button>
              ))}
            </div>
            
            {/* Row 2: Next 5 Emojis + More Button */}
            <div className="grid grid-cols-6 gap-2">
              {PRIMARY_EMOJIS.slice(6, 11).map((emojiOption) => (
                <button
                  key={emojiOption}
                  type="button"
                  onClick={() => setEmoji(emojiOption)}
                  className={`text-2xl sm:text-3xl p-2 sm:p-3 rounded-xl transition-all flex items-center justify-center aspect-square ${
                    emoji === emojiOption
                      ? 'bg-orange-500/20 ring-2 ring-orange-500 shadow-lg'
                      : 'bg-neutral-800/50 hover:bg-neutral-700 active:scale-95'
                  }`}
                >
                  {emojiOption}
                </button>
              ))}
              
              {/* More Button */}
              <button
                type="button"
                onClick={() => setShowAllEmojis(true)}
                className="text-sm sm:text-base p-2 sm:p-3 rounded-xl bg-neutral-800/50 hover:bg-neutral-700 border-2 border-dashed border-neutral-600 hover:border-neutral-500 flex flex-col items-center justify-center aspect-square text-neutral-400 hover:text-neutral-100 transition-all active:scale-95"
              >
                {/* <Plus size={16} className="mb-0.5" /> */}
                <span className="text-[10px] sm:text-xs font-medium">+{moreCount}</span>
              </button>
            </div>
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

      {/* All Emojis Modal - ONLY BORDER, NO CHECKMARK */}
      <Modal isOpen={showAllEmojis} onClose={() => setShowAllEmojis(false)} title="Choose Emoji" size="lg">
        <div className="max-h-[50vh] overflow-y-auto p-3 sm:p-4">
          <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
            {ALL_EMOJIS.map((emojiOption) => {
              const isSelected = emoji === emojiOption;
              
              return (
                <button
                  key={emojiOption}
                  type="button"
                  onClick={() => {
                    setEmoji(emojiOption);
                    setShowAllEmojis(false);
                  }}
                  className={`text-xl sm:text-2xl p-2 sm:p-3 rounded-xl transition-all flex items-center justify-center aspect-square ${
                    isSelected
                      ? 'bg-orange-500/20 ring-2 ring-orange-500 shadow-lg'
                      : 'bg-neutral-800/50 hover:bg-neutral-700 active:scale-95'
                  }`}
                >
                  {emojiOption}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-neutral-800">
          <Button variant="secondary" fullWidth onClick={() => setShowAllEmojis(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </Modal>
  );
};
