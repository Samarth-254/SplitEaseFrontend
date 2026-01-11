import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, ChevronRight, Users, Wallet, Calendar, UserPlus, DollarSign } from 'lucide-react';
import { Screen } from '../../components/layout';
import { Button, Card, Badge, EmptyState, Modal } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { AddExpenseModal } from '../expense/AddExpenseModal';
import { CreateGroupModal } from '../../components/groups/CreateGroupModal';
import { getCurrencySymbol } from '../../utils/currency';

export const DashboardScreen = () => {
  const navigate = useNavigate();
  const { 
    groups, 
    expenses, 
    settlements, 
    getTotalBalance, 
    getGroupSummary, 
    getGroupMembers, 
    currentUser, 
    settleUp, 
    getGroupBalances, 
    isInitialLoadComplete 
  } = useStore();
  
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  
  // Show loading state until data is loaded
  const isDataLoading = !isInitialLoadComplete || (groups.length === 0 && expenses.length === 0 && settlements.length === 0);
  
  // ✅ REACTIVE: Recalculate when expenses/settlements change
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

  // ✅ REACTIVE: Recalculate debts when data changes
  const allDebts = useMemo(() => {
    const debts = [];
    groups.forEach(group => {
      const groupId = group._id || group.id;
      const balances = getGroupBalances(groupId);
      
      balances.forEach(balance => {
        if (balance.youOwe) {
          const memberId = balance.user._id || balance.user.id;
          const memberName = balance.user.name;
          
          const memberExpenses = expenses.filter(e => {
            const payerId = e.paidBy?._id || e.paidBy;
            const currentUserId = currentUser?._id || currentUser?.id;
            const splits = e.splits || [];
            
            return e.groupId === groupId && 
                   payerId === memberId && 
                   splits.some(s => (s.user?._id || s.user) === currentUserId);
          });
          
          const oldestExpense = memberExpenses
            .sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date))[0];

          const daysDue = oldestExpense 
            ? Math.floor((new Date() - new Date(oldestExpense.createdAt || oldestExpense.date)) / (1000 * 60 * 60 * 24))
            : 0;

          debts.push({
            groupId,
            groupName: group.name,
            groupEmoji: group.emoji,
            memberId,
            memberName,
            amount: Math.abs(balance.amount),
            daysDue,
            oldestDate: oldestExpense?.createdAt || oldestExpense?.date
          });
        }
      });
    });
    
    return debts.sort((a, b) => {
      if (b.daysDue !== a.daysDue) {
        return b.daysDue - a.daysDue;
      }
      return b.amount - a.amount;
    });
  }, [groups, expenses, settlements, currentUser]);

  const handleSettleDebt = (debt) => {
    setSelectedDebt(debt);
    setShowSettleModal(true);
  };

  const handleSettleUp = async () => {
    if (!selectedDebt) return;
    
    try {
      await settleUp(selectedDebt.memberId, selectedDebt.amount, selectedDebt.groupId, `Settlement from dashboard`);
      setShowSettleModal(false);
      setSelectedDebt(null);
    } catch (err) {
      alert(err.message || 'Failed to settle up');
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
              <Button size="sm" variant="secondary" icon={<Plus size={16} />} onClick={() => setShowAddExpense(true)}>
                Expense
              </Button>
            </div>
            <Button size="sm" variant="secondary" icon={<UserPlus size={16} />} onClick={() => setShowCreateGroup(true)}>
              Group
            </Button>
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

          {/* You Owe (Debts) - ✅ SIMPLIFIED */}
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
                    key={`${debt.groupId}-${debt.memberId}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      padding="md" 
                      className="border-red-900/30 hover:border-red-800/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/group/${debt.groupId}`)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-900/30 flex items-center justify-center flex-shrink-0">
                            <DollarSign size={20} className="text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-neutral-100 truncate text-sm sm:text-base">
                              {debt.memberName}
                            </h3>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {debt.groupEmoji} {debt.groupName}
                            </p>
                          </div>
                          <p className="text-base sm:text-lg font-bold text-red-400 flex-shrink-0">
                            {getCurrencySymbol('INR')}{debt.amount.toFixed(2)}
                          </p>
                        </div>
                        
                        {/* ✅ SIMPLIFIED: No "overdue" badge */}
                        <div className="flex items-center justify-end pt-2 border-t border-neutral-800">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSettleDebt(debt);
                            }}
                            className="text-sm font-medium text-orange-400 hover:text-orange-300 underline transition-colors"
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

      {/* Settle Up Modal */}
      <Modal
        isOpen={showSettleModal}
        onClose={() => {
          setShowSettleModal(false);
          setSelectedDebt(null);
        }}
        title="Settle Up"
      >
        {selectedDebt && (
          <div className="space-y-4">
            <p className="text-neutral-300">
              You are about to settle {getCurrencySymbol('INR')}{selectedDebt.amount.toFixed(2)} with <strong>{selectedDebt.memberName}</strong> in <strong>{selectedDebt.groupEmoji} {selectedDebt.groupName}</strong>
            </p>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowSettleModal(false);
                  setSelectedDebt(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSettleUp}>
                Confirm Settlement
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <AddExpenseModal 
        isOpen={showAddExpense} 
        onClose={() => setShowAddExpense(false)} 
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />
    </Screen>
  );
};
