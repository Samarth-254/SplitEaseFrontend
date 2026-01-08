const Settlement = require("../models/Settlement");
const Group = require("../models/Group");

exports.recordSettlement = async (req, res) => {
  try {
    const { groupId, to, amount, note } = req.body;

    if (!groupId || !to || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const group = await Group.findById(groupId);
    if (!group || group.isArchived) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(req.user._id) || !group.members.includes(to)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const settlement = await Settlement.create({
      groupId,
      from: req.user._id,
      to,
      amount,
      note
    });

    await settlement.populate('from', 'name email profileImage mobile gender');
    await settlement.populate('to', 'name email profileImage mobile gender');

    // Emit socket event to all group members
    const io = req.app.get('io');
    if (io) {
      console.log(`Emitting settlement:created to group:${groupId}`);
      io.to(`group:${groupId}`).emit('settlement:created', settlement);
    }

    res.status(201).json(settlement);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group || group.isArchived) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const settlements = await Settlement.find({ groupId })
      .populate('from', 'name email profileImage mobile gender')
      .populate('to', 'name email profileImage mobile gender')
      .sort({ settledAt: -1 });

    res.json(settlements);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
