import { create } from 'zustand';
import apiService from '../services/api';
import socketService from '../services/socket';


export const useStore = create((set, get) => ({
  // Auth State
  currentUser: null,
  isAuthenticated: false,
  
  // NO DATA CACHING - Always fetch fresh from backend
  // Keep only for real-time socket updates
  users: [],
  groups: [],
  expenses: [],
  settlements: [],
  friends: [],
  hasLoadedFriends: false,
  
  // Loading states
  isLoadingGroups: false,
  isLoadingExpenses: false,
  isInitialLoadComplete: false,
  
  // UI State
  activeGroupId: null,
  isAddExpenseOpen: false,
  isSettleUpOpen: false,
  
  // Auth Actions
  initializeAuth: async () => {
    const token = localStorage.getItem('token');
    
    // Listen for unauthorized events from API
    window.addEventListener('unauthorized', () => {
      get().logout();
      window.location.href = '/login';
    });
    
    if (token) {
      try {
        apiService.setToken(token);
        const { user } = await apiService.getMe();
        set({ 
          currentUser: user, 
          isAuthenticated: true,
        });
        // Load initial data to prevent stale data
        await get().loadGroups();
        await get().loadAllExpenses();
        await get().loadAllSettlements();
        get().loadFriends();
        // Mark initial load as complete
        set({ isInitialLoadComplete: true });
        // Initialize socket connection
        get().initializeSocket();
      } catch (err) {
        console.error('Auth initialization failed:', err);
        localStorage.removeItem('token');
        set({ 
          currentUser: null, 
          isAuthenticated: false,
          isInitialLoadComplete: true
        });
      }
    } else {
      set({ isInitialLoadComplete: true });
    }
  },


  setUser: async (user) => {
    // Set user and clear old data
    set({ 
      currentUser: user, 
      isAuthenticated: true,
      users: [],
      groups: [],
      expenses: [],
      settlements: [],
      friends: [],
      hasLoadedFriends: false,
      isLoadingGroups: false,
      isLoadingExpenses: false
    });
    // Initialize socket connection
    get().initializeSocket();
    // Load fresh data after login
    try {
      await get().loadGroups();
      await get().loadAllExpenses();
      await get().loadAllSettlements();
      get().loadFriends();
    } catch (err) {
      console.error('Failed to load data after login:', err);
    }
  },
  
  logout: () => {
    apiService.clearToken();
    // Disconnect socket
    socketService.disconnect();
    set({ 
      isAuthenticated: false, 
      currentUser: null,
      users: [],
      groups: [],
      expenses: [],
      settlements: [],
      friends: [],
      hasLoadedFriends: false,
    });
  },
  
  updateUser: (updatedUser) => {
    set(state => ({
      currentUser: updatedUser,
      users: state.users.map(u => 
        u.id === updatedUser.id ? updatedUser : u
      )
    }));
  },
  
  // Group Actions
  setActiveGroup: (groupId) => set({ activeGroupId: groupId }),
  
  loadGroups: async () => {
    try {
      set({ isLoadingGroups: true });
      const groups = await apiService.getGroups();
      
      set({ groups, isLoadingGroups: false });
      
      // Join socket rooms for all groups
      if (socketService.isConnected()) {
        groups.forEach(group => {
          const groupId = group._id || group.id;
          socketService.joinGroup(groupId);
        });
      }
      
      get().loadFriends();
    } catch (err) {
      console.error('Failed to load groups:', err);
      set({ isLoadingGroups: false });
    }
  },
  
  addGroup: (group) => {
    set(state => {
      // Check if group already exists
      const exists = state.groups.some(g => (g._id || g.id) === (group._id || group.id));
      if (exists) {
        return state;
      }
      
      // Join socket room for new group
      const groupId = group._id || group.id;
      if (socketService.isConnected()) {
        socketService.joinGroup(groupId);
      }
      
      return { 
        groups: [...state.groups, group] 
      };
    });
  },
  
  createGroup: (name, emoji, memberIds) => {
    const { currentUser } = get();
    const newGroup = {
      id: `g${Date.now()}`,
      name,
      emoji,
      members: [currentUser.id, ...memberIds],
      createdAt: new Date().toISOString().split('T')[0],
    };
    set(state => ({ groups: [...state.groups, newGroup] }));
    return newGroup;
  },
  
  // Expense Actions
  addExpense: async (expenseData) => {
    try {
      const { groupId, description, amount, splitBetween, splitType, category, paidBy, splits: providedSplits, currency } = expenseData;
      
      // Convert amount to cents/paise (integer) to avoid floating point errors
      const amountInPaise = Math.round(amount * 100);
      
      let splits = Array.isArray(providedSplits) ? providedSplits : [];


      // If no splits provided, fall back to equal split
      if (splits.length === 0) {
        const numberOfPeople = splitBetween.length;
        const baseAmountPerPerson = Math.floor(amountInPaise / numberOfPeople);
        const remainder = amountInPaise % numberOfPeople;
        splits = splitBetween.map((userId, index) => ({
          user: userId,
          amount: (baseAmountPerPerson + (index < remainder ? 1 : 0)) / 100
        }));
      }


      const expense = await apiService.addExpense(
        groupId,
        description,
        amount,
        splitType || 'equal',
        splits,
        category,
        paidBy,
        currency
      );


      // ONLY socket event will add it to state - prevents duplicates
      // This means creator will see it when socket broadcasts it
      set({ isAddExpenseOpen: false });
      
      // Manually trigger socket handler for immediate display to creator
      const expenseToAdd = expense;
      set(state => {
        const exists = state.expenses.some(e => (e._id || e.id) === (expenseToAdd._id || expenseToAdd.id));
        if (exists) {
          return state;
        }
        return {
          expenses: [...state.expenses, expenseToAdd]
        };
      });
      
      return expense;
    } catch (err) {
      console.error('Failed to add expense:', err);
      throw err;
    }
  },


  updateExpense: async (expenseId, payload) => {
    try {
      const updated = await apiService.updateExpense(expenseId, payload);
      set(state => ({
        expenses: state.expenses.map(e => ((e._id || e.id) === expenseId ? updated : e))
      }));
      return updated;
    } catch (err) {
      console.error('Failed to update expense:', err);
      throw err;
    }
  },


  loadGroupExpenses: async (groupId) => {
    try {
      const expenses = await apiService.getGroupExpenses(groupId);
      set(state => ({
        expenses: [
          ...state.expenses.filter(e => e.groupId !== groupId),
          ...expenses
        ]
      }));
    } catch (err) {
      console.error('Failed to load expenses:', err);
    }
  },


  loadAllExpenses: async () => {
    try {
      const { groups } = get();
      const allExpenses = [];
      
      for (const group of groups) {
        const groupId = group._id || group.id;
        try {
          const expenses = await apiService.getGroupExpenses(groupId);
          allExpenses.push(...expenses);
        } catch (err) {
          console.error(`Failed to load expenses for group ${groupId}:`, err);
        }
      }
      
      set({ expenses: allExpenses });
    } catch (err) {
      console.error('Failed to load all expenses:', err);
    }
  },
  
  deleteExpense: async (expenseId) => {
    try {
      await apiService.deleteExpense(expenseId);
      set(state => ({
        expenses: state.expenses.filter(e => (e._id || e.id) !== expenseId),
      }));
    } catch (err) {
      console.error('Failed to delete expense:', err);
      throw err;
    }
  },


  loadGroupBalances: async (groupId) => {
    try {
      const balances = await apiService.getGroupBalances(groupId);
      return balances;
    } catch (err) {
      console.error('Failed to load balances:', err);
      return [];
    }
  },
  
  // Settlement Actions
  settleUp: async (toUserId, amount, groupId, note) => {
    try {
      const { currentUser } = get();
      const fromUserId = currentUser._id || currentUser.id;
      
      const settlement = await apiService.recordSettlement(groupId, fromUserId, toUserId, amount, note || 'Payment');
      
      set(state => ({ 
        settlements: [...state.settlements, settlement],
        isSettleUpOpen: false,
      }));
      
      await get().loadGroupExpenses(groupId);
      await get().loadGroupSettlements(groupId);
      
      return settlement;
    } catch (err) {
      console.error('Failed to record settlement:', err);
      throw err;
    }
  },


  loadGroupSettlements: async (groupId) => {
    try {
      const settlements = await apiService.getGroupSettlements(groupId);
      set(state => ({
        settlements: [
          ...state.settlements.filter(s => s.groupId !== groupId),
          ...settlements
        ]
      }));
    } catch (err) {
      console.error('Failed to load settlements:', err);
    }
  },


  loadAllSettlements: async () => {
    try {
      const { groups } = get();
      const allSettlements = [];
      
      for (const group of groups) {
        const groupId = group._id || group.id;
        try {
          const settlements = await apiService.getGroupSettlements(groupId);
          allSettlements.push(...settlements);
        } catch (err) {
          console.error(`Failed to load settlements for group ${groupId}:`, err);
        }
      }
      
      set({ settlements: allSettlements });
    } catch (err) {
      console.error('Failed to load all settlements:', err);
    }
  },


  sendReminder: async (groupId, memberId, amount) => {
    try {
      await apiService.sendPaymentReminder(groupId, memberId, amount);
      return true;
    } catch (err) {
      console.error('Failed to send reminder:', err);
      throw err;
    }
  },


  sendCombinedReminder: async (memberId, totalAmount, groupBreakdown) => {
    try {
      await apiService.sendCombinedReminder(memberId, totalAmount, groupBreakdown);
      return true;
    } catch (err) {
      console.error('Failed to send combined reminder:', err);
      throw err;
    }
  },


  // Friends Actions - Computed from group memberships
  loadFriends: () => {
    const { groups, currentUser } = get();
    if (!currentUser) {
      set({ friends: [], hasLoadedFriends: false });
      return [];
    }
    
    const friendsMap = new Map();
    const currentUserId = String(currentUser._id || currentUser.id);
    
    // Collect all unique members from all groups
    groups.forEach(group => {
      if (!group.members || !Array.isArray(group.members)) return;
      
      group.members.forEach(member => {
        if (!member) return;
        
        const memberId = member._id || member.id;
        const memberIdStr = String(memberId);
        
        // Don't add yourself as a friend
        if (memberIdStr !== currentUserId) {
          if (!friendsMap.has(memberIdStr)) {
            friendsMap.set(memberIdStr, {
              _id: member._id || member.id,
              id: member.id || member._id,
              name: member.name,
              email: member.email,
              profileImage: member.profileImage,
              mobile: member.mobile,
              gender: member.gender
            });
          }
        }
      });
    });
    
    const friends = Array.from(friendsMap.values());
    set({ friends, hasLoadedFriends: true });
    return friends;
  },


  refreshFriends: () => {
    // Recompute from current groups
    return get().loadFriends();
  },


  updateProfile: async (data) => {
    try {
      const updatedUser = await apiService.updateProfile(data);
      const { groups, expenses, settlements } = get();
      
      const updatedGroups = groups.map(group => ({
        ...group,
        members: group.members.map(member => 
          (member._id || member.id) === updatedUser._id 
            ? { ...member, ...updatedUser } 
            : member
        ),
        createdBy: (group.createdBy?._id || group.createdBy) === updatedUser._id
          ? { ...group.createdBy, ...updatedUser }
          : group.createdBy
      }));


      const updatedExpenses = expenses.map(expense => ({
        ...expense,
        paidBy: (expense.paidBy?._id || expense.paidBy) === updatedUser._id
          ? { ...expense.paidBy, ...updatedUser }
          : expense.paidBy,
        splits: expense.splits?.map(split => ({
          ...split,
          user: (split.user?._id || split.user) === updatedUser._id
            ? { ...split.user, ...updatedUser }
            : split.user
        }))
      }));


      const updatedSettlements = settlements.map(settlement => ({
        ...settlement,
        from: (settlement.from?._id || settlement.from) === updatedUser._id
          ? { ...settlement.from, ...updatedUser }
          : settlement.from,
        to: (settlement.to?._id || settlement.to) === updatedUser._id
          ? { ...settlement.to, ...updatedUser }
          : settlement.to
      }));


      set({ 
        currentUser: updatedUser,
        groups: updatedGroups,
        expenses: updatedExpenses,
        settlements: updatedSettlements
      });
      return updatedUser;
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  },


  deleteProfileImage: async () => {
    try {
      const { user } = await apiService.deleteProfileImage();
      const { groups, expenses, settlements } = get();
      
      const updatedGroups = groups.map(group => ({
        ...group,
        members: group.members.map(member => 
          (member._id || member.id) === user._id 
            ? { ...member, ...user } 
            : member
        ),
        createdBy: (group.createdBy?._id || group.createdBy) === user._id
          ? { ...group.createdBy, ...user }
          : group.createdBy
      }));


      const updatedExpenses = expenses.map(expense => ({
        ...expense,
        paidBy: (expense.paidBy?._id || expense.paidBy) === user._id
          ? { ...expense.paidBy, ...user }
          : expense.paidBy,
        splits: expense.splits?.map(split => ({
          ...split,
          user: (split.user?._id || split.user) === user._id
            ? { ...split.user, ...user }
            : split.user
        }))
      }));


      const updatedSettlements = settlements.map(settlement => ({
        ...settlement,
        from: (settlement.from?._id || settlement.from) === user._id
          ? { ...settlement.from, ...user }
          : settlement.from,
        to: (settlement.to?._id || settlement.to) === user._id
          ? { ...settlement.to, ...user }
          : settlement.to
      }));


      set({ 
        currentUser: user,
        groups: updatedGroups,
        expenses: updatedExpenses,
        settlements: updatedSettlements
      });
      return user;
    } catch (err) {
      console.error('Failed to delete profile image:', err);
      throw err;
    }
  },
  
  // UI Actions
  toggleAddExpense: (open) => set({ isAddExpenseOpen: open ?? !get().isAddExpenseOpen }),
  toggleSettleUp: (open) => set({ isSettleUpOpen: open ?? !get().isSettleUpOpen }),
  
  // Computed / Getters
  getGroupById: (groupId) => get().groups.find(g => (g._id || g.id) === groupId),
  
  getGroupMembers: (groupId) => {
    const group = get().groups.find(g => (g._id || g.id) === groupId);
    if (!group || !group.members) return [];
    
    // If members are already populated objects (from backend), return them directly
    if (group.members.length > 0 && typeof group.members[0] === 'object' && group.members[0] !== null) {
      return group.members;
    }
    
    // Otherwise, they're IDs, so look them up in users array
    return group.members.map(memberId => get().users.find(u => (u._id || u.id) === memberId)).filter(Boolean);
  },
  
  getGroupExpenses: (groupId) => {
    return get().expenses.filter(e => (e.groupId === groupId || e.groupId === groupId)).sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  },
  
  getGroupSettlements: (groupId) => {
    return get().settlements.filter(s => s.groupId === groupId);
  },
  
  getUserById: (userId) => get().users.find(u => (u._id || u.id) === userId),
  
  // Calculate what current user owes/is owed in a group
  getGroupBalances: (groupId) => {
    const { expenses, settlements, currentUser, groups } = get();
    if (!currentUser) return [];
    
    const group = groups.find(g => (g._id || g.id) === groupId);
    if (!group) return [];
    
    const groupExpenses = expenses.filter(e => e.groupId === groupId);
    const groupSettlements = settlements.filter(s => s.groupId === groupId);
    
    // Use integer arithmetic (paise) throughout to avoid floating point errors
    const balances = {};
    
    groupExpenses.forEach(expense => {
      const splits = expense.splits || [];
      const splitBetween = expense.splitBetween || splits.map(s => s.user);
      const paidById = expense.paidBy?._id || expense.paidBy;
      
      if (splits.length > 0) {
        splits.forEach(split => {
          const userId = split.user?._id || split.user;
          // Convert to paise (integer)
          const splitAmountInPaise = Math.round(split.amount * 100);
          
          if (!balances[userId]) balances[userId] = {};
          
          if (userId !== paidById) {
            if (!balances[userId][paidById]) balances[userId][paidById] = 0;
            balances[userId][paidById] -= splitAmountInPaise;
            
            if (!balances[paidById]) balances[paidById] = {};
            if (!balances[paidById][userId]) balances[paidById][userId] = 0;
            balances[paidById][userId] += splitAmountInPaise;
          }
        });
      } else if (splitBetween && splitBetween.length > 0) {
        // Convert to paise for integer division
        const amountInPaise = Math.round(expense.amount * 100);
        const baseShare = Math.floor(amountInPaise / splitBetween.length);
        const remainder = amountInPaise % splitBetween.length;
        
        splitBetween.forEach((userId, index) => {
          if (!balances[userId]) balances[userId] = {};
          
          if (userId !== paidById) {
            // Distribute remainder to first N people
            const shareInPaise = baseShare + (index < remainder ? 1 : 0);
            
            if (!balances[userId][paidById]) balances[userId][paidById] = 0;
            balances[userId][paidById] -= shareInPaise;
            
            if (!balances[paidById]) balances[paidById] = {};
            if (!balances[paidById][userId]) balances[paidById][userId] = 0;
            balances[paidById][userId] += shareInPaise;
          }
        });
      }
    });
    
    groupSettlements.forEach(settlement => {
      const fromId = settlement.from?._id || settlement.from;
      const toId = settlement.to?._id || settlement.to;
      
      if (!balances[fromId]) balances[fromId] = {};
      if (!balances[toId]) balances[toId] = {};
      
      if (!balances[fromId][toId]) balances[fromId][toId] = 0;
      if (!balances[toId][fromId]) balances[toId][fromId] = 0;
      
      // Convert settlement amount to paise
      const settlementInPaise = Math.round(settlement.amount * 100);
      balances[fromId][toId] += settlementInPaise;
      balances[toId][fromId] -= settlementInPaise;
    });
    
    const result = [];
    const currentUserId = currentUser._id || currentUser.id;
    const currentUserBalances = balances[currentUserId] || {};
    
    const groupMembers = group.members || [];
    
    Object.entries(currentUserBalances).forEach(([userId, amountInPaise]) => {
      // Round very small balances to 0 (less than ₹0.05)
      const amount = amountInPaise / 100;
      const roundedAmount = Math.abs(amount) < 0.05 ? 0 : amount;
      
      // Convert back to rupees and check if significant (more than 0 paise)
      if (Math.abs(roundedAmount) > 0) {
        const user = groupMembers.find(m => {
          const memberId = m._id || m.id || m;
          return memberId === userId;
        });
        
        if (user && typeof user === 'object') {
          result.push({
            user,
            amount: roundedAmount,
            youOwe: roundedAmount < 0,
          });
        } else if (user) {
          const memberObj = groupMembers.find(m => typeof m === 'object' && (m._id === user || m.id === user));
          if (memberObj) {
            result.push({
              user: memberObj,
              amount: roundedAmount,
              youOwe: roundedAmount < 0,
            });
          }
        }
      }
    });
    
    
    return result;
  },
  
  // Get total balance for current user across all groups
  getTotalBalance: () => {
    const { groups, expenses, settlements, currentUser, users } = get();
    if (!currentUser) return { totalOwed: 0, totalOwing: 0, netBalance: 0 };
    
    // Use integer arithmetic (paise) throughout
    let totalOwedInPaise = 0;
    let totalOwingInPaise = 0;
    
    groups.forEach(group => {
      const groupId = group._id || group.id;
      const groupExpenses = expenses.filter(e => e.groupId === groupId);
      const groupSettlements = settlements.filter(s => s.groupId === groupId);
      const balances = {};
      
      groupExpenses.forEach(expense => {
        const splits = expense.splits || [];
        const splitBetween = expense.splitBetween || splits.map(s => s.user);
        const paidById = expense.paidBy?._id || expense.paidBy;
        
        if (splits.length > 0) {
          splits.forEach(split => {
            const userId = split.user?._id || split.user;
            const splitAmountInPaise = Math.round(split.amount * 100);
            
            if (!balances[userId]) balances[userId] = {};
            
            if (userId !== paidById) {
              if (!balances[userId][paidById]) balances[userId][paidById] = 0;
              balances[userId][paidById] -= splitAmountInPaise;
              
              if (!balances[paidById]) balances[paidById] = {};
              if (!balances[paidById][userId]) balances[paidById][userId] = 0;
              balances[paidById][userId] += splitAmountInPaise;
            }
          });
        } else if (splitBetween && splitBetween.length > 0) {
          const amountInPaise = Math.round(expense.amount * 100);
          const baseShare = Math.floor(amountInPaise / splitBetween.length);
          const remainder = amountInPaise % splitBetween.length;
          
          splitBetween.forEach((userId, index) => {
            if (!balances[userId]) balances[userId] = {};
            
            if (userId !== paidById) {
              const shareInPaise = baseShare + (index < remainder ? 1 : 0);
              
              if (!balances[userId][paidById]) balances[userId][paidById] = 0;
              balances[userId][paidById] -= shareInPaise;
              
              if (!balances[paidById]) balances[paidById] = {};
              if (!balances[paidById][userId]) balances[paidById][userId] = 0;
              balances[paidById][userId] += shareInPaise;
            }
          });
        }
      });
      
      groupSettlements.forEach(settlement => {
        const fromId = settlement.from?._id || settlement.from;
        const toId = settlement.to?._id || settlement.to;
        
        if (!balances[fromId]) balances[fromId] = {};
        if (!balances[toId]) balances[toId] = {};
        
        if (!balances[fromId][toId]) balances[fromId][toId] = 0;
        if (!balances[toId][fromId]) balances[toId][fromId] = 0;
        
        const settlementInPaise = Math.round(settlement.amount * 100);
        balances[fromId][toId] += settlementInPaise;
        balances[toId][fromIn] -= settlementInPaise;
      });
      
      const currentUserId = currentUser._id || currentUser.id;
      const currentUserBalances = balances[currentUserId] || {};
      Object.values(currentUserBalances).forEach(amountInPaise => {
        if (amountInPaise > 0) totalOwedInPaise += amountInPaise;
        else totalOwingInPaise += Math.abs(amountInPaise);
      });
    });
    
    const totalOwed = totalOwedInPaise / 100;
    const totalOwing = totalOwingInPaise / 100;
    const netBalance = (totalOwedInPaise - totalOwingInPaise) / 100;
    
    return {
      totalOwed: Math.abs(totalOwed) < 0.05 ? 0 : totalOwed,
      totalOwing: Math.abs(totalOwing) < 0.05 ? 0 : totalOwing,
      netBalance: Math.abs(netBalance) < 0.05 ? 0 : netBalance,
    };
  },
  
  // Get summary for each group
  getGroupSummary: (groupId) => {
    const { expenses, settlements, currentUser } = get();
    if (!currentUser) return { youGet: 0, youOwe: 0, net: 0, expenseCount: 0, totalSpent: 0 };
    
    const groupExpenses = expenses.filter(e => e.groupId === groupId);
    const groupSettlements = settlements.filter(s => s.groupId === groupId);
    
    const balances = {};
    
    groupExpenses.forEach(expense => {
      const splits = expense.splits || [];
      const splitBetween = expense.splitBetween || splits.map(s => s.user);
      const paidById = expense.paidBy?._id || expense.paidBy;
      
      if (splits.length > 0) {
        splits.forEach(split => {
          const userId = split.user?._id || split.user;
          const splitAmountInPaise = Math.round(split.amount * 100);
          
          if (!balances[userId]) balances[userId] = {};
          
          if (userId !== paidById) {
            if (!balances[userId][paidById]) balances[userId][paidById] = 0;
            balances[userId][paidById] -= splitAmountInPaise;
            
            if (!balances[paidById]) balances[paidById] = {};
            if (!balances[paidById][userId]) balances[paidById][userId] = 0;
            balances[paidById][userId] += splitAmountInPaise;
          }
        });
      } else if (splitBetween && splitBetween.length > 0) {
        const amountInPaise = Math.round(expense.amount * 100);
        const baseShare = Math.floor(amountInPaise / splitBetween.length);
        const remainder = amountInPaise % splitBetween.length;
        
        splitBetween.forEach((userId, index) => {
          if (!balances[userId]) balances[userId] = {};
          
          if (userId !== paidById) {
            const shareInPaise = baseShare + (index < remainder ? 1 : 0);
            
            if (!balances[userId][paidById]) balances[userId][paidById] = 0;
            balances[userId][paidById] -= shareInPaise;
            
            if (!balances[paidById]) balances[paidById] = {};
            if (!balances[paidById][userId]) balances[paidById][userId] = 0;
            balances[paidById][userId] += shareInPaise;
          }
        });
      }
    });
    
    groupSettlements.forEach(settlement => {
      const fromId = settlement.from?._id || settlement.from;
      const toId = settlement.to?._id || settlement.to;
      const settlementInPaise = Math.round(settlement.amount * 100);
      
      if (!balances[fromId]) balances[fromId] = {};
      if (!balances[toId]) balances[toId] = {};
      
      if (!balances[fromId][toId]) balances[fromId][toId] = 0;
      if (!balances[toId][fromId]) balances[toId][fromId] = 0;
      
      balances[fromId][toId] += settlementInPaise;
      balances[toId][fromId] -= settlementInPaise;
    });
    
    const currentUserId = currentUser._id || currentUser.id;
    const currentUserBalances = balances[currentUserId] || {};
    
    let youGetInPaise = 0;
    let youOweInPaise = 0;
    
    Object.values(currentUserBalances).forEach(amountInPaise => {
      if (amountInPaise > 0) youGetInPaise += amountInPaise;
      else youOweInPaise += Math.abs(amountInPaise);
    });
    
    const youGet = youGetInPaise / 100;
    const youOwe = youOweInPaise / 100;
    const net = (youGetInPaise - youOweInPaise) / 100;
    
    return {
      youGet: Math.abs(youGet) < 0.05 ? 0 : youGet,
      youOwe: Math.abs(youOwe) < 0.05 ? 0 : youOwe,
      net: Math.abs(net) < 0.05 ? 0 : net,
      expenseCount: groupExpenses.length,
      totalSpent: groupExpenses.reduce((sum, e) => sum + Math.round(e.amount * 100), 0) / 100,
    };
  },


  // ✅ SOCKET ACTIONS - WITH RECONNECT DATA SYNC
  initializeSocket: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found, skipping socket');
      return;
    }


    console.log('🔌 Initializing socket connection...');
    socketService.connect(token);


    const { currentUser, groups } = get();
    
    // Join user room
    if (currentUser?._id) {
      socketService.joinUserRoom(currentUser._id);
    }


    // Join all group rooms
    groups.forEach(group => {
      const groupId = group._id || group.id;
      if (groupId) {
        socketService.joinGroup(groupId);
      }
    });


    // Set up all event listeners
    socketService.onExpenseCreated((expense) => {
      console.log('💰 Expense created event received:', expense);
      set(state => {
        const exists = state.expenses.some(e => (e._id || e.id) === (expense._id || expense.id));
        if (exists) {
          console.log('⚠️ Expense already exists, skipping');
          return state;
        }
        console.log('✅ Adding expense to state');
        return { expenses: [...state.expenses, expense] };
      });
    });


    socketService.onExpenseDeleted(({ expenseId }) => {
      console.log('🗑️ Expense deleted event received:', expenseId);
      set(state => ({
        expenses: state.expenses.filter(e => (e._id || e.id) !== expenseId)
      }));
    });


    socketService.onExpenseUpdated((updatedExpense) => {
      console.log('✏️ Expense updated event received:', updatedExpense);
      set(state => ({
        expenses: state.expenses.map(e => 
          (e._id || e.id) === (updatedExpense._id || updatedExpense.id) ? updatedExpense : e
        )
      }));
    });


    socketService.onSettlementCreated((settlement) => {
      console.log('💸 Settlement created event received:', settlement);
      set(state => {
        const exists = state.settlements.some(s => (s._id || s.id) === (settlement._id || settlement.id));
        if (exists) {
          console.log('⚠️ Settlement already exists, skipping');
          return state;
        }
        console.log('✅ Adding settlement to state');
        return { settlements: [...state.settlements, settlement] };
      });
    });


    socketService.onMemberJoined(({ groupId, userId, user }) => {
      console.log('👤 Member joined event received:', { groupId, userId, user });
      if (!user || !groupId || !userId) {
        console.error('❌ Invalid member joined data');
        return;
      }


      set(state => ({
        groups: state.groups.map(g => {
          if ((g._id || g.id) === groupId) {
            const memberExists = g.members?.some(m => (m._id || m.id) === (user._id || user.id || userId));
            if (!memberExists) {
              console.log('✅ Adding member to group');
              return { ...g, members: [...(g.members || []), user] };
            }
          }
          return g;
        })
      }));
      get().refreshFriends();
    });


    socketService.onMembersAdded(({ groupId, members }) => {
      console.log('👥 Members added event received:', { groupId, members });
      if (!groupId || !Array.isArray(members)) {
        console.error('❌ Invalid members added data');
        return;
      }


      const { currentUser } = get();
      const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
      const isCurrentUserAdded = members.some(m => (m._id || m.id)?.toString() === currentUserId);
      
      if (isCurrentUserAdded) {
        console.log('📥 You were added to group, refreshing groups...');
        get().loadGroups();
      } else {
        set(state => ({
          groups: state.groups.map(g => {
            if ((g._id || g.id) === groupId) {
              const existingIds = (g.members || []).map(m => (m._id || m.id)?.toString());
              const newMembers = members.filter(m => !existingIds.includes((m._id || m.id)?.toString()));
              if (newMembers.length > 0) {
                console.log(`✅ Adding ${newMembers.length} new members to group`);
                return { ...g, members: [...(g.members || []), ...newMembers] };
              }
            }
            return g;
          })
        }));
      }
      get().refreshFriends();
    });


    socketService.onFriendAddedToGroup(({ userId, groupId }) => {
      console.log('🎉 Friend added to group event received');
      const { currentUser } = get();
      if ((currentUser?._id || currentUser?.id)?.toString() === userId?.toString()) {
        console.log('📥 You were added, refreshing groups...');
        get().loadGroups();
      }
    });


    socketService.onNotification((notification) => {
      console.log('🔔 Notification received:', notification);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(notification.title, {
          body: notification.message,
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          tag: notification.type || 'notification',
          requireInteraction: false
        });


        notif.onclick = () => {
          window.focus();
          if (notification.groupId) {
            window.location.href = `/group/${notification.groupId}`;
          }
          notif.close();
        };
      }
    });


    // ✅ NEW: Handle reconnection - sync missed data
    if (socketService.getSocket()) {
      socketService.getSocket().on('reconnect', async (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
        console.log('📥 Syncing missed data...');
        
        try {
          // Reload all data to catch any updates missed during disconnection
          await get().loadAllExpenses();
          await get().loadAllSettlements();
          
          console.log('✅ Data synced successfully after reconnection');
        } catch (err) {
          console.error('❌ Failed to sync data after reconnection:', err);
        }
      });
    }


    console.log('✅ Socket initialization complete');
  },


  joinSocketGroup: (groupId) => {
    socketService.joinGroup(groupId);
  },


  leaveSocketGroup: (groupId) => {
    socketService.leaveGroup(groupId);
  },
}));
