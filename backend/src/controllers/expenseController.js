const Expense = require("../models/Expense");
const Group = require("../models/Group");
const User = require("../models/User");
const aiCategoryService = require("../services/aiCategoryService");
const { sendBulkNotifications } = require('./notificationController');
const notificationService = require('../services/notificationService');

exports.addExpense = async (req, res) => {
  try {
    const { groupId, description, amount, splitType, splits, category, paidBy, currency } = req.body;

    if (!groupId || !description || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const group = await Group.findById(groupId);
    if (!group || group.isArchived) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members?.some((m) => String(m) === String(req.user._id))) {
      return res.status(403).json({ message: "Not a group member" });
    }

    const paidById = paidBy || req.user._id;
    if (!group.members?.some((m) => String(m) === String(paidById))) {
      return res.status(400).json({ message: "Paid by user must be a group member" });
    }

    const finalCategory = category || await aiCategoryService.detectCategory(description);

    const expense = await Expense.create({
      groupId,
      description,
      amount,
      paidBy: paidById,
      createdBy: req.user._id,
      splits: Array.isArray(splits) ? splits : [],
      splitType: splitType || "equal",
      category: finalCategory,
      currency: currency || "INR"
    });

    await expense.populate('paidBy', 'name email profileImage mobile gender');
    await expense.populate('splits.user', 'name email profileImage mobile gender');

    const expenseObj = expense.toObject();
    if (expenseObj.paidBy) {
      expenseObj.paidBy.profileImage = expenseObj.paidBy.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${expenseObj.paidBy.name.replace(/\s+/g, '')}`;
    }
    if (expenseObj.splits && expenseObj.splits.length > 0) {
      expenseObj.splits = expenseObj.splits.map(split => ({
        ...split,
        user: split.user ? {
          ...split.user,
          profileImage: split.user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${split.user.name.replace(/\s+/g, '')}`
        } : split.user
      }));
    }

    // ✅ Socket events (immediate)
    const io = req.app.get('io');
    if (io) {
      console.log(`Emitting expense:created to group:${groupId}`);
      io.to(`group:${groupId}`).emit('expense:created', expenseObj);
      
      group.members.forEach(memberId => {
        io.to(`user:${memberId}`).emit('expense:created', expenseObj);
      });
    }

    // ✅ Web push notifications (keep as-is, usually fast)
    const memberIds = group.members
      .filter(m => m.toString() !== req.user._id.toString())
      .map(m => m.toString());
    
    if (memberIds.length > 0) {
      sendBulkNotifications(
        memberIds,
        `💸 New expense in ${group.name}`,
        `${req.user.name} added "${expense.description}" - ₹${expense.amount}`,
        `/group/${groupId}`,
        io
      ).catch(console.error); // Fire & forget
    }

    // 🔥 BACKGROUND EMAILS - NON-BLOCKING!
    (async () => {
      try {
        console.log(`📧 [BG] Queuing ${expense.splits.length} email notifications`);
        
        // Only notify people who OWE money
        const emailPromises = expense.splits.map(split => {
          const userId = split.user._id.toString();
          
          // Don't notify the person who paid
          if (userId !== paidById.toString()) {
            const expenseData = {
              description: expense.description,
              amount: expense.amount,
              paidBy: expense.paidBy, // Full user object
              yourShare: split.amount,
              groupId: groupId
            };
            
            return notificationService.notifyWithCooldown(userId, expenseData, User);
          }
          return Promise.resolve();
        });

        const results = await Promise.allSettled(emailPromises);
        const sent = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
        console.log(`📧 [BG] Emails complete: ${sent} sent`);
      } catch (bgError) {
        console.error('❌ [BG] Email batch failed:', bgError.message);
      }
    })();

    // ✅ RETURN RESPONSE IMMEDIATELY (fast!)
    res.status(201).json(expenseObj);

  } catch (err) {
    console.error('Add expense error:', err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { description, amount, splitType, splits, category, paidBy, currency } = req.body;

    const expense = await Expense.findById(expenseId);
    if (!expense || expense.isDeleted) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const group = await Group.findById(expense.groupId);
    if (!group || group.isArchived) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members?.some((m) => String(m) === String(req.user._id))) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!description || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const paidById = paidBy || expense.paidBy;
    if (!group.members?.some((m) => String(m) === String(paidById))) {
      return res.status(400).json({ message: "Paid by user must be a group member" });
    }

    const finalCategory = category || await aiCategoryService.detectCategory(description);

    expense.description = description;
    expense.amount = amount;
    expense.splitType = splitType || expense.splitType;
    expense.splits = Array.isArray(splits) ? splits : expense.splits;
    expense.category = finalCategory;
    expense.paidBy = paidById;
    if (currency) expense.currency = currency;

    await expense.save();

    await expense.populate('paidBy', 'name email profileImage mobile gender');
    await expense.populate('splits.user', 'name email profileImage mobile gender');
    await expense.populate('createdBy', 'name email profileImage mobile gender');

    const io = req.app.get('io');
    if (io) {
      console.log(`Emitting expense:updated to group:${expense.groupId}`);
      io.to(`group:${expense.groupId}`).emit('expense:updated', expense);
      
      group.members.forEach(memberId => {
        io.to(`user:${memberId}`).emit('expense:updated', expense);
      });
    }

    // ✅ Web push for updates (await to ensure delivery before response)
    const memberIds = group.members
      .filter(m => m.toString() !== req.user._id.toString())
      .map(m => m.toString());
    
    if (memberIds.length > 0) {
      await sendBulkNotifications(
        memberIds,
        `✏️ Expense updated in ${group.name}`,
        `${req.user.name} updated "${expense.description}" - ₹${expense.amount}`,
        `/group/${expense.groupId}`,
        io
      );
    }

    // 🔥 BACKGROUND EMAILS - NON-BLOCKING!
    (async () => {
      try {
        console.log(`📧 [BG] Queuing ${expense.splits.length} update emails`);
        
        const emailPromises = expense.splits.map(split => {
          const userId = split.user._id.toString();
          
          if (userId !== paidById.toString()) {
            const expenseData = {
              description: expense.description,
              amount: expense.amount,
              paidBy: expense.paidBy,
              yourShare: split.amount,
              groupId: expense.groupId
            };
            
            return notificationService.notifyWithCooldown(userId, expenseData, User);
          }
          return Promise.resolve();
        });

        const results = await Promise.allSettled(emailPromises);
        const sent = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
        console.log(`📧 [BG] Update emails complete: ${sent} sent`);
      } catch (bgError) {
        console.error('❌ [BG] Update email batch failed:', bgError.message);
      }
    })();

    // ✅ RETURN RESPONSE IMMEDIATELY
    res.json(expense);

  } catch (err) {
    console.error('Update expense error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId);
    if (!expense || expense.isDeleted) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const group = await Group.findById(expense.groupId);
    if (!group || group.isArchived) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members?.some((m) => String(m) === String(req.user._id))) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (String(expense.paidBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the person who paid can delete this expense" });
    }

    await Expense.findByIdAndDelete(expenseId);

    const io = req.app.get('io');
    if (io) {
      console.log(`Emitting expense:deleted to group:${expense.groupId}`);
      io.to(`group:${expense.groupId}`).emit('expense:deleted', { expenseId });
      
      group.members.forEach(memberId => {
        io.to(`user:${memberId}`).emit('expense:deleted', { expenseId });
      });
    }

    res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group || group.isArchived) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members?.some((m) => String(m) === String(req.user._id))) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const expenses = await Expense.find({
      groupId,
      isDeleted: false
    })
      .populate('paidBy', 'name email profileImage mobile gender')
      .populate('splits.user', 'name email profileImage mobile gender')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.calculateBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group || group.isArchived) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members?.some((m) => String(m) === String(req.user._id))) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const expenses = await Expense.find({
      groupId,
      isDeleted: false
    });

    const balances = {};
    group.members.forEach(memberId => {
      balances[memberId.toString()] = {};
    });

    expenses.forEach(expense => {
      const paidById = expense.paidBy.toString();

      expense.splits.forEach(split => {
        const userId = split.user.toString();

        if (userId !== paidById) {
          if (!balances[userId][paidById]) {
            balances[userId][paidById] = 0;
          }
          balances[userId][paidById] += split.amount;

          if (!balances[paidById][userId]) {
            balances[paidById][userId] = 0;
          }
          balances[paidById][userId] -= split.amount;
        }
      });
    });

    const simplifiedBalances = [];
    const processed = new Set();

    Object.keys(balances).forEach(userId => {
      Object.keys(balances[userId]).forEach(otherUserId => {
        const key = [userId, otherUserId].sort().join('-');
        if (!processed.has(key)) {
          processed.add(key);
          const amount = balances[userId][otherUserId];
          if (Math.abs(amount) > 0.01) {
            if (amount < 0) {
              simplifiedBalances.push({
                from: userId,
                to: otherUserId,
                amount: Math.abs(amount)
              });
            } else {
              simplifiedBalances.push({
                from: otherUserId,
                to: userId,
                amount: Math.abs(amount)
              });
            }
          }
        }
      });
    });

    await Group.populate(simplifiedBalances, [
      { path: 'from', select: 'name email avatar' },
      { path: 'to', select: 'name email avatar' }
    ]);

    res.json(simplifiedBalances);
  } catch (err) {
    console.error('Calculate balances error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.detectCategory = async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ message: "Description required" });
    }

    const category = await aiCategoryService.detectCategory(description);
    res.json({ category });
  } catch (err) {
    console.error('Detect category error:', err);
    res.status(500).json({ message: "Server error" });
  }
};
