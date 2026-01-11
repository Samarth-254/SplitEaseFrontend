import { io } from 'socket.io-client';


class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }


  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }


    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    this.socket = io(BACKEND_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });


    this.socket.on('connect', () => {
      
      this.connected = true;
    });


    this.socket.on('disconnect', () => {
      
      this.connected = false;
    });


    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });


    return this.socket;
  }


  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }


  joinUserRoom(userId) {
    if (this.socket?.connected) {
      this.socket.emit('join-user-room', userId);
      
    }
  }


  joinGroup(groupId) {
    if (this.socket?.connected) {
      this.socket.emit('join-group', groupId);
      
    }
  }


  leaveGroup(groupId) {
    if (this.socket?.connected) {
      this.socket.emit('leave-group', groupId);
      
    }
  }


  // Event listeners
  onExpenseCreated(callback) {
    if (this.socket) {
      this.socket.on('expense:created', callback);
    }
  }


  onExpenseDeleted(callback) {
    if (this.socket) {
      this.socket.on('expense:deleted', callback);
    }
  }


  onExpenseUpdated(callback) {
    if (this.socket) {
      this.socket.on('expense:updated', callback);
    }
  }


  onSettlementCreated(callback) {
    if (this.socket) {
      this.socket.on('settlement:created', callback);
    }
  }


  onMemberJoined(callback) {
    if (this.socket) {
      this.socket.on('member-joined', callback);
    }
  }


  onMembersAdded(callback) {
    if (this.socket) {
      this.socket.on('members-added', callback);
    }
  }


  onFriendAddedToGroup(callback) {
    if (this.socket) {
      this.socket.on('friend-added-to-group', callback);
    }
  }

  // ✅ NEW: Listen for notifications
  onNotification(callback) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }


  // Remove listeners
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
      this.socket.off('member-joined', callback);
    }
  }


  offMembersAdded(callback) {
    if (this.socket) {
      this.socket.off('members-added', callback);
    }
  }


  offFriendAddedToGroup(callback) {
    if (this.socket) {
      this.socket.off('friend-added-to-group', callback);
    }
  }

  // ✅ NEW: Remove notification listener
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
