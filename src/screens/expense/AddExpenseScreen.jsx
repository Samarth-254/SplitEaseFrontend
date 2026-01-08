import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Users, 
  Check,
  Receipt,
  Utensils,
  Car,
  Home,
  Zap,
  Film,
  ShoppingBag
} from 'lucide-react';
import { Screen, Header } from '../../components/layout';
import { Button, Input, Select, Card, Avatar, Badge } from '../../components/ui';
import { useStore } from '../../store/useStore';

/**
 * Add Expense Screen
 * 
 * UX Decisions:
 * - Single primary CTA at bottom
 * - Minimal required inputs
 * - Easy split options (equal by default)
 * - Large touch targets
 * - Designed for one-hand usage
 * - Visual category selection
 */

const categories = [
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'transport', label: 'Transport', icon: Car },
  { id: 'accommodation', label: 'Stay', icon: Home },
  { id: 'utilities', label: 'Utilities', icon: Zap },
  { id: 'entertainment', label: 'Fun', icon: Film },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'other', label: 'Other', icon: Receipt },
];

const splitTypes = [
  { value: 'equal', label: 'Split Equally' },
  { value: 'custom', label: 'Custom Split' },
  { value: 'full', label: 'Owed Full Amount' },
];

export const AddExpenseScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedGroup = searchParams.get('group');
  
  const { groups, getGroupMembers, addExpense, currentUser } = useStore();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [groupId, setGroupId] = useState(preselectedGroup || '');
  const [category, setCategory] = useState('food');
  const [splitType, setSplitType] = useState('equal');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [paidBy, setPaidBy] = useState(currentUser?.id || '1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const members = groupId ? getGroupMembers(groupId) : [];

  // Initialize selected members when group changes
  useEffect(() => {
    if (groupId && members.length > 0) {
      setSelectedMembers(members.map(m => m.id));
      setPaidBy(currentUser?.id || members[0]?.id);
    }
  }, [groupId, members.length]);

  const toggleMember = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!groupId) {
      setError('Please select a group');
      return;
    }
    
    if (selectedMembers.length === 0) {
      setError('Please select at least one member to split with');
      return;
    }
    
    setLoading(true);
    
    try {
      await addExpense({
        groupId,
        description: description.trim(),
        amount: parseFloat(amount),
        paidBy,
        splitBetween: selectedMembers,
        splitType,
        category,
      });
      
      navigate(`/group/${groupId}`);
    } catch (err) {
      setError(err.message || 'Failed to add expense');
      setLoading(false);
    }
  };

  const perPersonAmount = amount && selectedMembers.length > 0
    ? (parseFloat(amount) / selectedMembers.length).toFixed(2)
    : '0.00';

  return (
    <Screen padded={false}>
      <Header title="Add Expense" showBack />
      
      <form onSubmit={handleSubmit} className="flex flex-col min-h-[calc(100vh-56px)]">
        <div className="flex-1 px-4 py-6 lg:px-8 space-y-6 overflow-y-auto">
          {/* Amount Input - Large and prominent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4"
          >
            <label className="text-sm text-neutral-500 block mb-3">Amount</label>
            <div className="relative inline-flex items-center">
              <span className="text-4xl font-bold text-neutral-400 mr-2">?</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="
                  text-5xl font-bold text-neutral-100
                  bg-transparent border-none outline-none
                  w-48 text-center
                  placeholder:text-neutral-700
                  [appearance:textfield]
                  [&::-webkit-outer-spin-button]:appearance-none
                  [&::-webkit-inner-spin-button]:appearance-none
                "
              />
            </div>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Input
              label="Description"
              placeholder="What's this expense for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              icon={<Receipt size={20} />}
            />
          </motion.div>

          {/* Category Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="text-sm font-medium text-neutral-300 block mb-3">
              Category
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCategory(id)}
                  className={`
                    flex flex-col items-center gap-1.5
                    px-4 py-3 rounded-xl
                    transition-all duration-200
                    flex-shrink-0
                    ${category === id
                      ? 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/30'
                      : 'bg-primary-800 text-neutral-400 border border-transparent hover:bg-primary-700'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Group Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Select
              label="Group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              icon={<Users size={20} />}
              placeholder="Select a group"
              options={groups.map(g => ({ value: g.id, label: `${g.emoji} ${g.name}` }))}
            />
          </motion.div>

          {/* Paid By */}
          {groupId && members.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label className="text-sm font-medium text-neutral-300 block mb-3">
                Paid by
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setPaidBy(member.id)}
                    className={`
                      flex items-center gap-2
                      px-4 py-2.5 rounded-xl
                      transition-all duration-200
                      flex-shrink-0
                      ${paidBy === member.id
                        ? 'bg-secondary-500/20 border border-secondary-500/30'
                        : 'bg-primary-800 border border-transparent hover:bg-primary-700'
                      }
                    `}
                  >
                    <Avatar name={member.name} size="xs" />
                    <span className={`text-sm font-medium ${paidBy === member.id ? 'text-secondary-400' : 'text-neutral-300'}`}>
                      {member.id === currentUser?.id ? 'You' : member.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Split Type */}
          {groupId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Select
                label="Split type"
                value={splitType}
                onChange={(e) => setSplitType(e.target.value)}
                options={splitTypes}
              />
            </motion.div>
          )}

          {/* Member Selection */}
          {groupId && members.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-neutral-300">
                  Split between
                </label>
                {amount && selectedMembers.length > 0 && (
                  <Badge variant="accent" size="sm">
                    ?${perPersonAmount}/person
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                {members.map((member) => {
                  const isSelected = selectedMembers.includes(member.id);
                  
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className={`
                        w-full flex items-center gap-3
                        p-3 rounded-xl
                        transition-all duration-200
                        ${isSelected
                          ? 'bg-secondary-500/10 border border-secondary-500/30'
                          : 'bg-primary-800 border border-transparent hover:bg-primary-700'
                        }
                      `}
                    >
                      <div className={`
                        w-6 h-6 rounded-full border-2 
                        flex items-center justify-center
                        transition-colors duration-200
                        ${isSelected 
                          ? 'border-secondary-500 bg-secondary-500' 
                          : 'border-neutral-600'
                        }
                      `}>
                        {isSelected && <Check size={14} className="text-black" />}
                      </div>
                      
                      <Avatar name={member.name} size="sm" />
                      
                      <span className={`font-medium ${isSelected ? 'text-neutral-100' : 'text-neutral-400'}`}>
                        {member.id === currentUser?.id ? 'You' : member.name}
                      </span>
                      
                      {isSelected && amount && (
                        <span className="ml-auto text-sm text-neutral-500">
                          ?${perPersonAmount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-400 text-center"
            >
              {error}
            </motion.p>
          )}
        </div>

        {/* Submit Button - Fixed at bottom */}
        <div className="p-4 lg:px-8 border-t border-border bg-primary-950/80 backdrop-blur-lg safe-bottom">
          <Button
            type="submit"
            size="xl"
            fullWidth
            loading={loading}
            disabled={!amount || !description || !groupId}
          >
            Add Expense
          </Button>
        </div>
      </form>
    </Screen>
  );
};





