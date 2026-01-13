const emailService = require('./emailService');
const Expense = require('../models/Expense');
const Group = require('../models/Group');

/**
 * Calculate total balance between two users
 */
const calculateBalance = async (userId, paidById, groupId) => {
  const expenses = await Expense.find({
    groupId,
    isDeleted: false
  });

  let balance = 0;

  expenses.forEach(expense => {
    const paidBy = expense.paidBy.toString();

    expense.splits.forEach(split => {
      const splitUserId = split.user.toString();

      if (splitUserId === userId.toString() && paidBy === paidById.toString()) {
        balance += split.amount;
      } else if (splitUserId === paidById.toString() && paidBy === userId.toString()) {
        balance -= split.amount;
      }
    });
  });

  return Math.max(0, balance);
};

/**
 * Send expense notification via email
 */
const notifyWithCooldown = async (userId, expenseData, UserModel) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user || !user.email) {
      console.log(`⚠️ User ${userId} has no email - skipping notification`);
      return;
    }

    const paidBy = expenseData.paidBy;
    const groupId = expenseData.groupId;

    const group = await Group.findById(groupId);
    const groupName = group?.name || 'Group';

    const totalBalance = await calculateBalance(userId, paidBy._id, groupId);

    const notificationData = {
      type: 'you_owe',
      expense: {
        description: expenseData.description,
        amount: expenseData.amount
      },
      paidBy: typeof paidBy === 'object' ? paidBy.name : paidBy,
      yourShare: expenseData.yourShare,
      balance: totalBalance,
      settleLink: `${process.env.FRONTEND_URL || 'https://split-ease.app'}/group/${groupId}`,
      groupName: groupName
    };

    console.log(`📧 EXPENSE: Group "${groupName}" for ${user.email}`); // DEBUG
    await emailService.sendExpenseNotification(user.email, notificationData);
  } catch (error) {
    console.error('❌ Email notify error:', error.message);
  }
};

/**
 * FIXED: Settlement notification - Now fetches groupId from settlement data or expense
 */
const notifySettlement = async (receiverId, payerId, amount, UserModel, ...args) => {
  try {
    const receiver = await UserModel.findById(receiverId);
    const payer = await UserModel.findById(payerId);

    if (!receiver || !receiver.email) {
      console.log(`⚠️ Receiver ${receiverId} has no email - skipping notification`);
      return;
    }

    // BULLETPROOF: Handle all possible calling patterns
    let groupId = null;
    let groupName = 'Your Group';

    // Pattern 1: settlementData object (recommended)
    if (args.length === 1 && typeof args[0] === 'object') {
      groupId = args[0].groupId || args[0].expense?.groupId;
    }
    // Pattern 2: direct groupId string (previous fix)
    else if (args.length === 1 && typeof args[0] === 'string') {
      groupId = args[0];
    }
    // Pattern 3: Multiple args - take last one as groupId
    else if (args.length > 0) {
      groupId = args[args.length - 1];
    }

    console.log(`🔍 Settlement args:`, args, `→ groupId:`, groupId); // DEBUG

    // Fetch group name if we have groupId
    if (groupId) {
      try {
        const group = await Group.findById(groupId).select('name').lean();
        groupName = group?.name || 'Your Group';
      } catch (groupError) {
        console.log(`⚠️ Group fetch failed for ${groupId}`);
      }
    }

    const settleLink = groupId 
      ? `${process.env.FRONTEND_URL || 'https://split-ease.app'}/group/${groupId}`
      : `${process.env.FRONTEND_URL || 'https://split-ease.app'}`;

    const notificationData = {
      type: 'settlement_received',
      paidBy: payer.name,
      amount: amount,
      settleLink,
      groupName
    };

    console.log(`✅ SETTLEMENT: "${groupName}" → ${receiver.email}`);
    await emailService.sendExpenseNotification(receiver.email, notificationData);
  } catch (error) {
    console.error('❌ Settlement email notification error:', error.message);
  }
};


module.exports = {
  notifyWithCooldown,
  notifySettlement
};
