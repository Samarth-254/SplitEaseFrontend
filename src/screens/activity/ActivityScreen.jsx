import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Calendar, DollarSign } from 'lucide-react';
import { Screen, PageTitle } from '../../components/layout';
import { Card, Avatar, Badge, EmptyState } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { getCategoryIcon } from '../../utils/categoryDetection';
import { getCurrencySymbol } from '../../utils/currency';

/**
 * Activity Screen
 * 
 * Shows recent expense activity across all groups
 * Timeline view of expenses and settlements
 */

export const ActivityScreen = () => {
  const { expenses, settlements, getUserById, getGroupById, currentUser, groups, loadGroups, loadAllExpenses, loadAllSettlements } = useStore();
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Always fetch fresh data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await loadGroups();
        await loadAllExpenses();
        await loadAllSettlements();
      } catch (err) {
        console.error('Failed to load activity data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Screen>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-400">Loading activity...</p>
          </div>
        </div>
      </Screen>
    );
  }

  const activities = useMemo(() => {
    const all = [
      ...expenses.map(e => ({ ...e, type: 'expense' })),
      ...settlements.map(s => ({ ...s, type: 'settlement' })),
    ].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

    if (selectedGroupId === 'all') return all;

    return all.filter((activity) => {
      const gid = activity.groupId?._id || activity.groupId;
      return String(gid) === String(selectedGroupId);
    });
  }, [expenses, settlements, selectedGroupId]);

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

  const formatPreciseDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Group activities by date
  const activitiesByDate = activities.reduce((acc, activity) => {
    const date = formatDate(activity.createdAt || activity.date);
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {});

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <Screen>
      <PageTitle 
        title="Activity" 
        subtitle={`${activities.length} ${activities.length === 1 ? 'activity' : 'activities'}`}
        action={
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500 hidden sm:inline">Filter by</span>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="bg-primary-900 border border-border rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-border-light"
            >
              <option value="all">All groups</option>
              {groups.map((g) => {
                const gid = g._id || g.id;
                return (
                  <option key={gid} value={gid}>
                    {g.emoji} {g.name}
                  </option>
                );
              })}
            </select>
          </div>
        }
      />

      {activities.length === 0 ? (
        <EmptyState
          icon={<Receipt size={48} />}
          title="No activity yet"
          description="Your expense and settlement history will appear here"
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {Object.entries(activitiesByDate).map(([date, dateActivities]) => (
            <div key={date}>
              <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar size={14} />
                {date}
              </h3>
              
              <div className="space-y-2">
                {dateActivities.map((activity, index) => {
                  if (activity.type === 'expense') {
                    const payer = activity.paidBy?._id ? activity.paidBy : getUserById(activity.paidBy);
                    const payerId = activity.paidBy?._id || activity.paidBy;
                    const group = getGroupById(activity.groupId);
                    const currentUserId = currentUser?._id || currentUser?.id;
                    const isCurrentUserPayer = payerId === currentUserId;
                    
                    const splits = activity.splits || [];
                    const splitBetween = activity.splitBetween || splits.map(s => s.user?._id || s.user);
                    
                    let share = 0;
                    let isInvolved = false;
                    
                    if (splits.length > 0) {
                      const userSplit = splits.find(s => (s.user?._id || s.user) === currentUserId);
                      share = userSplit ? userSplit.amount : 0;
                      isInvolved = !!userSplit;
                    } else if (splitBetween.length > 0) {
                      share = activity.amount / splitBetween.length;
                      isInvolved = splitBetween.includes(currentUserId);
                    }
                    
                    const categoryInfo = getCategoryIcon(activity.category);
                    const CategoryIcon = categoryInfo.icon;
                    
                    return (
                      <motion.div key={activity._id || activity.id} variants={itemVariants}>
                        <Card padding="md" className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${categoryInfo.color}`}>
                            <CategoryIcon size={20} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-neutral-100 truncate">
                              {activity.description}
                            </h4>
                            <p className="text-xs text-neutral-500">
                              {payer?.name || 'Unknown'} • {group?.name}
                            </p>
                            <p className="text-xs text-neutral-600 mt-1">
                              {formatTime(activity.createdAt || activity.date)}
                            </p>
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            {isCurrentUserPayer ? (
                              <div>
                                <p className="text-lg font-bold text-green-400">
                                  +{getCurrencySymbol(activity.currency || 'INR')}{(activity.amount - share).toFixed(2)}
                                </p>
                                <p className="text-xs text-neutral-500">you lent</p>
                              </div>
                            ) : isInvolved ? (
                              <div>
                                <p className="text-lg font-bold text-red-400">
                                  -{getCurrencySymbol(activity.currency || 'INR')}{share.toFixed(2)}
                                </p>
                                <p className="text-xs text-neutral-500">you borrowed</p>
                              </div>
                            ) : (
                              <Badge variant="info" size="sm">not involved</Badge>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  }
                  
                  // Settlement activity
                  const from = activity.from?._id ? activity.from : getUserById(activity.from);
                  const to = activity.to?._id ? activity.to : getUserById(activity.to);
                  const group = getGroupById(activity.groupId);
                  const currentUserId = currentUser?._id || currentUser?.id;
                  const isCurrentUserFrom = (activity.from?._id || activity.from) === currentUserId;
                  const isCurrentUserTo = (activity.to?._id || activity.to) === currentUserId;
                  
                  return (
                    <motion.div key={activity._id || activity.id} variants={itemVariants}>
                      <Card padding="md" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <Receipt size={20} className="text-green-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-neutral-100 truncate">
                            {isCurrentUserFrom ? 'You' : from?.name} paid {isCurrentUserTo ? 'you' : to?.name}
                          </h4>
                          <p className="text-xs text-neutral-500">
                            {from?.name || 'Unknown'} • {group?.name}
                          </p>
                          <p className="text-xs text-neutral-600 mt-1">
                            {formatTime(activity.settledAt || activity.createdAt)}
                          </p>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <div>
                            <p className={`text-lg font-bold ${isCurrentUserTo ? 'text-green-400' : 'text-neutral-300'}`}>
                              {getCurrencySymbol(activity.currency || 'INR')}{activity.amount.toFixed(2)}
                            </p>
                            <Badge variant="positive" size="sm">Settled</Badge>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </Screen>
  );
};





