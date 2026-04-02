import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { getChatEligibleUsers } from '../../services/users.service';
import { startOrGetConversation } from '../../services/chat.service';
import { UserProfile, UserConversationRef } from '../../types';

export const ChatsListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { conversations, isInitializing } = useChatStore();
  const { user, profile } = useAuthStore();
  
  const [showNewChat, setShowNewChat] = useState(false);
  const [eligibleUsers, setEligibleUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (showNewChat && user) {
      setLoadingUsers(true);
      getChatEligibleUsers(user.uid)
        .then(setEligibleUsers)
        .catch(console.error)
        .finally(() => setLoadingUsers(false));
    }
  }, [showNewChat, user]);

  const handleStartChat = async (otherUser: UserProfile) => {
    if (!profile) return;
    try {
      const convId = await startOrGetConversation(
        { uid: profile.uid, name: profile.name, role: profile.role },
        { uid: otherUser.uid, name: otherUser.name, role: otherUser.role }
      );
      setShowNewChat(false);
      navigate(`/chats/${convId}`);
    } catch (err) {
      console.error('Failed to start chat', err);
    }
  };

  const formatTime = (ts: number | null) => {
    if (!ts) return '';
    const date = new Date(ts);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-24"
    >
      <MobileHeader 
        title="Chats"
      />

      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent</h2>
          <button
            onClick={() => setShowNewChat(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm font-semibold transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {isInitializing ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-dark-surface rounded-3xl shadow-sm border border-gray-100 dark:border-dark-border">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No conversations yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-[200px] mx-auto">
              Start chatting with other operators to keep the team updated.
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              Start a Chat
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <motion.div
                key={conv.conversationId}
                layout
                onClick={() => navigate(`/chats/${conv.conversationId}`)}
                className="bg-white dark:bg-dark-surface p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex items-center gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-sky-500 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                    {conv.otherUserName.charAt(0).toUpperCase()}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white dark:border-dark-surface rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate pr-2">
                      {conv.otherUserName}
                    </h3>
                    <span className={`text-[11px] whitespace-nowrap ${conv.unreadCount > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-400'}`}>
                      {formatTime(conv.updatedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate pr-4 ${conv.unreadCount > 0 ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {conv.lastMessageSenderId === profile?.uid ? 'You: ' : ''}
                      {conv.lastMessage || 'Started a conversation'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New Chat Modal / Sheet */}
      <AnimatePresence>
        {showNewChat && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewChat(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[70] bg-white dark:bg-dark-surface rounded-t-[32px] p-6 max-h-[80vh] flex flex-col shadow-2xl safe-pb"
            >
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6" />
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">New Chat</h3>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-[300px] mb-4">
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </div>
                ) : eligibleUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No other operators found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eligibleUsers.map((user) => (
                      <button
                        key={user.uid}
                        onClick={() => handleStartChat(user)}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-left group"
                      >
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-lg group-hover:scale-105 transition-transform">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</h4>
                          <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            {user.role}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
