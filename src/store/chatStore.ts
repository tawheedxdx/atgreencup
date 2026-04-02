import { create } from 'zustand';
import { subscribeToUserConversations } from '../services/chat.service';
import { setupPresence } from '../services/presence.service';
import { UserConversationRef } from '../types';

interface ChatStore {
  conversations: UserConversationRef[];
  totalUnread: number;
  isInitializing: boolean;
  activeUnsub: (() => void) | null;
  presenceUnsub: (() => void) | null;
  initChats: (uid: string) => void;
  clearChats: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  totalUnread: 0,
  isInitializing: false,
  activeUnsub: null,
  presenceUnsub: null,

  initChats: (uid: string) => {
    // Clean up existing listeners
    const state = get();
    if (state.activeUnsub) state.activeUnsub();
    if (state.presenceUnsub) state.presenceUnsub();

    set({ isInitializing: true });

    // 1. Subscribe to conversations to maintain the global unread badge
    const chatUnsub = subscribeToUserConversations(uid, (convs) => {
      const unreadCount = convs.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      set({ 
        conversations: convs, 
        totalUnread: unreadCount,
        isInitializing: false
      });
    });

    // 2. Setup presence system for this user
    const pUnsub = setupPresence(uid);

    set({ activeUnsub: chatUnsub, presenceUnsub: pUnsub });
  },

  clearChats: () => {
    const state = get();
    if (state.activeUnsub) state.activeUnsub();
    if (state.presenceUnsub) state.presenceUnsub();
    
    set({
      conversations: [],
      totalUnread: 0,
      isInitializing: false,
      activeUnsub: null,
      presenceUnsub: null
    });
  }
}));
