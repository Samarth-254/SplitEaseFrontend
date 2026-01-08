const Expense = require("../models/Expense");
const Group = require("../models/Group");

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

    const expense = await Expense.create({
      groupId,
      description,
      amount,
      paidBy: paidById,
      createdBy: req.user._id,
      splits: Array.isArray(splits) ? splits : [],
      splitType: splitType || "equal",
      category,
      currency: currency || "INR"
    });

    await expense.populate('paidBy', 'name email profileImage mobile gender');
    await expense.populate('splits.user', 'name email profileImage mobile gender');

    // Emit socket event to all group members
    const io = req.app.get('io');
    if (io) {
      console.log(`Emitting expense:created to group:${groupId}`);
      io.to(`group:${groupId}`).emit('expense:created', expense);
    } else {
      console.log('Socket.io not available');
    }

    res.status(201).json(expense);
  } catch (err) {
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

    const creatorId = expense.createdBy || expense.paidBy;
    if (String(creatorId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the creator can update this expense" });
    }

    if (!description || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const paidById = paidBy || expense.paidBy;
    if (!group.members?.some((m) => String(m) === String(paidById))) {
      return res.status(400).json({ message: "Paid by user must be a group member" });
    }

    expense.description = description;
    expense.amount = amount;
    expense.splitType = splitType || expense.splitType;
    expense.splits = Array.isArray(splits) ? splits : expense.splits;
    expense.category = category;
    expense.paidBy = paidById;
    if (currency) expense.currency = currency;

    await expense.save();

    await expense.populate('paidBy', 'name email profileImage mobile gender');
    await expense.populate('splits.user', 'name email profileImage mobile gender');
    await expense.populate('createdBy', 'name email profileImage mobile gender');

    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
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

    const creatorId = expense.createdBy || expense.paidBy;
    if (String(creatorId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the creator can delete this expense" });
    }

    // Permanent delete from database
    await Expense.findByIdAndDelete(expenseId);

    // Emit socket event to all group members
    const io = req.app.get('io');
    if (io) {
      console.log(`Emitting expense:deleted to group:${expense.groupId}`);
      io.to(`group:${expense.groupId}`).emit('expense:deleted', { expenseId });
    }

    res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ message: err.message || "Server error" });
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
    res.status(500).json({ message: "Server error" });
  }
};
