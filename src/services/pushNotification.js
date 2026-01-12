const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEZvyoXuIUFqsFx2r8H63keI8HVtW41jhuV3ZenKJf9sDu6BFnbbXJIVjdKsCljSDicofWSfRc69KszxQY14JDI';

class PushNotificationService {
  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    this.checkInterval = null;
  }

  async initialize() {
    if (!this.isSupported) return;

    // ✅ Only start monitoring, don't subscribe automatically
    if (this.isPermissionGranted() && !this.isUserDisabled()) {
      this.startSubscriptionMonitoring();
    }
  }

  async requestPermission() {
    if (!this.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const success = await this.subscribeUser();
        if (success) {
          localStorage.setItem('notifications-user-disabled', 'false');
          this.startSubscriptionMonitoring();
        }
        return success;
      }
      return false;
    } catch (err) {
      console.error('Permission request error:', err);
      return false;
    }
  }

  async subscribeUser() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      // ✅ Check if we already have a valid subscription in browser
      let existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        // ✅ Verify it exists on backend
        try {
          const checkResponse = await fetch(`${API_URL}/api/notifications/check`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ endpoint: existingSubscription.endpoint })
          });
          
          if (checkResponse.ok) {
            const { exists } = await checkResponse.json();
            if (exists) {
              // ✅ Subscription is valid, don't create new one
              return true;
            }
          }
        } catch (checkErr) {
          console.error('Check subscription error:', checkErr);
        }
        
        // Backend doesn't have it, unsubscribe from browser
        await existingSubscription.unsubscribe();
      }
      
      // ✅ Create new subscription only if needed
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      const subscriptionData = subscription.toJSON();
      
      const response = await fetch(`${API_URL}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to subscribe' }));
        throw new Error(error.message || 'Failed to subscribe');
      }

      return true;
    } catch (err) {
      console.error('Subscribe error:', err);
      return false;
    }
  }

  startSubscriptionMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      if (this.isUserDisabled() || !this.isPermissionGranted()) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        // ✅ Only resubscribe if NO subscription exists in browser
        if (!subscription) {
          await this.subscribeUser();
        }
      } catch (err) {
        console.error('Subscription check error:', err);
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
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Unsubscribe error:', err);
      return false;
    }
  }

  async checkAndResubscribe() {
    if (this.isUserDisabled() || !this.isPermissionGranted()) return false;

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
