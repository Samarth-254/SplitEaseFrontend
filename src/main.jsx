import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './responsive.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// ✅ Register Service Worker for PWA and Push Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        
        
        
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch((error) => {
        console.error('[Service Worker] Registration failed:', error);
      });
  });

  // ✅ Handle service worker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    
    window.location.reload();
  });

  // ✅ Resubscribe when tab becomes visible (respects user disable preference)
  let lastVisibilityChange = Date.now();
  
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      // Debounce: only check if more than 30 seconds since last check
      const now = Date.now();
      if (now - lastVisibilityChange < 30000) {
        return;
      }
      lastVisibilityChange = now;

      try {
        // ✅ Check if user has granted permission AND didn't manually disable
        if (Notification.permission === 'granted') {
          // ✅ Check if user manually disabled notifications
          const userDisabled = localStorage.getItem('notifications-user-disabled') === 'true';
          
          if (userDisabled) {
            
            return;
          }

          
          
          // Dynamic import to avoid circular dependency
          const { default: pushService } = await import('./services/pushNotification.js');
          await pushService.checkAndResubscribe();
        }
      } catch (err) {
        console.error('Visibility check error:', err);
      }
    }
  });
} else {
  console.warn('[Service Worker] Not supported in this browser');
}
