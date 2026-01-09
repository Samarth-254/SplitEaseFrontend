import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Settings, 
  Receipt, 
  Users as UsersIcon, 
  ArrowRight,
  Calendar,
  DollarSign,
  UserPlus,
  Activity as ActivityIcon,
  TrendingUp,
  Bell,
  Check
} from 'lucide-react';
import { Screen, Header } from '../../components/layout';
import { 
  Button, 
  Card, 
  Avatar, 
  Badge, 
  EmptyState,
  Modal 
} from '../../components/ui';
import { AddExpenseModal } from '../expense/AddExpenseModal';
import { InviteMembersModal } from '../../components/groups/InviteMembersModal';
import { useStore } from '../../store/useStore';
import { getCategoryIcon } from '../../utils/categoryDetection';
import { getCurrencySymbol } from '../../utils/currency';

export const GroupDetailScreen = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('expenses');
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRemindModal, setShowRemindModal] = useState(false);
  const [remindData, setRemindData] = useState(null);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    getGroupById, 
    getGroupMembers, 
    getGroupExpenses, 
    getGroupBalances,
    getGroupSummary,
    getGroupSettlements,
    getUserById,
    currentUser,
    settleUp,
    loadGroups,
    loadGroupExpenses,
    loadGroupSettlements,
    sendReminder,
    expenses: allExpenses,
    settlements: allSettlements
  } = useStore();
  
  // Always fetch fresh data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await loadGroups();
        if (groupId) {
          await loadGroupExpenses(groupId);
          await loadGroupSettlements(groupId);
        }
      } catch (err) {
        console.error('Failed to load group data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [groupId]);
  
  const group = getGroupById(groupId);
  const members = getGroupMembers(groupId);
  const expenses = getGroupExpenses(groupId);
  const balances = getGroupBalances(groupId);
  const summary = getGroupSummary(groupId);
    if (isLoading) {
    return (
      <Screen>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-400">Loading group...</p>
          </div>
        </div>
      </Screen>
    );
  }
    if (!group) {
    return (
      <Screen>
        <EmptyState
          title="Group not found"
          description="This group doesn't exist or you don't have access"
          actionLabel="Go back"
          onAction={() => navigate('/groups')}
        />
      </Screen>
    );
  }

  const handleSettleUp = async (toUserId, amount, note) => {
    try {
      await settleUp(toUserId, amount, groupId, note);
      setShowSettleUp(false);
    } catch (err) {
      alert(err.message || 'Failed to record settlement');
    }
  };

  const handleSendReminder = async (memberId, amount, memberName) => {
    setRemindData({ memberId, amount, memberName });
    setReminderSent(false);
    setShowRemindModal(true);
  };

  const confirmSendReminder = async () => {
    if (!remindData) return;
    
    setIsSendingReminder(true);
    try {
      await sendReminder(groupId, remindData.memberId, remindData.amount);
      setIsSendingReminder(false);
      setReminderSent(true);
    } catch (err) {
      console.error('Failed to send reminder:', err);
      setIsSendingReminder(false);
      setReminderSent(false);
    }
  };

  const closeRemindModal = () => {
    setShowRemindModal(false);
    setRemindData(null);
    setIsSendingReminder(false);
    setReminderSent(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Group expenses by date
  const expensesByDate = expenses.reduce((acc, expense) => {
    const date = formatDate(expense.createdAt || expense.date);
    if (!acc[date]) acc[date] = [];
    acc[date].push(expense);
    return acc;
  }, {});

  const tabs = [
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'activity', label: 'Activity', icon: ActivityIcon },
    { id: 'members', label: 'Members', icon: UsersIcon },
  ];

  return (
    <Screen padded={false}>
      <Header 
        title={`${group.emoji} ${group.name}`} 
        showBack 
        rightAction
        rightIcon={<UserPlus size={20} />}
        onRightAction={() => setShowInviteModal(true)}
      />
      
      <div className="px-4 lg:px-8">
        {/* Balance Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-5"
        >
          <Card className="bg-primary-900" padding="lg">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Your balance</p>
                <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {summary.net >= 0 ? '+' : '-'}{getCurrencySymbol('INR')}{Math.round(Math.abs(summary.net) * 100) / 100}
                </p>
              </div>
              <p className="text-sm text-neutral-500">{members.length} members</p>
            </div>
            
            {balances.length === 0 ? (
              <div className="pt-3 border-t border-border">
                <div className="text-center py-6">
                  <p className="text-4xl mb-2">🎉</p>
                  <p className="text-base font-semibold text-green-400 mb-1">You're all settled!</p>
                  <p className="text-sm text-neutral-500">No pending balances in this group</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-3 border-t border-border">
                {balances.map(({ user, amount, youOwe }) => (
                  <div key={user._id || user.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Avatar name={user.name} src={user.profileImage} size="sm" className="hidden sm:flex" />
                      <p className="text-sm text-neutral-300">
                        {youOwe ? (
                          <>
                            You owe <span className="font-semibold text-red-400">{user.name}</span>{' '}
                            <span className={`font-bold text-red-400`}>
                              {getCurrencySymbol('INR')}{Math.round(Math.abs(amount) * 100) / 100}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-green-400">{user.name}</span> owes you{' '}
                            <span className={`font-bold text-green-400`}>
                              {getCurrencySymbol('INR')}{Math.round(Math.abs(amount) * 100) / 100}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-3">
                      {youOwe ? (
                        <button
                          onClick={() => setShowSettleUp(true)}
                          className="text-sm font-medium text-orange-400 hover:text-orange-300 underline transition-colors"
                        >
                          Settle up
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendReminder(user._id || user.id, Math.abs(amount), user.name)}
                          className="text-sm font-medium text-blue-400 hover:text-blue-300 underline transition-colors"
                        >
                          Remind them
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Tabs + Add Button (hidden on mobile) */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap
                  transition-colors duration-200
                  ${activeTab === id 
                    ? 'bg-secondary-500/20 text-secondary-400' 
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-primary-800'
                  }
                `}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          
          <Button 
            className="hidden sm:flex"
            size="sm" 
            icon={<Plus size={16} />}
            onClick={() => setShowAddExpense(true)}
          >
            Add Expense
          </Button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'expenses' && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5 pb-24"
            >
              {expenses.length === 0 ? (
                <EmptyState
                  icon={<Receipt size={40} />}
                  title="No expenses yet"
                  description="Add your first expense to start tracking"
                  action={
                    <Button size="md" icon={<Plus size={18} />} onClick={() => setShowAddExpense(true)}>
                      Add Expense
                    </Button>
                  }
                />
              ) : (
                <>
                  {Object.entries(expensesByDate).map(([date, dateExpenses]) => (
                    <div key={date}>
                      <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">
                        {date}
                      </h3>
                      <div className="space-y-2">
                        {dateExpenses.map((expense) => {
                          const payer = expense.paidBy?._id ? expense.paidBy : getUserById(expense.paidBy);
                          const payerId = expense.paidBy?._id || expense.paidBy;
                          const currentUserId = currentUser?._id || currentUser?.id;
                          const isCurrentUserPayer = payerId === currentUserId;
                          const splitMembers = expense.splits || expense.splitBetween || [];
                          
                          // Calculate current user's share - use actual split amount if available
                          let share = 0;
                          if (expense.splits && Array.isArray(expense.splits)) {
                            const userSplit = expense.splits.find(s => {
                              const splitUserId = s.user?._id || s.user;
                              return String(splitUserId) === String(currentUserId);
                            });
                            share = userSplit?.amount || 0;
                          } else {
                            // Fallback to equal split if no splits array
                            const shareCount = expense.splitBetween?.length || 1;
                            share = expense.amount / shareCount;
                          }
                          
                          const categoryInfo = getCategoryIcon(expense.category);
                          const CategoryIcon = categoryInfo.icon;
                          
                          return (
                            <Card
                              key={expense._id || expense.id}
                              variant="interactive"
                              padding="md"
                              onClick={() => {
                                setExpenseToEdit(expense);
                                setShowEditExpense(true);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${categoryInfo.color}`}>
                                  <CategoryIcon size={20} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-neutral-100 truncate">
                                    {expense.description}
                                  </h4>
                                  <p className="text-sm text-neutral-500">
                                    {payer?.name || 'Unknown'} paid {getCurrencySymbol(expense.currency || 'INR')}{expense.amount.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-neutral-600 mt-1">
                                    {formatTime(expense.createdAt || expense.date)}
                                  </p>
                                </div>
                                
                                <div className="text-right">
                                  {isCurrentUserPayer ? (
                                    <>
                                      <p className="text-base font-semibold text-green-400">
                                        +{getCurrencySymbol(expense.currency || 'INR')}{(expense.amount - share).toFixed(2)}
                                      </p>
                                      <p className="text-xs text-neutral-500">you lent</p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-base font-semibold text-red-400">
                                        -{getCurrencySymbol(expense.currency || 'INR')}{share.toFixed(2)}
                                      </p>
                                      <p className="text-xs text-neutral-500">you borrowed</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pb-24 space-y-4"
            >
              {(() => {
                const groupSettlements = getGroupSettlements(groupId);

                if (groupSettlements.length === 0) {
                  return (
                    <EmptyState
                      icon={<ActivityIcon size={40} />}
                      title="No settlements yet"
                      description="Payment history will appear here when members settle up"
                    />
                  );
                }

                const settlementsByDate = groupSettlements.reduce((acc, settlement) => {
                  const date = formatDate(settlement.settledAt || settlement.createdAt);
                  if (!acc[date]) acc[date] = [];
                  acc[date].push(settlement);
                  return acc;
                }, {});

                return Object.entries(settlementsByDate).map(([date, dateSettlements]) => (
                  <div key={date}>
                    <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Calendar size={14} />
                      {date}
                    </h3>
                    <div className="space-y-2">
                      {dateSettlements.map((settlement) => {
                        const from = settlement.from?._id ? settlement.from : getUserById(settlement.from);
                        const to = settlement.to?._id ? settlement.to : getUserById(settlement.to);
                        const currentUserId = currentUser?._id || currentUser?.id;
                        const isCurrentUserFrom = (settlement.from?._id || settlement.from) === currentUserId;
                        const isCurrentUserTo = (settlement.to?._id || settlement.to) === currentUserId;

                        return (
                          <Card key={settlement._id || settlement.id} padding="md" className="border-green-900/30">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                <TrendingUp size={20} className="text-green-400" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 justify-between">
                                  <h4 className="font-medium text-neutral-100">
                                    {isCurrentUserFrom ? 'You' : from?.name} paid {isCurrentUserTo ? 'you' : to?.name}
                                  </h4>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <p className="text-lg font-bold text-green-400">
                                      ₹{settlement.amount.toFixed(2)}
                                    </p>
                                    <Badge variant="positive" size="sm">Settled</Badge>
                                  </div>
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">
                                  {formatTime(settlement.settledAt || settlement.createdAt)}
                                </p>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </motion.div>
          )}

          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2 pb-24"
            >
              {members.map((member) => {
                const memberId = member._id || member.id;
                const currentUserId = currentUser._id || currentUser.id;
                const memberBalance = balances.find(b => (b.user._id || b.user.id) === memberId);
                const isCurrentUser = memberId === currentUserId;
                
                return (
                  <Card key={memberId} padding="md" className="flex items-center gap-3">
                    <Avatar 
                      name={member.name}
                      src={member.profileImage}
                      size="sm"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-neutral-100 truncate text-sm">
                        {member.name}
                        {isCurrentUser && <span className="text-neutral-500 text-xs ml-1">(you)</span>}
                      </h4>
                    </div>
                    
                    {memberBalance && !isCurrentUser && (
                      <div className="flex items-center">
                        <span className={`text-sm font-semibold w-20 text-right ${memberBalance.youOwe ? 'text-red-400' : 'text-green-400'}`}>
                          {memberBalance.youOwe ? `-₹${Math.abs(memberBalance.amount).toFixed(2)}` : `+₹${memberBalance.amount.toFixed(2)}`}
                        </span>
                        <div className="w-8 flex justify-center">
                          {!memberBalance.youOwe ? (
                            <button 
                              className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                              onClick={() => handleSendReminder(memberId, Math.abs(memberBalance.amount), member.name)}
                            >
                              <Bell size={14} className="text-neutral-400" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settle Up Modal */}
      <Modal
        isOpen={showSettleUp}
        onClose={() => setShowSettleUp(false)}
        title="Settle Up"
        description="Record a payment to settle your balances"
      >
        <div className="space-y-3">
          {balances.filter(b => b.youOwe).map(({ user, amount }) => {
            const userId = user._id || user.id;
            
            return (
              <Card 
                key={userId} 
                variant="interactive" 
                padding="md"
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} src={user.profileImage} size="md" />
                  <div>
                    <p className="font-medium text-neutral-100">{user.name}</p>
                    <p className="text-sm text-neutral-500">
                      You owe ₹{Math.abs(amount).toFixed(2)}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => handleSettleUp(userId, Math.abs(amount))}
                >
                  Settle ₹{Math.abs(amount).toFixed(2)}
                </Button>
              </Card>
            );
          })}
          
          {balances.filter(b => b.youOwe).length === 0 && (
            <EmptyState
              title="Nothing to settle"
              description="You don't owe anyone in this group"
            />
          )}
        </div>
      </Modal>

      {/* Add Expense Modal */}
      <AddExpenseModal 
        isOpen={showAddExpense} 
        onClose={() => setShowAddExpense(false)}
        preSelectedGroupId={groupId}
      />

      {/* Edit Expense Modal */}
      <AddExpenseModal
        isOpen={showEditExpense}
        onClose={() => {
          setShowEditExpense(false);
          setExpenseToEdit(null);
        }}
        preSelectedGroupId={groupId}
        expenseToEdit={expenseToEdit}
      />

      {/* Invite Members Modal */}
      <InviteMembersModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        groupId={groupId}
        groupName={group.name}
      />

      {/* Remind Confirmation Modal */}
      <Modal
        isOpen={showRemindModal}
        onClose={closeRemindModal}
        title={reminderSent ? "Reminder Sent!" : "Send Payment Reminder"}
      >
        {remindData && (
          <div className="space-y-4">
            {!reminderSent ? (
              <>
                <p className="text-neutral-300">
                  Send a payment reminder to <strong className="text-neutral-100">{remindData.memberName}</strong> for{' '}
                  <strong className="text-red-400">₹{remindData.amount.toFixed(2)}</strong>?
                </p>
                <p className="text-sm text-neutral-500">
                  They will receive an email notification about this pending payment.
                </p>
                <div className="flex gap-2 justify-end pt-2">
                  <Button 
                    variant="secondary" 
                    onClick={closeRemindModal}
                    disabled={isSendingReminder}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={confirmSendReminder}
                    disabled={isSendingReminder}
                  >
                    {isSendingReminder ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      'Send Reminder'
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-green-400" />
                  </div>
                  <p className="text-neutral-100 font-medium text-lg mb-2">
                    Reminder Sent Successfully!
                  </p>
                  <p className="text-neutral-400 text-sm">
                    {remindData.memberName} has been notified about the payment of ₹{remindData.amount.toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-center pt-2">
                  <Button 
                    variant="primary" 
                    onClick={closeRemindModal}
                    className="px-8"
                  >
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </Screen>
  );
};





