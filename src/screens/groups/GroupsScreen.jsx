import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ChevronRight, Users, Search } from 'lucide-react';
import { Screen, PageTitle } from '../../components/layout';
import { Button, Card, AvatarGroup, Badge, EmptyState, Input } from '../../components/ui';
import { CreateGroupModal } from '../../components/groups/CreateGroupModal';
import { useStore } from '../../store/useStore';
import { getCurrencySymbol } from '../../utils/currency';

/**
 * Groups List Screen - Complete with Skeleton Loading
 */

// ✅ Skeleton Component
const GroupsSkeletonLoader = () => {
  return (
    <Screen>
      <div className="mb-6">
        <div className="h-8 w-32 bg-neutral-800 rounded-lg animate-pulse mb-2"></div>
        <div className="h-4 w-20 bg-neutral-800 rounded animate-pulse"></div>
      </div>
      
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-neutral-800 animate-pulse flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 bg-neutral-800 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-neutral-800 rounded animate-pulse"></div>
            </div>
            <div className="w-20 h-10 bg-neutral-800 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </Screen>
  );
};

export const GroupsScreen = () => {
  const { 
    groups, 
    getGroupSummary, 
    getGroupMembers, 
    isLoadingGroups,
    isInitialLoadComplete 
  } = useStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN
  const filteredGroups = useMemo(() => {
    return groups.filter(group => 
      group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [groups, searchQuery]);

  // ✅ ANIMATION VARIANTS (Not hooks, but defined before early return)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // ✅ NOW CHECK LOADING STATE - AFTER ALL HOOKS
  const isLoading = !isInitialLoadComplete || isLoadingGroups;
  
  if (isLoading) {
    return <GroupsSkeletonLoader />;
  }

  return (
    <Screen>
      <PageTitle 
        title="Groups" 
        subtitle={`${groups.length} ${groups.length === 1 ? 'group' : 'groups'}`}
        action={
          <Button size="sm" icon={<Plus size={18} />} onClick={() => setShowCreateModal(true)}>
            New Group
          </Button>
        }
      />

      {groups.length > 3 && (
        <div className="mb-4">
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={16} />}
            className="text-xs sm:text-sm"
          />
        </div>
      )}

      {groups.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title="No groups yet"
          description="Create your first group to start splitting expenses with friends and family"
          actionLabel="Create Group"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {filteredGroups.map((group, index) => {
            const groupId = group._id || group.id;
            const summary = getGroupSummary(groupId);
            const members = getGroupMembers(groupId);
            
            return (
              <motion.div key={groupId} variants={itemVariants}>
                <Link to={`/group/${groupId}`}>
                  <Card variant="interactive" className="flex items-center gap-3">
                    {/* Group Emoji */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary-700 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                      {group.emoji}
                    </div>
                    
                    {/* Group Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-100 text-base sm:text-lg truncate">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <AvatarGroup users={members} size="xs" max={3} />
                      </div>
                      <p className="text-xs text-neutral-600 mt-0.5 hidden sm:block">
                        {getCurrencySymbol('INR')}{summary.totalSpent.toFixed(2)} total • {summary.expenseCount} expenses
                      </p>
                    </div>
                    
                    {/* Balance */}
                    <div className="text-right flex-shrink-0">
                      {summary.net === 0 ? (
                        <Badge variant="info" size="sm">Settled</Badge>
                      ) : summary.net > 0 ? (
                        <div>
                          <p className="text-[10px] sm:text-xs text-green-400 mb-0.5">you get</p>
                          <p className="text-sm sm:text-base font-bold text-green-400">
                            +{getCurrencySymbol('INR')}{summary.youGet.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[10px] sm:text-xs text-red-400 mb-0.5">you owe</p>
                          <p className="text-sm sm:text-base font-bold text-red-400">
                            {getCurrencySymbol('INR')}{summary.youOwe.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <ChevronRight size={18} className="text-neutral-600 flex-shrink-0" />
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </Screen>
  );
};
