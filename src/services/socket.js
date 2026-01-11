import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    this.socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('🟢 Socket connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('🔴 Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinUserRoom(userId) {
    if (this.socket?.connected) {
      this.socket.emit('join-user-room', userId);
      console.log('👤 Joined user room:', userId);
    }
  }

  joinGroup(groupId) {
    if (this.socket?.connected) {
      this.socket.emit('join-group', groupId);
      console.log('🏠 Joined group:', groupId);
    }
  }

  leaveGroup(groupId) {
    if (this.socket?.connected) {
      this.socket.emit('leave-group', groupId);
      console.log('🚪 Left group:', groupId);
    }
  }

  // ✅ EXPENSE EVENTS
  onExpenseCreated(callback) {
    if (this.socket) {
      this.socket.off('expense:created'); // Remove old listener first
      this.socket.on('expense:created', (data) => {
        console.log('💰 Expense created:', data);
        callback(data);
      });
    }
  }

  onExpenseDeleted(callback) {
    if (this.socket) {
      this.socket.off('expense:deleted');
      this.socket.on('expense:deleted', (data) => {
        console.log('🗑️ Expense deleted:', data);
        callback(data);
      });
    }
  }

  onExpenseUpdated(callback) {
    if (this.socket) {
      this.socket.off('expense:updated');
      this.socket.on('expense:updated', (data) => {
        console.log('✏️ Expense updated:', data);
        callback(data);
      });
    }
  }

  // ✅ SETTLEMENT EVENTS
  onSettlementCreated(callback) {
    if (this.socket) {
      this.socket.off('settlement:created');
      this.socket.on('settlement:created', (data) => {
        console.log('💸 Settlement created:', data);
        callback(data);
      });
    }
  }

  // ✅ MEMBER EVENTS - FIXED EVENT NAMES
  onMemberJoined(callback) {
    if (this.socket) {
      this.socket.off('member:joined'); // ✅ Changed from 'member-joined'
      this.socket.on('member:joined', (data) => {
        console.log('👤 Member joined:', data);
        callback(data);
      });
    }
  }

  onMembersAdded(callback) {
    if (this.socket) {
      this.socket.off('members:added'); // ✅ Changed from 'members-added'
      this.socket.on('members:added', (data) => {
        console.log('👥 Members added:', data);
        callback(data);
      });
    }
  }

  onFriendAddedToGroup(callback) {
    if (this.socket) {
      this.socket.off('friend:added-to-group');
      this.socket.on('friend:added-to-group', (data) => {
        console.log('🎉 Friend added to group:', data);
        callback(data);
      });
    }
  }

  // ✅ NOTIFICATION EVENTS
  onNotification(callback) {
    if (this.socket) {
      this.socket.off('notification');
      this.socket.on('notification', (data) => {
        console.log('🔔 Notification:', data);
        callback(data);
      });
    }
  }

  // Remove listeners (keeping for cleanup)
  offExpenseCreated(callback) {
    if (this.socket) {
      this.socket.off('expense:created', callback);
    }
  }

  offExpenseDeleted(callback) {
    if (this.socket) {
      this.socket.off('expense:deleted', callback);
    }
  }

  offExpenseUpdated(callback) {
    if (this.socket) {
      this.socket.off('expense:updated', callback);
    }
  }

  offSettlementCreated(callback) {
    if (this.socket) {
      this.socket.off('settlement:created', callback);
    }
  }

  offMemberJoined(callback) {
    if (this.socket) {
      this.socket.off('member:joined', callback); // ✅ Fixed
    }
  }

  offMembersAdded(callback) {
    if (this.socket) {
      this.socket.off('members:added', callback); // ✅ Fixed
    }
  }

  offFriendAddedToGroup(callback) {
    if (this.socket) {
      this.socket.off('friend:added-to-group', callback);
    }
  }

  offNotification(callback) {
    if (this.socket) {
      this.socket.off('notification', callback);
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
