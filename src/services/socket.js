import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.userId = null;
    this.joinedGroups = new Set();
  }

  connect(token) {
    if (this.socket?.connected) {
      
      return this.socket;
    }

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    this.socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      
      this.connected = true;
      this.rejoinRooms();
    });

    this.socket.on('disconnect', (reason) => {
      
      this.connected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      
      this.connected = true;
      this.rejoinRooms();
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    return this.socket;
  }

  rejoinRooms() {
    
    
    if (this.userId) {
      this.socket.emit('join-user-room', this.userId);
      
    }
    
    this.joinedGroups.forEach(groupId => {
      this.socket.emit('join-group', groupId);
      
    });
    
    
  }

  disconnect() {
    if (this.socket) {
      
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.userId = null;
      this.joinedGroups.clear();
    }
  }

  joinUserRoom(userId) {
    if (!userId) {
      console.error('❌ Cannot join user room: No user ID provided');
      return;
    }
    
    if (this.socket?.connected) {
      this.userId = userId;
      this.socket.emit('join-user-room', userId);
      
    } else {
      console.warn('⚠️ Cannot join user room - socket not connected yet');
      this.userId = userId; // Store for later rejoin
    }
  }

  joinGroup(groupId) {
    if (!groupId) {
      console.error('❌ Cannot join group: No group ID provided');
      return;
    }
    
    this.joinedGroups.add(groupId);
    
    if (this.socket?.connected) {
      this.socket.emit('join-group', groupId);
      
    } else {
      console.warn('⚠️ Group added to queue, will join when connected:', groupId);
    }
  }

  leaveGroup(groupId) {
    this.joinedGroups.delete(groupId);
    
    if (this.socket?.connected) {
      this.socket.emit('leave-group', groupId);
      
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected()) {
      
      this.socket.emit(event, data);
      return true;
    } else {
      console.warn(`⚠️ Cannot emit ${event} - socket not connected`);
      return false;
    }
  }

  // EXPENSE EVENTS
  onExpenseCreated(callback) {
    if (this.socket) {
      this.socket.off('expense:created');
      this.socket.on('expense:created', (data) => {
        
        callback(data);
      });
      
    }
  }

  onExpenseDeleted(callback) {
    if (this.socket) {
      this.socket.off('expense:deleted');
      this.socket.on('expense:deleted', (data) => {
        
        callback(data);
      });
      
    }
  }

  onExpenseUpdated(callback) {
    if (this.socket) {
      this.socket.off('expense:updated');
      this.socket.on('expense:updated', (data) => {
        
        callback(data);
      });
      
    }
  }

  // SETTLEMENT EVENTS
  onSettlementCreated(callback) {
    if (this.socket) {
      this.socket.off('settlement:created');
      this.socket.on('settlement:created', (data) => {
        
        callback(data);
      });
      
    }
  }

  // MEMBER EVENTS
  onMemberJoined(callback) {
    if (this.socket) {
      this.socket.off('member:joined');
      this.socket.on('member:joined', (data) => {
        
        callback(data);
      });
      
    }
  }

  onMembersAdded(callback) {
    if (this.socket) {
      this.socket.off('members:added');
      this.socket.on('members:added', (data) => {
        
        callback(data);
      });
      
    }
  }

  onFriendAddedToGroup(callback) {
    if (this.socket) {
      this.socket.off('friend:added-to-group');
      this.socket.on('friend:added-to-group', (data) => {
        
        callback(data);
      });
      
    }
  }

  // NOTIFICATION EVENTS
  onNotification(callback) {
    if (this.socket) {
      this.socket.off('notification');
      this.socket.on('notification', (data) => {
        
        callback(data);
      });
      
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
      this.socket.off('member:joined', callback);
    }
  }

  offMembersAdded(callback) {
    if (this.socket) {
      this.socket.off('members:added', callback);
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

const socketService = new SocketService();
export default socketService;
