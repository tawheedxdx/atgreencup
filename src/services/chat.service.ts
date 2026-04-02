import { ref, get, set, push, update, onValue, serverTimestamp, query, orderByChild } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { ChatMessage, UserConversationRef, ConversationParticipant } from '../types';

export const getConversationId = (uid1: string, uid2: string) => {
  return [uid1, uid2].sort().join('_');
};

export const startOrGetConversation = async (
  currentUser: { uid: string; name: string; role: string },
  otherUser: { uid: string; name: string; role: string }
) => {
  const convId = getConversationId(currentUser.uid, otherUser.uid);
  const convRef = ref(rtdb, `conversations/${convId}`);
  
  const snapshot = await get(convRef);
  if (!snapshot.exists()) {
    // Determine the participants
    const participants: Record<string, boolean> = {
      [currentUser.uid]: true,
      [otherUser.uid]: true,
    };
    
    const participantInfo: Record<string, ConversationParticipant> = {
      [currentUser.uid]: { uid: currentUser.uid, name: currentUser.name, role: currentUser.role },
      [otherUser.uid]: { uid: otherUser.uid, name: otherUser.name, role: otherUser.role },
    };

    // Create conversation
    await set(convRef, {
      id: convId,
      participants,
      participantInfo,
      lastMessage: '',
      lastMessageSenderId: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create userConversations pointers for both users
    const updates: Record<string, any> = {};
    
    // For current user
    updates[`userConversations/${currentUser.uid}/${convId}`] = {
      conversationId: convId,
      otherUserId: otherUser.uid,
      otherUserName: otherUser.name,
      lastMessage: '',
      lastMessageSenderId: '',
      updatedAt: serverTimestamp(),
      unreadCount: 0,
    };

    // For other user
    updates[`userConversations/${otherUser.uid}/${convId}`] = {
      conversationId: convId,
      otherUserId: currentUser.uid,
      otherUserName: currentUser.name,
      lastMessage: '',
      lastMessageSenderId: '',
      updatedAt: serverTimestamp(),
      unreadCount: 0,
    };

    await update(ref(rtdb), updates);
  }
  
  return convId;
};

export const sendMessage = async (
  convId: string,
  currentUser: { uid: string; name: string },
  otherUserId: string,
  text: string
) => {
  if (!text.trim()) return;

  const messagesRef = ref(rtdb, `messages/${convId}`);
  const newMessageRef = push(messagesRef);
  const messageId = newMessageRef.key!;

  const message: Omit<ChatMessage, 'timestamp'> & { timestamp: object } = {
    id: messageId,
    text: text.trim(),
    senderId: currentUser.uid,
    senderName: currentUser.name,
    type: 'text',
    seenBy: {
      [currentUser.uid]: true,
    },
    timestamp: serverTimestamp(),
  };

  const updates: Record<string, any> = {};
  
  // 1. Add message
  updates[`messages/${convId}/${messageId}`] = message;

  // 2. Update conversation metadata
  updates[`conversations/${convId}/lastMessage`] = text.trim();
  updates[`conversations/${convId}/lastMessageSenderId`] = currentUser.uid;
  updates[`conversations/${convId}/updatedAt`] = serverTimestamp();

  // 3. Update both user reference pointers
  // Fetch current unread count for other user
  const otherUserConvRef = ref(rtdb, `userConversations/${otherUserId}/${convId}/unreadCount`);
  const snapshot = await get(otherUserConvRef);
  const currentUnread = snapshot.exists() ? snapshot.val() : 0;

  updates[`userConversations/${currentUser.uid}/${convId}/lastMessage`] = text.trim();
  updates[`userConversations/${currentUser.uid}/${convId}/lastMessageSenderId`] = currentUser.uid;
  updates[`userConversations/${currentUser.uid}/${convId}/updatedAt`] = serverTimestamp();

  updates[`userConversations/${otherUserId}/${convId}/lastMessage`] = text.trim();
  updates[`userConversations/${otherUserId}/${convId}/lastMessageSenderId`] = currentUser.uid;
  updates[`userConversations/${otherUserId}/${convId}/updatedAt`] = serverTimestamp();
  updates[`userConversations/${otherUserId}/${convId}/unreadCount`] = currentUnread + 1;

  await update(ref(rtdb), updates);
};

export const markConversationAsSeen = async (uid: string, convId: string) => {
  // Clear the unread count in userConversations
  await set(ref(rtdb, `userConversations/${uid}/${convId}/unreadCount`), 0);
};

export const subscribeToUserConversations = (
  uid: string,
  callback: (conversations: UserConversationRef[]) => void
) => {
  const userConvsRef = query(ref(rtdb, `userConversations/${uid}`), orderByChild('updatedAt'));
  
  const unsubscribe = onValue(userConvsRef, (snapshot) => {
    const records: UserConversationRef[] = [];
    snapshot.forEach((childNode) => {
      records.push(childNode.val() as UserConversationRef);
    });
    // orderByChild sorts ascending, so we reverse it to get latest on top
    callback(records.reverse());
  });
  
  return unsubscribe;
};

export const subscribeToMessages = (
  convId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const messagesRef = query(ref(rtdb, `messages/${convId}`), orderByChild('timestamp'));
  
  const unsubscribe = onValue(messagesRef, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((childNode) => {
      messages.push(childNode.val() as ChatMessage);
    });
    callback(messages);
  });
  
  return unsubscribe;
};

export const getConversationParticipantInfo = async (convId: string, currentUid: string) => {
  const snapshot = await get(ref(rtdb, `conversations/${convId}/participantInfo`));
  if (snapshot.exists()) {
    const data = snapshot.val() as Record<string, ConversationParticipant>;
    // Find the participant that is not the current user
    const otherUserId = Object.keys(data).find(id => id !== currentUid);
    if (otherUserId) {
      return data[otherUserId];
    }
  }
  return null;
};

