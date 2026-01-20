import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion ,AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, ChevronRight, Users, Wallet, Calendar, UserPlus, Loader2, Download, X,Check  } from 'lucide-react';
import ReactGA from 'react-ga4';
import { Screen } from '../../components/layout';
import { Button, Card, Badge, EmptyState, Modal, Avatar } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { AddExpenseModal } from '../expense/AddExpenseModal';
import { CreateGroupModal } from '../../components/groups/CreateGroupModal';
import { getCurrencySymbol } from '../../utils/currency';
import { usePWAInstall } from '../../utils/usePWAInstall';
import { InstallInstructionsModal } from '../../components/InstallInstructionsModal';
import apiService from '../../services/api';

export const DashboardScreen = () => {
  const navigate = useNavigate();
  const { 
    groups, 
    expenses, 
    settlements, 
    getTotalBalance, 
    getGroupSummary, 
    currentUser, 
    settleUp, 
    getGroupBalances,
    isInitialLoadComplete,
    loadGroups,
    loadGroupExpenses,
    loadGroupSettlements
  } = useStore();
  
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showSettleUpModal, setShowSettleUpModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [isSettling, setIsSettling] = useState(false);
  const [showGroupBreakdownModal, setShowGroupBreakdownModal] = useState(false);
  const [selectedDebtBreakdown, setSelectedDebtBreakdown] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { isInstallable, promptInstall, showInstructionsModal, closeInstructionsModal } = usePWAInstall();
  const isDataLoading = !isInitialLoadComplete;
  
  const balance = useMemo(() => getTotalBalance(), [expenses, settlements, currentUser]);
  
  const thisMonthExpenses = useMemo(() => {
    return expenses.filter(e => {
      const expDate = new Date(e.createdAt || e.date);
      const now = new Date();
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    });
  }, [expenses]);

  const thisMonthTotal = useMemo(() => {
    return thisMonthExpenses.reduce((sum, expense) => {
      const currentUserId = currentUser?._id || currentUser?.id;
      const paidById = expense.paidBy?._id || expense.paidBy;
      const splits = expense.splits || [];
      
      if (splits.length > 0) {
        const userSplit = splits.find(s => (s.user?._id || s.user) === currentUserId);
        const paidAmount = paidById === currentUserId ? expense.amount : 0;
        const oweAmount = userSplit ? userSplit.amount : 0;
        return sum + paidAmount - oweAmount;
      } else {
        const splitBetween = expense.splitBetween || [];
        const share = splitBetween.length > 0 ? expense.amount / splitBetween.length : 0;
        const isPayer = paidById === currentUserId;
        const isInvolved = splitBetween.includes(currentUserId);
        
        if (isPayer && isInvolved) {
         return sum + (expense.amount - share);
        } else if (isPayer) {
         return sum + expense.amount;
        } else if (isInvolved) {
         return sum - share;
        }
        return sum;
      }
    }, 0);
  }, [thisMonthExpenses, currentUser]);

  // ✅ EXACT COPY from Friends: Calculate balance with a member
  const calculateMemberBalance = (memberId) => {
    try {
      let youOwe = 0;
      let theyOwe = 0;

      const currentUserId = currentUser?._id || currentUser?.id;
      if (!currentUserId || !memberId) return 0;

      if (Array.isArray(expenses)) {
        expenses.forEach(expense => {
          try {
            if (!expense?.paidBy || !Array.isArray(expense?.splits)) return;
            
            const paidBy = expense.paidBy?._id || expense.paidBy?.id || expense.paidBy;
            if (!paidBy) return;
            
            const paidByStr = String(paidBy);
            const memberIdStr = String(memberId);
            const currentUserIdStr = String(currentUserId);
            
            expense.splits.forEach(split => {
              try {
                if (!split?.user) return;
                
                const splitUserId = split.user?._id || split.user?.id || split.user;
                if (!splitUserId) return;
                
                const splitUserIdStr = String(splitUserId);
                const amount = Number(split.amount) || 0;
                
                if (paidByStr === memberIdStr && splitUserIdStr === currentUserIdStr) {
                  youOwe += amount;
                }
                
                if (paidByStr === currentUserIdStr && splitUserIdStr === memberIdStr) {
                  theyOwe += amount;
                }
              } catch (err) {}
            });
          } catch (err) {}
        });
      }

      if (Array.isArray(settlements)) {
        settlements.forEach(settlement => {
          try {
            if (!settlement?.from || !settlement?.to) return;
            
            const fromId = settlement.from?._id || settlement.from?.id || settlement.from;
            const toId = settlement.to?._id || settlement.to?.id || settlement.to;
            
            if (!fromId || !toId) return;
            
            const fromIdStr = String(fromId);
            const toIdStr = String(toId);
            const currentUserIdStr = String(currentUserId);
            const memberIdStr = String(memberId);
            const amount = Number(settlement.amount) || 0;
            
            if (fromIdStr === currentUserIdStr && toIdStr === memberIdStr) {
              youOwe -= amount;
            }
            
            if (fromIdStr === memberIdStr && toIdStr === currentUserIdStr) {
              theyOwe -= amount;
            }
          } catch (err) {}
        });
      }

      const netBalance = theyOwe - youOwe;
      return netBalance;
    } catch (error) {
      return 0;
    }
  };

  // ✅ EXACT COPY from Friends: Get groupwise breakdown
  const getGroupWiseBreakdown = (memberId) => {
    const currentUserId = currentUser?.id || currentUser?._id;
    const groupMap = new Map();
    
    if (!currentUserId || !memberId) return [];
    
    const currentUserIdStr = String(currentUserId);
    const memberIdStr = String(memberId);
    
    // Process expenses
    if (Array.isArray(expenses)) {
      expenses.forEach(expense => {
        if (!expense?.splits || !Array.isArray(expense.splits)) return;
        if (!expense.groupId && !expense.group) return;
        
        const groupId = String(expense.groupId || expense.group?._id || expense.group?.id || expense.group);
        const paidById = expense.paidBy?._id || expense.paidBy?.id || expense.paidBy;
        if (!paidById) return;
        
        const paidByStr = String(paidById);
        
        expense.splits.forEach(split => {
          const splitUserId = split.user?._id || split.user?.id || split.user;
          if (!splitUserId) return;
          
          const splitUserIdStr = String(splitUserId);
          const amount = Number(split.amount) || 0;
          
          // Member paid and YOU have a split = you owe them (negative balance)
          if (paidByStr === memberIdStr && splitUserIdStr === currentUserIdStr) {
            const current = groupMap.get(groupId) || { balance: 0 };
            current.balance -= amount;
            groupMap.set(groupId, current);
          }
          
          // YOU paid and MEMBER has a split = they owe you (positive balance)
          if (paidByStr === currentUserIdStr && splitUserIdStr === memberIdStr) {
            const current = groupMap.get(groupId) || { balance: 0 };
            current.balance += amount;
            groupMap.set(groupId, current);
          }
        });
      });
    }
    
    // Process settlements
    if (Array.isArray(settlements)) {
      settlements.forEach(settlement => {
        if (!settlement?.from || !settlement?.to) return;
        if (!settlement.groupId && !settlement.group) return;
        
        const groupId = String(settlement.groupId || settlement.group?._id || settlement.group?.id || settlement.group);
        const fromId = String(settlement.from?._id || settlement.from?.id || settlement.from);
        const toId = String(settlement.to?._id || settlement.to?.id || settlement.to);
        const amount = Number(settlement.amount) || 0;
        
        // You paid the member
        if (fromId === currentUserIdStr && toId === memberIdStr) {
          const current = groupMap.get(groupId) || { balance: 0 };
          current.balance += amount;
          groupMap.set(groupId, current);
        }
        
        // Member paid you
        if (fromId === memberIdStr && toId === currentUserIdStr) {
          const current = groupMap.get(groupId) || { balance: 0 };
          current.balance -= amount;
          groupMap.set(groupId, current);
        }
      });
    }
    
    const result = [];
    groupMap.forEach((data, groupId) => {
      if (Math.abs(data.balance) < 0.01) return; // Skip settled groups
      
      const group = groups.find(g => String(g._id || g.id) === groupId);
      if (!group) return;
      
      result.push({
        groupId,
        groupName: group.name,
        groupEmoji: group.emoji,
        balance: data.balance
      });
    });
    
    result.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
    
    return result;
  };

  const showToast = (message) => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // ✅ Build member list from all groups
  const allMembers = useMemo(() => {
    const memberMap = new Map();
    
    groups.forEach(group => {
      const members = group.members || [];
      members.forEach(member => {
        const memberId = member._id || member.id;
        const currentUserId = currentUser?._id || currentUser?.id;
        
        // Skip current user
        if (String(memberId) === String(currentUserId)) return;
        
        if (!memberMap.has(memberId)) {
          memberMap.set(memberId, {
            ...member,
            _id: memberId,
            id: memberId
          });
        }
      });
    });
    
    return Array.from(memberMap.values());
  }, [groups, currentUser]);

// ✅ Calculate debts with FULL breakdown stored
const allDebts = useMemo(() => {
  return allMembers
    .map(member => {
      const memberId = member._id || member.id;
      const netBalance = calculateMemberBalance(memberId);
      const fullGroupBreakdown = getGroupWiseBreakdown(memberId); // ALL groups
      
      // Filter only groups where you owe them (negative balance)
      const groupsYouOwe = fullGroupBreakdown.filter(g => g.balance < 0);
      
      // Sort by amount descending
      groupsYouOwe.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
      
      return {
        memberId,
        memberName: member.name,
        member,
        netBalance,
        fullGroupBreakdown, // Store ALL groups for modal
        groupsYouOwe, // Only groups where you owe
        totalAmount: Math.abs(netBalance),
        primaryGroup: groupsYouOwe[0], // Largest debt group
        additionalGroupsCount: fullGroupBreakdown.length - 1  // ✅ Count ALL groups
      };
    })
    .filter(debt => debt.netBalance < -0.01) // Only show if NET you owe them
    .sort((a, b) => b.totalAmount - a.totalAmount);
}, [allMembers, expenses, settlements, currentUser, groups]);


  const handleInstallClick = async () => {
    const result = await promptInstall('Dashboard Header');
    
    if (result === 'unavailable') {
      alert('Install not available. The app may already be installed, or try refreshing the page.');
    }
  };

  const handleSettleDebt = (debt) => {
    setSelectedDebt(debt);
    setShowSettleUpModal(true);
    
    ReactGA.event({
      category: 'Settlement',
      action: 'Opened Settle Modal from Dashboard',
      label: debt.memberName
    });
  };

  const handleShowGroupBreakdown = (debt) => {
    setSelectedDebtBreakdown(debt);
    setShowGroupBreakdownModal(true);
    
    ReactGA.event({
      category: 'Dashboard',
      action: 'Viewed Group Breakdown',
      label: debt.memberName
    });
  };

  // ✅ EXACT COPY from Friends: Multi-group settlement
  const handleSettleUp = async () => {
    if (!selectedDebt) return;

    setIsSettling(true);
    try {
      const groupBreakdown = selectedDebt.fullGroupBreakdown; // Use ALL groups
      
      if (groupBreakdown.length === 0) {
        showToast('No balances to settle');
        setIsSettling(false);
        return;
      }

      const friendId = String(selectedDebt.memberId);
      const myId = String(currentUser._id || currentUser.id);

      const promises = [];
      
      for (const group of groupBreakdown) {
        const groupBalance = group.balance;
        const amount = Math.abs(groupBalance);
        
        if (amount < 0.01) continue;
        
        let fromUserId, toUserId;
        
        if (groupBalance < 0) {
          fromUserId = myId;
          toUserId = friendId;
        } else {
          fromUserId = friendId;
          toUserId = myId;
        }
        
        const note = groupBreakdown.length > 1 
          ? `Net Settlement (${groupBreakdown.length} groups)` 
          : 'Payment';
        
        promises.push(
          apiService.recordSettlement(group.groupId, fromUserId, toUserId, amount, note)
        );
      }

      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 1000));

      await loadGroups();
      
      for (const group of groupBreakdown) {
        await loadGroupExpenses(group.groupId);
        await loadGroupSettlements(group.groupId);
      }

      const totalAmount = groupBreakdown.reduce((sum, g) => sum + Math.abs(g.balance), 0);
      
      ReactGA.event({
        category: 'Settlement',
        action: 'Settled with Friend',
        label: selectedDebt.memberName,
        value: Math.round(totalAmount)
      });

      setShowSettleUpModal(false);
      setSelectedDebt(null);
      
      showToast(`Successfully settled with ${selectedDebt.memberName}!`);
      
    } catch (err) {
      console.error('Settlement failed:', err);
      showToast(err.response?.data?.message || 'Settlement failed');
    } finally {
      setIsSettling(false);
    }
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Screen>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* Header with Actions */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <p className="text-neutral-500 text-xs sm:text-sm">Welcome back,</p>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
              {currentUser?.name || 'User'} 👋
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <Button 
                size="sm" 
                variant="secondary" 
                icon={<Plus size={16} />} 
                onClick={() => {
                  setShowAddExpense(true);
                  ReactGA.event({
                    category: 'Expense',
                    action: 'Opened Add Expense from Dashboard'
                  });
                }}
              >
                Expense
              </Button>
            </div>
            
            <Button 
              size="sm" 
              variant="secondary" 
              icon={<UserPlus size={16} />} 
              onClick={() => {
                setShowCreateGroup(true);
                ReactGA.event({
                  category: 'Group',
                  action: 'Opened Create Group from Dashboard'
                });
              }}
            >
              <span className="hidden sm:inline">Group</span>
            </Button>
            
            {isInstallable && (
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={handleInstallClick}
                title="Install App"
              >
                <Download size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">Install</span>
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Net Balance */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-6 hover:border-neutral-700 transition-all duration-300">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg">
                <Wallet size={16} className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <span className="text-[10px] sm:text-xs text-neutral-500 font-medium">NET</span>
            </div>
            <div>
              {isDataLoading ? (
                <>
                  <div className="h-8 sm:h-10 bg-neutral-800 rounded-lg mb-2 animate-pulse"></div>
                  <div className="h-3 sm:h-4 w-20 bg-neutral-800 rounded animate-pulse"></div>
                </>
              ) : (
                <>
                  <p className={`text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1 ${balance.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {balance.netBalance >= 0 ? '+' : ''}{getCurrencySymbol('INR')}{balance.netBalance.toFixed(0)}
                  </p>
                  <p className="text-neutral-400 text-xs sm:text-sm">Net Balance</p>
                </>
              )}
            </div>
          </div>
          
          {/* You Get */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-6 hover:border-neutral-700 transition-all duration-300">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg">
                <TrendingUp size={16} className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <span className="text-[10px] sm:text-xs text-neutral-500 font-medium">YOU GET</span>
            </div>
            <div>
              {isDataLoading ? (
                <>
                  <div className="h-8 sm:h-10 bg-neutral-800 rounded-lg mb-2 animate-pulse"></div>
                  <div className="h-3 sm:h-4 w-20 bg-neutral-800 rounded animate-pulse"></div>
                </>
              ) : (
                <>
                  <p className="text-xl sm:text-3xl font-bold text-green-400 mb-0.5 sm:mb-1">
                    {getCurrencySymbol('INR')}{balance.totalOwed.toFixed(0)}
                  </p>
                  <p className="text-neutral-400 text-xs sm:text-sm">Total Owed</p>
                </>
              )}
            </div>
          </div>
          
          {/* You Owe */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-6 hover:border-neutral-700 transition-all duration-300">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg">
                <TrendingDown size={16} className="w-4 h-4 sm:w-6 sm:h-6 text-red-400" />
              </div>
              <span className="text-[10px] sm:text-xs text-neutral-500 font-medium">YOU OWE</span>
            </div>
            <div>
              {isDataLoading ? (
                <>
                  <div className="h-8 sm:h-10 bg-neutral-800 rounded-lg mb-2 animate-pulse"></div>
                  <div className="h-3 sm:h-4 w-20 bg-neutral-800 rounded animate-pulse"></div>
                </>
              ) : (
                <>
                  <p className="text-xl sm:text-3xl font-bold text-red-400 mb-0.5 sm:mb-1">
                    {getCurrencySymbol('INR')}{balance.totalOwing.toFixed(0)}
                  </p>
                  <p className="text-neutral-400 text-xs sm:text-sm">Total Owing</p>
                </>
              )}
            </div>
          </div>
          
          {/* This Month */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-6 hover:border-neutral-700 transition-all duration-300">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-orange-500/10 rounded-lg">
                <Calendar size={16} className="w-4 h-4 sm:w-6 sm:h-6 text-orange-400" />
              </div>
              <span className="text-[10px] sm:text-xs text-neutral-500 font-medium">MONTH</span>
            </div>
            <div>
              {isDataLoading ? (
                <>
                  <div className="h-8 sm:h-10 bg-neutral-800 rounded-lg mb-2 animate-pulse"></div>
                  <div className="h-3 sm:h-4 w-20 bg-neutral-800 rounded animate-pulse"></div>
                </>
              ) : (
                <>
                  <p className="text-xl sm:text-3xl font-bold text-neutral-100 mb-0.5 sm:mb-1">
                    {getCurrencySymbol('INR')}{Math.abs(thisMonthTotal).toFixed(0)}
                  </p>
                  <p className="text-neutral-400 text-xs sm:text-sm">Net This Month</p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Groups and Debts */}
        <motion.div variants={itemVariants} className="grid gap-3 lg:grid-cols-2">
          {/* Your Groups */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-neutral-100">Your Groups</h2>
              <Link to="/groups">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  See all
                </Button>
              </Link>
            </div>

            {groups.length === 0 ? (
              <EmptyState
                icon={<Users size={40} />}
                title="No groups yet"
                description="Create a group to start splitting expenses"
                actionLabel="Create Group"
                onAction={() => setShowCreateGroup(true)}
              />
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900">
                {groups.map((group, index) => {
                  const groupId = group._id || group.id;
                  const summary = getGroupSummary(groupId);
                  
                  return (
                    <motion.div
                      key={groupId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link to={`/group/${groupId}`}>
                        <Card variant="interactive" padding="md" className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-700 flex items-center justify-center text-xl flex-shrink-0">
                            {group.emoji}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-neutral-100 truncate text-sm">
                              {group.name}
                            </h3>
                            <p className="text-xs text-neutral-500">
                              {group.members?.length || 0} members
                            </p>
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            {summary.net === 0 ? (
                              <Badge variant="info" size="sm">Settled</Badge>
                            ) : summary.net > 0 ? (
                              <p className="text-sm font-semibold text-green-400">
                                +{getCurrencySymbol('INR')}{summary.youGet.toFixed(2)}
                              </p>
                            ) : (
                              <p className="text-sm font-semibold text-red-400">
                                -{getCurrencySymbol('INR')}{summary.youOwe.toFixed(2)}
                              </p>
                            )}
                          </div>
                          
                          <ChevronRight size={18} className="text-neutral-600 flex-shrink-0" />
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ✅ FIXED: You Owe */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-neutral-100">You Owe</h2>
              <span className="text-xs sm:text-sm text-neutral-500">{allDebts.length} {allDebts.length === 1 ? 'debt' : 'debts'}</span>
            </div>

            {allDebts.length === 0 ? (
              <EmptyState
                icon={<TrendingDown size={40} />}
                title="All settled up!"
                description="You don't owe anyone at the moment"
              />
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900">
                {allDebts.map((debt, index) => (
                  <motion.div
                    key={debt.memberId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      padding="md" 
                      className="border-red-900/30 hover:border-red-800/50 transition-colors cursor-pointer"
                      onClick={() => handleShowGroupBreakdown(debt)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          {debt.member?.profileImage ? (
                            <img
                              src={debt.member.profileImage}
                              alt={debt.memberName}
                              className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-lg">
                                {debt.memberName?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-neutral-100 truncate text-sm sm:text-base">
                              {debt.memberName}
                            </h3>
                          </div>
                          <p className="text-base sm:text-lg font-bold text-red-400 flex-shrink-0">
                            {getCurrencySymbol('INR')}{debt.totalAmount.toFixed(2)}
                          </p>
                        </div>
                        
{/* ✅ Show primary group + count */}
<div className="flex items-center justify-between pt-2 border-t border-neutral-800">
  {debt.primaryGroup && (
    <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-3">
      <span className="text-xs text-neutral-500 truncate">
        {debt.primaryGroup.groupEmoji} {debt.primaryGroup.groupName}
        {debt.additionalGroupsCount > 0 && (
          <span className="text-neutral-600">
            {' '}and {debt.additionalGroupsCount} more {debt.additionalGroupsCount === 1 ? 'group' : 'groups'}
          </span>
        )}
      </span>
    </div>
  )}
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleSettleDebt(debt);
    }}
    className="text-xs sm:text-sm font-medium text-orange-400 hover:text-orange-300 underline transition-colors whitespace-nowrap flex-shrink-0"
  >
    Settle Up
  </button>
</div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ✅ Group Breakdown Modal (Click debt card) */}
      {selectedDebtBreakdown && (
        <Modal
          isOpen={showGroupBreakdownModal}
          onClose={() => {
            setShowGroupBreakdownModal(false);
            setSelectedDebtBreakdown(null);
          }}
          size="md"
          showClose={false}
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Avatar
                  src={selectedDebtBreakdown.member?.profileImage}
                  name={selectedDebtBreakdown.memberName}
                  size="lg"
                />
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
                  {selectedDebtBreakdown.memberName}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowGroupBreakdownModal(false);
                  setSelectedDebtBreakdown(null);
                }}
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                Balances by Group
              </h3>
              <div className="space-y-2">
                {/* ✅ Show ALL groups (not just ones you owe) */}
                {selectedDebtBreakdown.fullGroupBreakdown.map((group) => (
                  <Card 
                    key={group.groupId} 
                    className="p-3 cursor-pointer hover:bg-primary-800/50 transition-colors"
                    onClick={() => navigate(`/group/${group.groupId}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-700 flex items-center justify-center text-xl">
                          {group.groupEmoji}
                        </div>
                        <div>
                          <h4 className="font-semibold text-neutral-100 text-sm">
                            {group.groupName}
                          </h4>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs ${group.balance < 0 ? 'text-red-400' : 'text-green-400'} mb-1`}>
                          {group.balance < 0 ? 'you owe' : 'owes you'}
                        </p>
                        <p className={`text-sm font-bold ${group.balance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {getCurrencySymbol('INR')}{Math.abs(group.balance).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* ✅ Action Button */}
              <div className="space-y-2 pt-4 mt-4 border-t border-neutral-700">
                {selectedDebtBreakdown.netBalance < 0 ? (
                  <Button
                    fullWidth
                    onClick={() => {
                      setSelectedDebt(selectedDebtBreakdown);
                      setShowGroupBreakdownModal(false);
                      setShowSettleUpModal(true);
                    }}
                    className="bg-secondary-600 hover:bg-secondary-700 text-white"
                  >
                    Settle Up {getCurrencySymbol('INR')}{Math.abs(selectedDebtBreakdown.netBalance).toFixed(2)}
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    disabled
                    className="bg-neutral-700 text-neutral-400 cursor-not-allowed"
                  >
                    Remind
                  </Button>
                )}
                <p className="text-xs text-center text-neutral-500">
                  {selectedDebtBreakdown.netBalance < 0
                    ? `Settle all balances with ${selectedDebtBreakdown.memberName}`
                    : `Send a reminder to ${selectedDebtBreakdown.memberName}`
                  }
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ✅ Settle Up Confirmation Modal (EXACT COPY from Friends) */}
      {selectedDebt && (
        <Modal
          isOpen={showSettleUpModal}
          onClose={() => !isSettling && setShowSettleUpModal(false)}
          title="Settle Up"
          description={`Settle all balances with ${selectedDebt.memberName}`}
        >
          <div className="space-y-4">
            {(() => {
              const groupBreakdown = selectedDebt.fullGroupBreakdown;
              const youOweTotal = groupBreakdown.filter(g => g.balance < 0).reduce((sum, g) => sum + Math.abs(g.balance), 0);
              const theyOweTotal = groupBreakdown.filter(g => g.balance > 0).reduce((sum, g) => sum + g.balance, 0);
              const netAmount = youOweTotal - theyOweTotal;
              
              if (groupBreakdown.length === 0) {
                return (
                  <EmptyState
                    title="Nothing to settle"
                    description={`No outstanding balances with ${selectedDebt.memberName}`}
                  />
                );
              }
              
              return (
                <>
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-neutral-400 mb-2">All groups:</h3>
                    {groupBreakdown.map((group) => (
                      <div 
                        key={group.groupId} 
                        className="flex items-center justify-between p-3 bg-primary-800/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary-700 flex items-center justify-center text-lg">
                            {group.groupEmoji}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-100 text-sm">{group.groupName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs ${group.balance < 0 ? 'text-red-400' : 'text-green-400'} mb-1`}>
                            {group.balance < 0 ? 'You owe' : 'Owes you'}
                          </p>
                          <p className={`text-sm font-bold ${group.balance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {getCurrencySymbol('INR')}{Math.abs(group.balance).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-3 border-t border-neutral-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-neutral-100">Net Balance</p>
                      <div className="text-right">
                        <p className={`text-xs ${netAmount > 0 ? 'text-red-400' : netAmount < 0 ? 'text-green-400' : 'text-neutral-400'} mb-1`}>
                          {netAmount > 0 ? 'you owe' : netAmount < 0 ? 'owes you' : 'settled'}
                        </p>
                        <p className={`text-lg font-bold ${netAmount > 0 ? 'text-red-400' : netAmount < 0 ? 'text-green-400' : 'text-neutral-400'}`}>
                          {getCurrencySymbol('INR')}{Math.abs(netAmount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      fullWidth
                      onClick={handleSettleUp}
                      disabled={isSettling}
                      className="bg-secondary-600 hover:bg-secondary-700 text-white"
                    >
                      {isSettling ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Settling...
                        </div>
                      ) : (
                        `Settle All ${getCurrencySymbol('INR')}${Math.abs(netAmount).toFixed(2)}`
                      )}
                    </Button>
                    
                    <p className="text-xs text-center text-neutral-500 mt-2">
                      All group balances will be settled
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </Modal>
      )}

      <AddExpenseModal 
        isOpen={showAddExpense} 
        onClose={() => setShowAddExpense(false)} 
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />

      <InstallInstructionsModal 
        isOpen={showInstructionsModal} 
        onClose={closeInstructionsModal} 
      />

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <Check size={20} />
              <span className="font-medium">{successMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  );
};
