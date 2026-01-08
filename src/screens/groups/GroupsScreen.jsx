import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ChevronRight, Users } from 'lucide-react';
import { Screen, PageTitle } from '../../components/layout';
import { Button, Card, AvatarGroup, Badge, EmptyState } from '../../components/ui';
import { CreateGroupModal } from '../../components/groups/CreateGroupModal';
import { useStore } from '../../store/useStore';

/**
 * Groups List Screen
 * 
 * UX Decisions:
 * - Card-based list for touch-friendly interaction
 * - Clear balance indicator per group
 * - Floating action button for new group (mobile)
 * - Empty state with clear CTA
 */

export const GroupsScreen = () => {
  const { groups, getGroupSummary, getGroupMembers, loadGroups, expenses, settlements } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

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
          {groups.map((group, index) => {
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
                        <span className="text-xs sm:text-sm text-neutral-500">
                          {members.length} members
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-0.5 hidden sm:block">
                        ₹{summary.totalSpent.toFixed(2)} total • {summary.expenseCount} expenses
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
                            +₹{summary.youGet.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[10px] sm:text-xs text-red-400 mb-0.5">you owe</p>
                          <p className="text-sm sm:text-base font-bold text-red-400">
                            ₹{summary.youOwe.toFixed(2)}
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




