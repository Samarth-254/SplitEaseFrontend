import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, IndianRupee, DollarSign, Euro, PoundSterling, FileText, Users, Check, Percent, Tag, Trash2, ChevronDown } from 'lucide-react';
import { Button, Input, Modal } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { detectCategory } from '../../utils/categoryDetection';
import { expenseCategories } from '../../utils/categoryIcons';
import { getCurrencySymbol } from '../../utils/currency';


export const AddExpenseModal = ({ isOpen, onClose, preSelectedGroupId = null, expenseToEdit = null }) => {
  const { groups, currentUser, addExpense, updateExpense, deleteExpense, users } = useStore();
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(preSelectedGroupId || '');
  const [paidBy, setPaidBy] = useState('');
  const [splitBetween, setSplitBetween] = useState([]);
  const [splitType, setSplitType] = useState('equal'); // 'equal' or 'custom'
  const [customSplits, setCustomSplits] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [category, setCategory] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showPaidByDropdown, setShowPaidByDropdown] = useState(false);
  const [currency, setCurrency] = useState('INR');

  const isEditMode = !!expenseToEdit;


  // Get members of selected group
  const selectedGroupData = groups.find(g => (g._id || g.id) === selectedGroup);
  const groupMembers = selectedGroupData 
    ? (Array.isArray(selectedGroupData.members) && selectedGroupData.members.length > 0 && typeof selectedGroupData.members[0] === 'object'
        ? selectedGroupData.members
        : users.filter(u => selectedGroupData.members.includes(u._id || u.id)))
    : [];

  // Auto-select all members when group is preselected on mount
  useEffect(() => {
    if (preSelectedGroupId && groups.length > 0) {
      handleGroupChange(preSelectedGroupId);
    }
  }, [preSelectedGroupId, groups.length]);

  // Populate form when editing
  useEffect(() => {
    if (!isOpen) return;
    if (!expenseToEdit) return;

    const expenseGroupId = expenseToEdit.groupId?._id || expenseToEdit.groupId;
    if (expenseGroupId) {
      handleGroupChange(expenseGroupId);
    }

    setDescription(expenseToEdit.description || '');
    setAmount(String(expenseToEdit.amount ?? ''));
    setSplitType(expenseToEdit.splitType || 'equal');
    setCategory(expenseToEdit.category || '');
    setCurrency(expenseToEdit.currency || 'INR');
    setFormError('');
    setShowDeleteConfirm(false);

    const paidById = expenseToEdit.paidBy?._id || expenseToEdit.paidBy;
    if (paidById) {
      setPaidBy(paidById);
    }

    const splits = expenseToEdit.splits || [];
    const memberIds = splits.map(s => (s.user?._id || s.user)).filter(Boolean);

    if (memberIds.length > 0) {
      setSplitBetween(memberIds);
      const totalAmount = parseFloat(expenseToEdit.amount || 0) || 0;
      const initialSplits = {};
      if (totalAmount > 0) {
        memberIds.forEach(id => {
          const split = splits.find(s => (s.user?._id || s.user) === id);
          const splitAmt = split?.amount || 0;
          initialSplits[id] = ((splitAmt / totalAmount) * 100).toFixed(2);
        });
      } else {
        const equalPercent = (100 / memberIds.length).toFixed(2);
        memberIds.forEach(id => {
          initialSplits[id] = equalPercent;
        });
      }
      setCustomSplits(initialSplits);
    }
  }, [isOpen, expenseToEdit]);

  useEffect(() => {
    if (currentUser && !paidBy) {
      setPaidBy(currentUser._id || currentUser.id);
    }
  }, [currentUser]);

  // Reset form error when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormError('');
      setShowMemberDropdown(false);
      setShowPaidByDropdown(false);
      
      // If opening for new expense (not editing), reset and select all members
      if (!expenseToEdit && selectedGroup) {
        const group = groups.find(g => (g._id || g.id) === selectedGroup);
        if (group) {
          const members = group.members;
          const memberIds = Array.isArray(members) && members.length > 0 && typeof members[0] === 'object'
            ? members.map(m => m._id || m.id)
            : members;
          setSplitBetween(memberIds);
          const equalPercent = (100 / memberIds.length).toFixed(2);
          const initialSplits = {};
          memberIds.forEach(memberId => {
            initialSplits[memberId] = equalPercent;
          });
          setCustomSplits(initialSplits);
        }
      }
    }
  }, [isOpen, expenseToEdit, selectedGroup, groups]);


  // When group changes, reset split selection to all members
  const handleGroupChange = (groupId) => {
    setSelectedGroup(groupId);
    const group = groups.find(g => (g._id || g.id) === groupId);
    if (group) {
      const members = group.members;
      const memberIds = Array.isArray(members) && members.length > 0 && typeof members[0] === 'object'
        ? members.map(m => m._id || m.id)
        : members;
      setSplitBetween(memberIds);
      const equalPercent = (100 / memberIds.length).toFixed(2);
      const initialSplits = {};
      memberIds.forEach(memberId => {
        initialSplits[memberId] = equalPercent;
      });
      setCustomSplits(initialSplits);
      const currentUserId = currentUser?._id || currentUser?.id;
      if (!memberIds.includes(paidBy) && !memberIds.includes(currentUserId)) {
        setPaidBy(currentUserId || memberIds[0]);
      } else if (!paidBy) {
        setPaidBy(currentUserId || memberIds[0]);
      }
    }
  };


  const toggleMember = (memberId) => {
    setSplitBetween(prev => {
      const newSplit = prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId];
      
      // Recalculate equal splits if in equal mode
      if (splitType === 'equal' && newSplit.length > 0) {
        const equalPercent = (100 / newSplit.length).toFixed(2);
        const newCustomSplits = {};
        newSplit.forEach(id => {
          newCustomSplits[id] = equalPercent;
        });
        setCustomSplits(newCustomSplits);
      }
      
      return newSplit;
    });
  };

  const handleCustomSplitChange = (memberId, value) => {
    const newValue = parseFloat(value) || 0;
    
    setCustomSplits(prev => {
      const updated = { ...prev, [memberId]: value };
      
      // Calculate total of manually entered percentages
      let manualTotal = 0;
      const manualMembers = [];
      const autoMembers = [];
      
      splitBetween.forEach(id => {
        if (id === memberId) {
          manualTotal += newValue;
          manualMembers.push(id);
        } else if (updated[id] && updated[id] !== '') {
          manualTotal += parseFloat(updated[id]) || 0;
          manualMembers.push(id);
        } else {
          autoMembers.push(id);
        }
      });
      
      // Distribute remaining percentage among members without manual values
      if (autoMembers.length > 0) {
        const remaining = Math.max(0, 100 - manualTotal);
        const basePercent = Math.floor((remaining / autoMembers.length) * 100) / 100;
        const totalBase = basePercent * autoMembers.length;
        const extraNeeded = Math.round((remaining - totalBase) * 100) / 100;
        
        autoMembers.forEach((id, index) => {
          if (index === 0) {
            // Give the first member the base + any extra needed to reach exactly 100%
            updated[id] = (basePercent + extraNeeded).toFixed(2);
          } else {
            updated[id] = basePercent.toFixed(2);
          }
        });
      }
      
      return updated;
    });
  };

  const getTotalSplitPercentage = () => {
    return splitBetween.reduce((sum, memberId) => {
      return sum + (parseFloat(customSplits[memberId]) || 0);
    }, 0);
  };

  const handleSplitTypeChange = (type) => {
    setSplitType(type);
    if (type === 'equal' && splitBetween.length > 0) {
      const equalPercent = (100 / splitBetween.length).toFixed(2);
      const newCustomSplits = {};
      splitBetween.forEach(memberId => {
        newCustomSplits[memberId] = equalPercent;
      });
      setCustomSplits(newCustomSplits);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description || !selectedGroup || splitBetween.length === 0) return;

    if (splitType === 'custom') {
      const totalPercent = getTotalSplitPercentage();
      if (Math.abs(totalPercent - 100) > 0.01) {
        setFormError(`Split percentages must total 100%. Current total: ${totalPercent.toFixed(2)}%`);
        return;
      }
    }

    setIsSubmitting(true);
    setFormError('');
    
    try {
      const detectedCategory = detectCategory(description);
      const finalCategory = category || detectedCategory;

      // Build splits array from percentages using paise so totals match exactly
      const amountInPaise = Math.round(parseFloat(amount) * 100);
      let splits = [];

      if (splitType === 'custom') {
        const raw = splitBetween.map((memberId) => {
          const percent = parseFloat(customSplits[memberId]) || 0;
          return { memberId, percent };
        });

        const paiseSplits = raw.map(({ memberId, percent }) => ({
          user: memberId,
          paise: Math.floor((amountInPaise * percent) / 100)
        }));

        let used = paiseSplits.reduce((s, x) => s + x.paise, 0);
        let remainder = amountInPaise - used;
        for (let i = 0; i < paiseSplits.length && remainder > 0; i += 1) {
          paiseSplits[i].paise += 1;
          remainder -= 1;
        }

        splits = paiseSplits.map(s => ({ user: s.user, amount: s.paise / 100 }));
      } else {
        // For equal split, use customSplits percentages if available, otherwise calculate equal
        const numberOfPeople = splitBetween.length;
        const base = Math.floor(amountInPaise / numberOfPeople);
        const rem = amountInPaise % numberOfPeople;
        splits = splitBetween.map((userId, index) => ({
          user: userId,
          amount: (base + (index < rem ? 1 : 0)) / 100
        }));
      }

      const paidById = paidBy || (currentUser?._id || currentUser?.id);

      if (isEditMode) {
        const expenseId = expenseToEdit._id || expenseToEdit.id;
        await updateExpense(expenseId, {
          description,
          amount: parseFloat(amount),
          paidBy: paidById,
          splitType,
          splits,
          category: finalCategory,
          currency
        });

        setIsSubmitting(false);
        onClose();
        return;
      }
      
      await addExpense({
        groupId: selectedGroup,
        description,
        amount: parseFloat(amount),
        paidBy: paidById,
        splitBetween,
        splitType,
        category: finalCategory,
        splits,
        currency
      });

      setAmount('');
      setDescription('');
      setSelectedGroup(preSelectedGroupId || '');
      setSplitBetween([]);
      setCustomSplits({});
      setSplitType('equal');
      setCategory('');
      setCurrency('INR');
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setFormError(err.message || (isEditMode ? 'Failed to update expense' : 'Failed to add expense'));
      setIsSubmitting(false);
    }
  };

  const canDelete = (() => {
    if (!expenseToEdit || !currentUser) return false;
    const currentUserId = currentUser._id || currentUser.id;
    const creatorId = expenseToEdit.createdBy?._id || expenseToEdit.createdBy || expenseToEdit.paidBy?._id || expenseToEdit.paidBy;
    return String(creatorId) === String(currentUserId);
  })();

  const handleDelete = async () => {
    if (!expenseToEdit) return;
    if (!canDelete) return;

    try {
      setIsSubmitting(true);
      setFormError('');
      await deleteExpense(expenseToEdit._id || expenseToEdit.id);
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setFormError(err.message || 'Failed to delete expense');
    }
  };


  const splitPreview = splitBetween.length > 0 && amount 
    ? splitBetween.map(memberId => {
        const percentage = parseFloat(customSplits[memberId]) || 0;
        const splitAmount = (parseFloat(amount) * percentage) / 100;
        const member = groupMembers.find(m => (m._id || m.id) === memberId);
        return { memberId, amount: splitAmount, percentage, member };
      })
    : [];


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          
          {/* Modal Container - Flexbox Centering */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-md pointer-events-auto my-8"
            >
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden max-h-[calc(100vh-4rem)]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                  <h2 className="text-lg font-semibold text-white">{isEditMode ? 'Edit Expense' : 'Add Expense'}</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
                  >
                    <X size={20} className="text-neutral-400" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
                  {/* Amount */}
                  <div>
                    <label className="text-sm text-neutral-400 mb-1.5 block">Amount</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        {currency === 'INR' && <IndianRupee size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />}
                        {(currency === 'USD' || currency === 'AUD' || currency === 'CAD') && <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />}
                        {currency === 'EUR' && <Euro size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />}
                        {currency === 'GBP' && <PoundSterling size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />}
                        {(currency === 'JPY' || currency === 'CNY') && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-semibold">¥</span>}
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-10 pr-4 text-white text-lg font-semibold placeholder:text-neutral-600 focus:outline-none focus:border-orange-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          required
                        />
                      </div>
                      {/* <div className="relative w-28">
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer h-full"
                        >
                          <option value="INR">₹ INR</option>
                          <option value="USD">$ USD</option>
                          <option value="EUR">€ EUR</option>
                          <option value="GBP">£ GBP</option>
                          <option value="AUD">A$ AUD</option>
                          <option value="CAD">C$ CAD</option>
                          <option value="JPY">¥ JPY</option>
                          <option value="CNY">¥ CNY</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                      </div> */}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm text-neutral-400 mb-1.5 block">Description</label>
                    <div className="relative">
                      <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="text"
                        placeholder="What's this for?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 100))}
                        maxLength={100}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
                        required
                      />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{description.length}/100 characters</p>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-sm text-neutral-400 mb-1.5 block">Category</label>
                    <div className="relative">
                      <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <select
                        value={category || ''}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-10 pr-10 text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="">Auto ({detectCategory(description || '')})</option>
                        {expenseCategories.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Group Select */}
                  <div>
                    <label className="text-sm text-neutral-400 mb-1.5 block">Group</label>
                    <div className="relative">
                      <select
                        value={selectedGroup}
                        onChange={(e) => handleGroupChange(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer"
                        required
                        disabled={!!preSelectedGroupId}
                      >
                        <option value="">Select a group</option>
                        {groups.map(group => (
                          <option key={group._id || group.id} value={group._id || group.id}>
                            {group.emoji} {group.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Paid By */}
                  {selectedGroup && groupMembers.length > 0 && (
                    <div>
                      <label className="text-sm text-neutral-400 mb-1.5 block">Paid by</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowPaidByDropdown(!showPaidByDropdown)}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 px-4 text-left text-white focus:outline-none focus:border-orange-500 transition-colors flex items-center justify-between"
                        >
                          <span>
                            {(() => {
                              const member = groupMembers.find(m => (m._id || m.id) === paidBy);
                              const currentUserId = currentUser?._id || currentUser?.id;
                              return (member?._id || member?.id) === currentUserId ? 'You' : (member?.name || 'Select');
                            })()}
                          </span>
                          <ChevronDown size={18} className={`text-neutral-500 transition-transform ${showPaidByDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showPaidByDropdown && (
                          <div className="absolute z-10 w-full bottom-full mb-2 bg-neutral-800 border border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {groupMembers.map(member => {
                              const memberId = member._id || member.id;
                              const currentUserId = currentUser?._id || currentUser?.id;
                              const isSelected = paidBy === memberId;
                              return (
                                <button
                                  key={memberId}
                                  type="button"
                                  onClick={() => {
                                    setPaidBy(memberId);
                                    setShowPaidByDropdown(false);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-700 cursor-pointer transition-colors border-b border-neutral-700 last:border-b-0 text-left"
                                >
                                  <span className="text-sm text-white flex-1">
                                    {memberId === currentUserId ? 'You' : member.name}
                                  </span>
                                  {isSelected && <Check size={16} className="text-orange-500" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Split Between */}
                  {selectedGroup && groupMembers.length > 0 && (
                    <div>
                      <label className="text-sm text-neutral-400 mb-1.5 block">
                        Split between ({splitBetween.length} selected)
                      </label>
                      
                      {/* Split Type Toggle */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => handleSplitTypeChange('equal')}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                            splitType === 'equal'
                              ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                              : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                          }`}
                        >
                          {splitType === 'equal' && <Check size={14} />}
                          <span className="text-sm">Split Equally</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSplitTypeChange('custom')}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                            splitType === 'custom'
                              ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                              : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                          }`}
                        >
                          {splitType === 'custom' && <Check size={14} />}
                          <span className="text-sm">Custom Split</span>
                        </button>
                      </div>

                      {/* Member Selection Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 px-4 text-left text-white focus:outline-none focus:border-orange-500 transition-colors flex items-center justify-between"
                        >
                          <span>
                            {splitBetween.length === groupMembers.length
                              ? 'All members'
                              : `${splitBetween.length} member${splitBetween.length !== 1 ? 's' : ''} selected`}
                          </span>
                          <ChevronDown size={18} className={`text-neutral-500 transition-transform ${showMemberDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showMemberDropdown && (
                          <div className="absolute z-10 w-full bottom-full mb-2 bg-neutral-800 border border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {groupMembers.map(member => {
                              const memberId = member._id || member.id;
                              const currentUserId = currentUser?._id || currentUser?.id;
                              const isSelected = splitBetween.includes(memberId);
                              return (
                                <label
                                  key={memberId}
                                  className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-700 cursor-pointer transition-colors border-b border-neutral-700 last:border-b-0"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleMember(memberId)}
                                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
                                  />
                                  <span className="text-sm text-white flex-1">
                                    {memberId === currentUserId ? 'You' : member.name}
                                  </span>
                                  {isSelected && <Check size={16} className="text-orange-500" />}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      {/* Custom Split Inputs */}
                      {splitType === 'custom' && splitBetween.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-neutral-500 mb-2">Set percentage for each person:</p>
                          {groupMembers.filter(m => splitBetween.includes(m._id || m.id)).map(member => {
                            const memberId = member._id || member.id;
                            const currentUserId = currentUser?._id || currentUser?.id;
                            return (
                              <div key={memberId} className="flex items-center gap-2">
                                <span className="text-sm text-neutral-300 flex-1">
                                  {memberId === currentUserId ? 'You' : member.name}
                                </span>
                                <div className="relative w-24">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={customSplits[memberId] || ''}
                                    onChange={(e) => handleCustomSplitChange(memberId, e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-1.5 pl-2 pr-7 text-white text-sm focus:outline-none focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="0"
                                  />
                                  <Percent size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500" />
                                </div>
                              </div>
                            );
                          })}
                          <div className={`text-xs font-medium text-right ${
                            Math.abs(getTotalSplitPercentage() - 100) < 0.01 
                              ? 'text-green-400' 
                              : 'text-red-400'
                          }`}>
                            Total: {getTotalSplitPercentage().toFixed(2)}%
                          </div>
                        </div>
                      )}
                      
                      {/* Split Preview */}
                      {splitBetween.length > 0 && amount && (
                        <div className="mt-3 p-3 bg-neutral-800 rounded-lg">
                          <p className="text-xs text-neutral-500 mb-2">Split breakdown:</p>
                          {splitPreview.map(({ memberId, amount: splitAmount, percentage }) => {
                            const member = groupMembers.find(m => (m._id || m.id) === memberId);
                            const currentUserId = currentUser?._id || currentUser?.id;
                            return (
                              <div key={memberId} className="flex justify-between text-sm text-neutral-300 mb-1">
                                <span>{(member?._id || member?.id) === currentUserId ? 'You' : member?.name}</span>
                                <span className="font-medium">
                                  {getCurrencySymbol(currency)}{splitAmount.toFixed(2)} <span className="text-neutral-500">({percentage.toFixed(1)}%)</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {isEditMode ? (
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant="danger"
                        className="w-full"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={!canDelete || isSubmitting}
                      >
                        Delete
                      </Button>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={!amount || !description || !selectedGroup || splitBetween.length === 0 || isSubmitting}
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="submit"
                      className="w-full mt-2"
                      disabled={!amount || !description || !selectedGroup || splitBetween.length === 0 || isSubmitting}
                    >
                      {isSubmitting ? 'Adding...' : 'Add Expense'}
                    </Button>
                  )}

                  {formError && (
                    <p className="text-sm text-red-400 text-center">{formError}</p>
                  )}
                </form>
              </div>
            </motion.div>
          </div>

          {/* Delete confirmation */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
                  onClick={() => !isSubmitting && setShowDeleteConfirm(false)}
                />
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    transition={{ type: 'spring', duration: 0.25 }}
                    className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden"
                  >
                    <div className="p-4 border-b border-neutral-800">
                      <div className="flex items-center gap-2">
                        <Trash2 size={18} className="text-red-400" />
                        <h3 className="text-base font-semibold text-neutral-100">Delete expense?</h3>
                      </div>
                      <p className="text-sm text-neutral-400 mt-2">This can’t be undone.</p>
                    </div>
                    <div className="p-4 flex gap-2 justify-end">
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        type="button"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};


export default AddExpenseModal;





