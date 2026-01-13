const mongoose = require('mongoose');

const notificationQueueSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['you_owe', 'settlement_received', 'batched'],
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  sentAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
}, {
  timestamps: true
});

// Index for cleanup
notificationQueueSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for efficient querying
notificationQueueSchema.index({ user: 1, status: 1, scheduledFor: 1 });

module.exports = mongoose.model('NotificationQueue', notificationQueueSchema);
