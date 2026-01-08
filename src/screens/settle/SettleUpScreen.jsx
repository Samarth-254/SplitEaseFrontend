import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  Check,
  Receipt
} from 'lucide-react';
import { Screen, PageTitle } from '../../components/layout';
import { Button, Card, Avatar, Badge, EmptyState, Modal } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { getCurrencySymbol } from '../../utils/currency';

/**
 * Settle Up Screen
 * 
 * UX Decisions:
 * - Clear separation of "You Owe" vs "You Get" sections
 * - Simple one-tap settle up action
 * - Confirmation before settling
 * - Visual balance indicators
 */

export const SettleUpScreen = () => {
  const navigate = useNavigate();
  const { 
    groups, 
    getGroupBalances, 
    getUserById, 
    settleUp, 
    currentUser,
    getTotalBalance,
    expenses,
    settlements
  } = useStore();
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [loading, setLoading] = useState(false);

  // Aggregate all balances across groups
  const allBalances = [];
  groups.forEach(group => {
    const balances = getGroupBalances(group.id);
    balances.forEach(balance => {
      const existing = allBalances.find(b => b.user.id === balance.user.id);
      if (existing) {
        existing.amount += balance.amount;
        existing.groups.push({ groupId: group.id, groupName: group.name, amount: balance.amount });
      } else {
        allBalances.push({
          ...balance,
          groups: [{ groupId: group.id, groupName: group.name, amount: balance.amount }]
        });
      }
    });
  });

  const youOwe = allBalances.filter(b => b.youOwe);
  const youGet = allBalances.filter(b => !b.youOwe);
  const totalBalance = getTotalBalance();

  const handleSettleClick = (balance, group) => {
    setSelectedSettlement({ balance, group });
    setShowConfirm(true);
  };

  const handleConfirmSettle = async () => {
    if (!selectedSettlement) return;
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { balance, group } = selectedSettlement;
    settleUp(currentUser.id, balance.user.id, Math.abs(balance.amount), group.groupId);
    
    setLoading(false);
    setShowConfirm(false);
    setSelectedSettlement(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Screen>
      <PageTitle 
        title="Settle Up" 
        subtitle="Manage your balances"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Balance Summary */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-primary-800 to-primary-900">
            <div className="text-center mb-4">
              <p className="text-sm text-neutral-400 mb-1">Net Balance</p>
              <p className={`text-3xl font-bold ${totalBalance.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalBalance.netBalance >= 0 ? '+' : '-'}{getCurrencySymbol('INR')}{Math.abs(totalBalance.netBalance).toFixed(2)}
              </p>
            </div>
            
            <div className="flex justify-center gap-8 text-sm">
              <div className="text-center">
                <p className="text-green-400 font-medium">You get</p>
                <p className="text-neutral-300">{getCurrencySymbol('INR')}{totalBalance.totalOwed.toFixed(2)}</p>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <p className="text-red-400 font-medium">You owe</p>
                <p className="text-neutral-300">{getCurrencySymbol('INR')}{totalBalance.totalOwing.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* You Owe Section */}
        {youOwe.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={18} className="text-red-400" />
              <h2 className="text-lg font-semibold text-neutral-100">You Owe</h2>
            </div>
            
            <div className="space-y-3">
              {youOwe.map((balance) => (
                <Card key={balance.user.id} padding="md">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={balance.user.name} size="md" />
                    <div className="flex-1">
                      <h3 className="font-medium text-neutral-100">{balance.user.name}</h3>
                      <p className="text-sm text-red-400">
                        Total: {getCurrencySymbol('INR')}{Math.abs(balance.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pl-12">
                    {balance.groups.map((group) => (
                      <div 
                        key={group.groupId}
                        className="flex items-center justify-between py-2 border-t border-border"
                      >
                        <span className="text-sm text-neutral-400">{group.groupName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-red-400">
                            {getCurrencySymbol('INR')}{Math.abs(group.amount).toFixed(2)}
                          </span>
                          <Button 
                            size="sm" 
                            onClick={() => handleSettleClick(balance, group)}
                          >
                            Pay
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* You Get Section */}
        {youGet.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-green-400" />
              <h2 className="text-lg font-semibold text-neutral-100">You Get</h2>
            </div>
            
            <div className="space-y-3">
              {youGet.map((balance) => (
                <Card key={balance.user.id} padding="md">
                  <div className="flex items-center gap-3">
                    <Avatar name={balance.user.name} size="md" />
                    <div className="flex-1">
                      <h3 className="font-medium text-neutral-100">{balance.user.name}</h3>
                      <p className="text-sm text-neutral-500">
                        {balance.groups.map(g => g.groupName).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">
                        +{getCurrencySymbol('INR')}{balance.amount.toFixed(2)}
                      </p>
                      <Badge variant="info" size="sm">Pending</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {youOwe.length === 0 && youGet.length === 0 && (
          <motion.div variants={itemVariants}>
            <EmptyState
              icon={<Check size={48} />}
              title="All settled up!"
              description="You don't have any pending balances. Add an expense to get started."
              actionLabel="Add Expense"
              onAction={() => navigate('/add-expense')}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Payment"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSettle} loading={loading}>
              Confirm Payment
            </Button>
          </div>
        }
      >
        {selectedSettlement && (
          <div className="text-center py-4">
            <Avatar 
              name={selectedSettlement.balance.user.name} 
              size="xl" 
              className="mx-auto mb-4"
            />
            <p className="text-neutral-300 mb-2">
              Record payment to
            </p>
            <p className="text-xl font-bold text-neutral-100 mb-4">
              {selectedSettlement.balance.user.name}
            </p>
            <p className="text-3xl font-bold text-secondary-500">
              {getCurrencySymbol('INR')}{Math.abs(selectedSettlement.group.amount).toFixed(2)}
            </p>
            <p className="text-sm text-neutral-500 mt-2">
              for {selectedSettlement.group.groupName}
            </p>
          </div>
        )}
      </Modal>
    </Screen>
  );
};





