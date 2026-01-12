const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PUBLIC_VAPID_KEY = 'BEZvyoXuIUFqsFx2r8H63keI8HVtW41jhuV3ZenKJf9sDu6BFnbbXJIVjdKsCljSDicofWSfRc69KszxQY14JDI';

class PushNotificationService {
  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    this.checkInterval = null;
  }

  async requestPermission() {
    if (!this.isSupported) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        const success = await this.subscribeUser();
        if (success) {
          localStorage.setItem('notifications-user-disabled', 'false');
          this.startSubscriptionMonitoring();
        }
        return success;
      } else {
        console.log('❌ Notification permission denied');
        return false;
      }
    } catch (err) {
      console.error('❌ Permission request error:', err.message);
      return false;
    }
  }

  async subscribeUser() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('📱 Creating new push subscription...');
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });
        console.log('✅ Push subscription created');
      } else {
        console.log('✅ Push subscription already exists');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No auth token found - user not logged in');
        return false;
      }

      // ✅ FIXED: Send subscription.toJSON() instead of subscription
      const subscriptionData = subscription.toJSON();
      
      console.log('📤 Sending subscription to backend...');
      console.log('   Endpoint:', subscriptionData.endpoint?.substring(0, 60) + '...');
      
      const response = await fetch(`${API_URL}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscriptionData) // ✅ FIXED: Now sends correct format
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to subscribe' }));
        console.error('❌ Backend subscription failed:', error);
        throw new Error(error.message || 'Failed to subscribe');
      }

      const result = await response.json();
      console.log('✅ Successfully subscribed to push notifications:', result);
      return true;
    } catch (err) {
      console.error('❌ Failed to subscribe user:', err.message);
      return false;
    }
  }

  startSubscriptionMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      if (this.isUserDisabled()) {
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (!subscription && this.isPermissionGranted()) {
          console.log('🔄 Subscription lost, resubscribing...');
          const success = await this.subscribeUser();
          if (success) {
            console.log('✅ Resubscribed successfully');
          } else {
            console.log('❌ Resubscribe failed');
          }
        }
      } catch (err) {
        console.error('Subscription health check error:', err);
      }
    }, 5 * 60 * 1000);
  }

  stopSubscriptionMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async unsubscribe() {
    try {
      this.stopSubscriptionMonitoring();
      localStorage.setItem('notifications-user-disabled', 'true');
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        
        const token = localStorage.getItem('token');
        if (token) {
          await fetch(`${API_URL}/api/notifications/unsubscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ endpoint })
          });
        }
        
        console.log('✅ Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (err) {
      console.error('❌ Failed to unsubscribe:', err);
      return false;
    }
  }

  async checkAndResubscribe() {
    if (this.isUserDisabled()) {
      return false;
    }

    if (!this.isPermissionGranted()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('🔄 No subscription found, resubscribing...');
        return await this.subscribeUser();
      }
      
      return true;
    } catch (err) {
      console.error('Check subscription error:', err);
      return false;
    }
  }

  isUserDisabled() {
    return localStorage.getItem('notifications-user-disabled') === 'true';
  }

  isSubscribed() {
    return this.isPermissionGranted() && !this.isUserDisabled();
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  isPermissionGranted() {
    return this.isSupported && Notification.permission === 'granted';
  }

  isPermissionDenied() {
    return this.isSupported && Notification.permission === 'denied';
  }

  isPermissionDefault() {
    return this.isSupported && Notification.permission === 'default';
  }
}

export default new PushNotificationService();
