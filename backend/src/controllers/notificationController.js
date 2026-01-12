const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');

// Configure web-push
webpush.setVapidDetails(
  'mailto:samarthnagpal070@gmail.com', // ✅ Keep mailto: prefix for webpush library
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ✅ FIXED: Subscribe endpoint - handles full subscription object
exports.subscribe = async (req, res) => {
  try {
    const subscriptionData = req.body;
    
    console.log('📥 Subscription request received');
    console.log('   User:', req.user._id);
    console.log('   Endpoint:', subscriptionData.endpoint?.substring(0, 60) + '...');
    
    // ✅ Validate subscription data
    if (!subscriptionData.endpoint || !subscriptionData.keys) {
      console.error('❌ Invalid subscription data');
      return res.status(400).json({ message: 'Invalid subscription data' });
    }

    // ✅ Check if this exact endpoint already exists
    const existing = await PushSubscription.findOne({
      user: req.user._id,
      'subscription.endpoint': subscriptionData.endpoint
    });

    if (existing) {
      console.log('✅ Subscription already exists, updating...');
      existing.subscription = subscriptionData;
      existing.updatedAt = new Date();
      await existing.save();
      return res.json({ message: 'Subscription updated', existing: true });
    }

    // ✅ Create new subscription
    const newSub = await PushSubscription.create({
      user: req.user._id,
      subscription: subscriptionData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ New subscription created:', newSub._id);
    
    // Count total subscriptions
    const totalSubs = await PushSubscription.countDocuments({ user: req.user._id });
    console.log(`📊 User now has ${totalSubs} active subscription(s)`);
    
    res.json({ 
      message: 'Subscribed successfully', 
      existing: false,
      subscriptionId: newSub._id 
    });
  } catch (err) {
    console.error('❌ Subscribe error:', err);
    res.status(500).json({ message: 'Failed to subscribe' });
  }
};

// ✅ FIXED: Unsubscribe specific endpoint
exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      // Delete all subscriptions
      await PushSubscription.deleteMany({ user: req.user._id });
      console.log(`🗑️ Deleted all subscriptions for user: ${req.user._id}`);
    } else {
      // Delete specific endpoint
      await PushSubscription.findOneAndDelete({
        user: req.user._id,
        'subscription.endpoint': endpoint
      });
      console.log(`🗑️ Deleted subscription for endpoint`);
    }
    
    res.json({ message: 'Unsubscribed successfully' });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({ message: 'Failed to unsubscribe' });
  }
};

// ✅ FIXED: Send to ALL user's devices
exports.sendNotification = async (userId, title, body, url) => {
  try {
    // ✅ Find ALL subscriptions for this user
    const subscriptions = await PushSubscription.find({ user: userId });
    
    if (subscriptions.length === 0) {
      console.log(`ℹ️ No subscription found for user: ${userId}`);
      return { success: true, sent: 0, failed: 0 };
    }

    console.log(`📱 Sending push to ${subscriptions.length} device(s) for user: ${userId}`);

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      timestamp: new Date().toISOString()
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        sent++;
        console.log(`✅ Push notification sent to user: ${userId} (device ${sent})`);
        
        // Update last used timestamp
        await PushSubscription.findByIdAndUpdate(sub._id, {
          lastUsed: new Date()
        });
      } catch (err) {
        failed++;
        console.error(`❌ Push failed for user ${userId}:`);
        console.error(`   Status: ${err.statusCode}`);
        console.error(`   Message: ${err.message}`);
        
        // Delete invalid subscriptions
        if (err.statusCode === 410 || err.statusCode === 404 || err.statusCode === 400) {
          console.log(`🗑️ Deleted expired subscription for user: ${userId}`);
          await PushSubscription.findByIdAndDelete(sub._id);
        } else if (err.statusCode === 401 || err.statusCode === 403) {
          console.error(`🔥 VAPID AUTH ERROR! Check your VAPID keys!`);
        }
      }
    }

    console.log(`📊 Push result: ${sent} sent, ${failed} failed for user: ${userId}`);
    return { success: sent > 0, sent, failed };
    
  } catch (err) {
    console.error('❌ Send notification error:', err.message);
    return { success: false, sent: 0, failed: 1 };
  }
};

// ✅ FIXED: Bulk notifications
exports.sendBulkNotifications = async (userIds, title, body, url) => {
  try {
    const results = await Promise.allSettled(
      userIds.map(userId => exports.sendNotification(userId, title, body, url))
    );
    
    let totalSent = 0;
    let totalFailed = 0;
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.success) {
        totalSent += result.value.sent;
        totalFailed += result.value.failed;
      }
    });
    
    console.log(`📊 Bulk push: ${totalSent} sent, ${totalFailed} failed to ${userIds.length} users`);
    return { success: true, sent: totalSent, failed: totalFailed };
    
  } catch (err) {
    console.error('❌ Bulk notification error:', err.message);
    return { success: false, sent: 0, failed: userIds.length };
  }
};

// Check subscription endpoint
exports.checkSubscription = async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    const exists = await PushSubscription.findOne({
      user: req.user._id,
      'subscription.endpoint': endpoint
    });
    
    res.json({ exists: !!exists });
  } catch (err) {
    console.error('Check subscription error:', err);
    res.status(500).json({ exists: false });
  }
};

module.exports = exports;
