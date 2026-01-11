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
        
        const success = await this.subscribeUser();
        if (success) {
          // ✅ User enabled - mark as opted in
          localStorage.setItem('notifications-user-disabled', 'false');
          this.startSubscriptionMonitoring();
        }
        return success;
      } else {
        
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
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });
        
      } else {
        
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️  No auth token found - user not logged in');
        return false;
      }

      const response = await fetch(`${API_URL}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to subscribe' }));
        throw new Error(error.message || 'Failed to subscribe');
      }

      
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
      // ✅ Don't auto-resubscribe if user manually disabled
      if (this.isUserDisabled()) {
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (!subscription && this.isPermissionGranted()) {
          
          const success = await this.subscribeUser();
          if (success) {
            
          } else {
            
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
      
      // ✅ Mark that user manually disabled
      localStorage.setItem('notifications-user-disabled', 'true');
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        const token = localStorage.getItem('token');
        if (token) {
          await fetch(`${API_URL}/api/notifications/unsubscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        }
        
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('❌ Failed to unsubscribe:', err);
      return false;
    }
  }

  async checkAndResubscribe() {
    // ✅ Don't resubscribe if user manually disabled
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
        
        return await this.subscribeUser();
      }
      
      return true;
    } catch (err) {
      console.error('Check subscription error:', err);
      return false;
    }
  }

  // ✅ Check if user manually disabled notifications
  isUserDisabled() {
    return localStorage.getItem('notifications-user-disabled') === 'true';
  }

  // ✅ Check if subscribed (permission granted AND not manually disabled)
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
