const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Subscribe endpoint
exports.subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    
    await PushSubscription.findOneAndUpdate(
      { user: req.user._id },
      { 
        user: req.user._id,
        subscription: { endpoint, keys }
      },
      { upsert: true, new: true }
    );
    
    res.json({ message: 'Subscribed successfully' });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ message: 'Failed to subscribe' });
  }
};

// Unsubscribe endpoint
exports.unsubscribe = async (req, res) => {
  try {
    await PushSubscription.findOneAndDelete({ user: req.user._id });
    res.json({ message: 'Unsubscribed successfully' });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({ message: 'Failed to unsubscribe' });
  }
};

// Send notification to single user
// Send notification to single user
exports.sendNotification = async (userId, title, body, url) => {
  try {
    const subscription = await PushSubscription.findOne({ user: userId });
    
    if (!subscription) {
      console.log('No subscription found for user:', userId);
      return false;
    }
    
    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      icon: '/icon-192.png',
      badge: '/badge-72.png'
    });
    
    await webpush.sendNotification(subscription.subscription, payload);
    console.log('✅ Push notification sent to user:', userId);
    return true;
  } catch (err) {
    console.error('Send notification error:', err.message);
    
    // If subscription expired/invalid, delete it silently
    if (err.statusCode === 410 || err.statusCode === 404) {
      await PushSubscription.findOneAndDelete({ user: userId });
      console.log('🗑️  Deleted expired subscription for user:', userId);
    }
    
    // ⚠️ DON'T throw error - just return false
    return false;
  }
};

// Send to multiple users
exports.sendBulkNotifications = async (userIds, title, body, url) => {
  const promises = userIds.map(userId => 
    exports.sendNotification(userId, title, body, url)
  );
  const results = await Promise.allSettled(promises);
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - successful;
  
  if (successful > 0) {
    console.log(`✅ Sent ${successful}/${userIds.length} push notifications`);
  }
  if (failed > 0) {
    console.log(`⚠️  ${failed}/${userIds.length} notifications failed (expired subscriptions)`);
  }
  
  return successful;
};


// Send to multiple users
exports.sendBulkNotifications = async (userIds, title, body, url) => {
  const promises = userIds.map(userId => 
    exports.sendNotification(userId, title, body, url)
  );
  const results = await Promise.allSettled(promises);
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  console.log(`Sent ${successful}/${userIds.length} push notifications`);
  
  return successful;
};
// Add this endpoint
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
