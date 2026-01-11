import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Loader2, Search, X, Check } from 'lucide-react';
import { Screen } from '../../components/layout';
import { Card, Avatar, EmptyState, Input, Modal, Button } from '../../components/ui';
import { useStore } from '../../store/useStore';
import apiService from '../../services/api';
import socketService from '../../services/socket';
import { getCurrencySymbol } from '../../utils/currency';

export const FriendsScreen = () => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showSettleUpModal, setShowSettleUpModal] = useState(false);
  const [showRemindModal, setShowRemindModal] = useState(false);
  const [remindData, setRemindData] = useState(null);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { currentUser, expenses, settlements, groups, friends, hasLoadedFriends, loadFriends, refreshFriends, sendReminder, loadGroups, loadGroupExpenses, loadGroupSettlements, isInitialLoadComplete } = useStore();

  useEffect(() => {
    if (!isInitialLoadComplete || hasLoadedFriends) return;
    setLoading(true);
    loadFriends();
    setLoading(false);
  }, [isInitialLoadComplete, hasLoadedFriends, loadFriends]);

  // Set up socket listeners for real-time updates
  useEffect(() => {
    const handleMembersAdded = () => refreshFriends();
    const handleMemberJoined = () => refreshFriends();
    const handleSettlementCreated = () => refreshFriends();
    const handleExpenseCreated = () => refreshFriends();

    socketService.onMembersAdded(handleMembersAdded);
    socketService.onMemberJoined(handleMemberJoined);
    socketService.onSettlementCreated(handleSettlementCreated);
    socketService.onExpenseCreated(handleExpenseCreated);

    return () => {
      socketService.offMembersAdded(handleMembersAdded);
      socketService.offMemberJoined(handleMemberJoined);
      socketService.offSettlementCreated(handleSettlementCreated);
      socketService.offExpenseCreated(handleExpenseCreated);
    };
  }, []);

  useEffect(() => {
    if (!isInitialLoadComplete) return;
    if (expenses.length > 0 || settlements.length > 0) {
      refreshFriends();
    }
  }, [expenses, settlements, isInitialLoadComplete, refreshFriends]);

  const showToast = (message) => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const calculateFriendBalance = (friendId) => {
    try {
      let youOwe = 0;
      let theyOwe = 0;

      const currentUserId = currentUser?._id || currentUser?.id;
      if (!currentUserId || !friendId) return 0;

      if (Array.isArray(expenses)) {
        expenses.forEach(expense => {
          try {
            if (!expense?.paidBy || !Array.isArray(expense?.splits)) return;
            
            const paidBy = expense.paidBy?._id || expense.paidBy?.id || expense.paidBy;
            if (!paidBy) return;
            
            const paidByStr = String(paidBy);
            const friendIdStr = String(friendId);
            const currentUserIdStr = String(currentUserId);
            
            expense.splits.forEach(split => {
              try {
                if (!split?.user) return;
                
                const splitUserId = split.user?._id || split.user?.id || split.user;
                if (!splitUserId) return;
                
                const splitUserIdStr = String(splitUserId);
                const amount = Number(split.amount) || 0;
                
                if (paidByStr === friendIdStr && splitUserIdStr === currentUserIdStr) {
                  youOwe += amount;
                }
                
                if (paidByStr === currentUserIdStr && splitUserIdStr === friendIdStr) {
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
            const friendIdStr = String(friendId);
            const amount = Number(settlement.amount) || 0;
            
            if (fromIdStr === currentUserIdStr && toIdStr === friendIdStr) {
              youOwe -= amount;
            }
            
            if (fromIdStr === friendIdStr && toIdStr === currentUserIdStr) {
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

  const calculateOverallBalance = () => {
    let totalBalance = 0;
    friends.forEach(friend => {
      totalBalance += calculateFriendBalance(friend._id);
    });
    return totalBalance;
  };

  const getGroupWiseBreakdown = (friendId) => {
    const currentUserId = currentUser?.id || currentUser?._id;
    const groupMap = new Map();
    
    if (!currentUserId || !friendId) return [];
    
    const currentUserIdStr = String(currentUserId);
    const friendIdStr = String(friendId);
    
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
          
          if (paidByStr === friendIdStr && splitUserIdStr === currentUserIdStr) {
            const current = groupMap.get(groupId) || { balance: 0 };
            current.balance -= amount;
            groupMap.set(groupId, current);
          }
          
          if (paidByStr === currentUserIdStr && splitUserIdStr === friendIdStr) {
            const current = groupMap.get(groupId) || { balance: 0 };
            current.balance += amount;
            groupMap.set(groupId, current);
          }
        });
      });
    }
    
    if (Array.isArray(settlements)) {
      settlements.forEach(settlement => {
        if (!settlement?.from || !settlement?.to) return;
        if (!settlement.groupId && !settlement.group) return;
        
        const groupId = String(settlement.groupId || settlement.group?._id || settlement.group?.id || settlement.group);
        const fromId = String(settlement.from?._id || settlement.from?.id || settlement.from);
        const toId = String(settlement.to?._id || settlement.to?.id || settlement.to);
        const amount = Number(settlement.amount) || 0;
        
        if (fromId === currentUserIdStr && toId === friendIdStr) {
          const current = groupMap.get(groupId) || { balance: 0 };
          current.balance -= amount;
          groupMap.set(groupId, current);
        }
        
        if (fromId === friendIdStr && toId === currentUserIdStr) {
          const current = groupMap.get(groupId) || { balance: 0 };
          current.balance += amount;
          groupMap.set(groupId, current);
        }
      });
    }
    
    const result = [];
    groupMap.forEach((data, groupId) => {
      if (Math.abs(data.balance) < 0.01) return;
      
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

  const handleFriendClick = (friend) => {
    setSelectedFriend(friend);
    setShowSettleModal(true);
  };

  const handleSendReminder = (friendId, amount, friendName) => {
    setRemindData({ friendId, amount, friendName });
    setReminderSent(false);
    setShowRemindModal(true);
  };

  const confirmSendReminder = async () => {
    if (!remindData) return;
    
    setIsSendingReminder(true);
    try {
      await sendReminder(null, remindData.friendId, remindData.amount);
      setIsSendingReminder(false);
      setReminderSent(true);
    } catch (err) {
      console.error('Failed to send reminder:', err);
      setIsSendingReminder(false);
      setReminderSent(false);
      showToast('Failed to send reminder');
    }
  };

  const handleSettleUp = async () => {
    if (!selectedFriend) return;

    setIsSettling(true);
    try {
      const groupBreakdown = getGroupWiseBreakdown(selectedFriend._id);
      
      if (groupBreakdown.length === 0) {
        showToast('No balances to settle');
        setIsSettling(false);
        return;
      }

      const friendId = String(selectedFriend._id || selectedFriend.id);
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
      
      refreshFriends();

      setShowSettleUpModal(false);
      setShowSettleModal(false);
      setSelectedFriend(null);
      
      showToast(`Successfully settled with ${selectedFriend.name}!`);
      
    } catch (err) {
      console.error('Settlement failed:', err);
      showToast(err.response?.data?.message || 'Settlement failed');
    } finally {
      setIsSettling(false);
    }
  };

  const closeRemindModal = () => {
    setShowRemindModal(false);
    setRemindData(null);
    setIsSendingReminder(false);
    setReminderSent(false);
  };

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const friendsYouOwe = filteredFriends.filter(friend => calculateFriendBalance(friend._id) < 0);
  const friendsWhoOweYou = filteredFriends.filter(friend => calculateFriendBalance(friend._id) > 0);
  const settledFriends = filteredFriends.filter(friend => calculateFriendBalance(friend._id) === 0);

  const overallBalance = calculateOverallBalance();
  const currencySymbol = getCurrencySymbol();

  if (!isInitialLoadComplete || (loading && !hasLoadedFriends)) {
    return (
      <Screen title="Friends">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-secondary-500 animate-spin" />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="space-y-6">
        {/* Header with Title and Search */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-2xl md:text-3xl font-bold text-neutral-100">Your Friends</h1>
          <div className="w-[160px] sm:w-[180px] md:w-[240px]">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={18} />}
  className="h-12 py-1 text-sm leading-tight"
            />
          </div>
        </div>

        {friends.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title="No friends yet"
            description="Join groups with other users to automatically become friends"
          />
        ) : (
          <>
            {/* Overall Balance */}
            <Card className="p-6 bg-gradient-to-br from-primary-900 to-primary-800 border-primary-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Overall, you {overallBalance >= 0 ? 'are owed' : 'owe'}</p>
                  <h2 className={`text-3xl font-bold ${overallBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {currencySymbol}{Math.abs(overallBalance).toFixed(2)}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary-700 flex items-center justify-center">
                  <Users size={24} className="text-secondary-500" />
                </div>
              </div>
            </Card>

            {/* Friends You Owe */}
            {friendsYouOwe.length > 0 && (
              <div className="space-y-2">
                {friendsYouOwe.map((friend, index) => {
                  const balance = calculateFriendBalance(friend._id);
                  return (
                    <motion.div
                      key={friend._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className="p-4 hover:bg-primary-900/50 transition-colors cursor-pointer"
                        onClick={() => handleFriendClick(friend)}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar
                            src={friend.profileImage}
                            name={friend.name}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-neutral-100 truncate">
                              {friend.name}
                            </h3>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-red-400 mb-1">
                              you owe
                            </p>
                            <p className="text-lg font-bold text-red-400">
                              {currencySymbol}{Math.abs(balance).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Friends Who Owe You */}
            {friendsWhoOweYou.length > 0 && (
              <div className="space-y-2">
                {friendsWhoOweYou.map((friend, index) => {
                  const balance = calculateFriendBalance(friend._id);
                  return (
                    <motion.div
                      key={friend._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (friendsYouOwe.length + index) * 0.05 }}
                    >
                      <Card 
                        className="p-4 hover:bg-primary-900/50 transition-colors cursor-pointer"
                        onClick={() => handleFriendClick(friend)}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar
                            src={friend.profileImage}
                            name={friend.name}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-neutral-100 truncate">
                              {friend.name}
                            </h3>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-green-400 mb-1">
                              owes you
                            </p>
                            <p className="text-lg font-bold text-green-400">
                              {currencySymbol}{Math.abs(balance).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Settled Friends */}
            {settledFriends.length > 0 && (
              <div>
                <h3 className="text-sm text-neutral-500 mb-3">Settled friends</h3>
                <div className="space-y-2">
                  {settledFriends.map((friend, index) => (
                    <motion.div
                      key={friend._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (friendsYouOwe.length + friendsWhoOweYou.length + index) * 0.05 }}
                    >
                      <Card 
                        className="p-4 hover:bg-primary-900/50 transition-colors cursor-pointer opacity-60"
                        onClick={() => handleFriendClick(friend)}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar
                            src={friend.profileImage}
                            name={friend.name}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-neutral-100 truncate">
                              {friend.name}
                            </h3>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-neutral-400">
                              no expenses
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Friend Details Modal */}
      {selectedFriend && (
        <Modal
          isOpen={showSettleModal}
          onClose={() => {
            setShowSettleModal(false);
            setSelectedFriend(null);
          }}
          size="md"
          showClose={false}
        >
          <div className="p-5 sm:p-6">
            {/* Header with Name and Close */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Avatar
                  src={selectedFriend.profileImage}
                  name={selectedFriend.name}
                  size="lg"
                />
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
                  {selectedFriend.name}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowSettleModal(false);
                  setSelectedFriend(null);
                }}
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {(() => {
                const netBalance = calculateFriendBalance(selectedFriend._id);
                
                if (Math.abs(netBalance) < 0.01) {
                  return (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                        <Check size={32} className="text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-100 mb-1">
                        All Settled! 🎉
                      </h3>
                      <p className="text-neutral-400 text-sm">
                        No outstanding balances with {selectedFriend.name}
                      </p>
                    </div>
                  );
                }
                
                const groupBreakdown = getGroupWiseBreakdown(selectedFriend._id);
                
                return (
                  <>
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                      Balances by Group
                    </h3>
                    <div className="space-y-2">
                      {groupBreakdown.map((group) => (
                        <Card 
                          key={group.groupId} 
                          className="p-3 cursor-pointer hover:bg-primary-800/50 transition-colors"
                          onClick={() => {
                            window.location.href = `/group/${group.groupId}`;
                          }}
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
                                {currencySymbol}{Math.abs(group.balance).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Action Button */}
                    <div className="space-y-2 pt-4 mt-4 border-t border-neutral-700">
                      {netBalance < 0 ? (
                        <Button
                          fullWidth
                          onClick={() => setShowSettleUpModal(true)}
                          className="bg-secondary-600 hover:bg-secondary-700 text-white"
                        >
                          Settle Up {currencySymbol}{Math.abs(netBalance).toFixed(2)}
                        </Button>
                      ) : (
                        <Button
                          fullWidth
                          onClick={() => {
                            handleSendReminder(selectedFriend._id, Math.abs(netBalance), selectedFriend.name);
                          }}
                          className="bg-secondary-600 hover:bg-secondary-700 text-white"
                        >
                          Remind
                        </Button>
                      )}
                      <p className="text-xs text-center text-neutral-500">
                        {netBalance < 0
                          ? `Settle all balances with ${selectedFriend.name}`
                          : `Send a reminder to ${selectedFriend.name}`
                        }
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </Modal>
      )}

      {/* Settle Up Confirmation Modal */}
      {selectedFriend && (
        <Modal
          isOpen={showSettleUpModal}
          onClose={() => !isSettling && setShowSettleUpModal(false)}
          title="Settle Up"
          description={`Settle all balances with ${selectedFriend.name}`}
        >
          <div className="space-y-4">
            {(() => {
              const groupBreakdown = getGroupWiseBreakdown(selectedFriend._id);
              const youOweTotal = groupBreakdown.filter(g => g.balance < 0).reduce((sum, g) => sum + Math.abs(g.balance), 0);
              const theyOweTotal = groupBreakdown.filter(g => g.balance > 0).reduce((sum, g) => sum + g.balance, 0);
              const netAmount = youOweTotal - theyOweTotal;
              
              if (groupBreakdown.length === 0) {
                return (
                  <EmptyState
                    title="Nothing to settle"
                    description={`No outstanding balances with ${selectedFriend.name}`}
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
                            {currencySymbol}{Math.abs(group.balance).toFixed(2)}
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
                          {currencySymbol}{Math.abs(netAmount).toFixed(2)}
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
                        `Settle All ${currencySymbol}${Math.abs(netAmount).toFixed(2)}`
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

      {/* Remind Modal */}
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
                  Send a payment reminder to <strong className="text-neutral-100">{remindData.friendName}</strong> for{' '}
                  <strong className="text-green-400">{currencySymbol}{remindData.amount.toFixed(2)}</strong>?
                </p>
                <p className="text-sm text-neutral-500">
                  They will receive an email notification.
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
                    Reminder Sent!
                  </p>
                  <p className="text-neutral-400 text-sm">
                    {remindData.friendName} has been notified
                  </p>
                </div>
                <Button 
                  variant="primary" 
                  onClick={closeRemindModal}
                  fullWidth
                >
                  Done
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>

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
