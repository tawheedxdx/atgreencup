import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { subscribeToMessages, sendMessage, markConversationAsSeen, getConversationParticipantInfo } from '../../services/chat.service';
import { subscribeToPresence } from '../../services/presence.service';
import { ChatMessage, PresenceData, ConversationParticipant } from '../../types';

export const ChatConversationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { conversations } = useChatStore();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [otherUserPresence, setOtherUserPresence] = useState<PresenceData | null>(null);
  const [fetchedOtherUser, setFetchedOtherUser] = useState<ConversationParticipant | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fallback to store if available, otherwise fetched info
  const conversationInfo = conversations.find(c => c.conversationId === id);
  const otherUserId = conversationInfo?.otherUserId || fetchedOtherUser?.uid;
  const otherUserName = conversationInfo?.otherUserName || fetchedOtherUser?.name;

  useEffect(() => {
    if (id && profile?.uid && !conversationInfo) {
      getConversationParticipantInfo(id, profile.uid).then(info => {
        if (info) setFetchedOtherUser(info);
      });
    }
  }, [id, profile?.uid, conversationInfo]);

  useEffect(() => {
    if (!id) return;
    
    // Subscribe to messages
    const unsubMessages = subscribeToMessages(id, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubMessages();
  }, [id]);

  useEffect(() => {
    if (!otherUserId) return;
    
    // Subscribe to presence
    const unsubPresence = subscribeToPresence(otherUserId, setOtherUserPresence);

    return () => unsubPresence();
  }, [otherUserId]);

  useEffect(() => {
    // Scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Mark as seen initially and when messages change
    if (id && profile?.uid) {
      markConversationAsSeen(profile.uid, id);
    }
  }, [id, profile?.uid, messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !id || !profile || !otherUserId) return;

    try {
      const textToSend = inputText.trim();
      setInputText(''); // Optimistic clear
      await sendMessage(id, { uid: profile.uid, name: profile.name }, otherUserId, textToSend);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const formatMessageTime = (ts: number | object) => {
    // Sometimes ts might be a firebase serverTimestamp placeholder before sync
    if (!ts || typeof ts === 'object') return 'Sending...';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (ts: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 dark:bg-dark-bg relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-xl border-b border-gray-100 dark:border-dark-border px-4 py-3 pb-safe-top pt-safe-top flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-border rounded-full transition-colors active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {otherUserName?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {otherUserName || 'Chat'}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {otherUserPresence?.online ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Online</span>
                </>
              ) : otherUserPresence?.lastSeen ? (
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
                  Last seen {formatLastSeen(otherUserPresence.lastSeen)}
                </span>
              ) : (
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Offline</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
              Say hello! This is the beginning of your conversation.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === profile?.uid;
            
            // Check if we need a date separator
            const showDate = index === 0 || 
              (typeof msg.timestamp === 'number' && typeof messages[index - 1]?.timestamp === 'number' && 
               new Date(msg.timestamp).toDateString() !== new Date(messages[index - 1].timestamp as number).toDateString());

            return (
              <React.Fragment key={msg.id}>
                {showDate && typeof msg.timestamp === 'number' && (
                  <div className="flex justify-center my-4">
                    <span className="bg-gray-200/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
                      {new Date(msg.timestamp).toDateString() === new Date().toDateString() 
                        ? 'Today' 
                        : new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
                
                <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[80%] rounded-[20px] px-4 py-2.5 shadow-sm relative ${
                      isMe 
                        ? 'bg-emerald-600 text-white rounded-tr-[4px]' 
                        : 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white rounded-tl-[4px] border border-gray-100 dark:border-dark-border'
                    }`}
                  >
                    <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <div className={`flex justify-end items-center gap-1 mt-1 ${isMe ? 'text-emerald-100' : 'text-gray-400'}`}>
                      <span className="text-[10px] font-medium opacity-80">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                      {isMe && (
                        <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {/* Showing double tick for seen logic if we wanted, for now just sent mark */}
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </motion.div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} className="pb-2" />
      </main>

      {/* Input Area */}
      <footer className="bg-white dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border p-3 pb-safe pt-3 relative z-10 shadow-[0_-4px_20px_rgb(0,0,0,0.02)]">
        <form onSubmit={handleSend} className="flex items-end gap-2 max-w-lg mx-auto">
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-transparent focus-within:border-emerald-500/50 focus-within:bg-white dark:focus-within:bg-dark-surface transition-all overflow-hidden flex items-end min-h-[44px]">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message..."
              className="w-full bg-transparent border-none focus:ring-0 text-sm py-3 px-4 resize-none max-h-32 text-gray-900 dark:text-white leading-tight"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              style={{
                height: inputText.split('\n').length > 1 ? `${Math.min(inputText.split('\n').length * 20 + 24, 120)}px` : '44px'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="shrink-0 w-11 h-11 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-white rounded-full flex items-center justify-center transition-all disabled:scale-100 active:scale-95 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 disabled:shadow-none"
          >
            <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
};
