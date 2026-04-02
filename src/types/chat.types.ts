export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  type: 'text';
  seenBy: Record<string, boolean>;
}

export interface ConversationParticipant {
  uid: string;
  name: string;
  avatarUrl?: string;
  role: string;
}

export interface ChatConversation {
  id: string;
  participants: Record<string, boolean>;
  participantInfo: Record<string, ConversationParticipant>;
  lastMessage: string;
  lastMessageSenderId: string;
  updatedAt: number;
  createdAt: number;
}

export interface UserConversationRef {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageSenderId: string;
  updatedAt: number;
  unreadCount: number;
}

export interface PresenceData {
  online: boolean;
  lastSeen: number;
}
