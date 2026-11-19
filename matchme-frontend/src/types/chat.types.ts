/**
 * ✅ FIXED Chat Types
 * All type mismatches resolved
 */

export interface Message {
  id: number;
  chatId: string;
  senderId: number;
  recipientId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
  fileUrl?: string;
  fileType?: string;
}

export interface Chat {
  id: string;
  participants: number[]; // Array of user IDs
  lastMessage: string; // Now a string, not Message object
  updatedAt: string; // ISO timestamp of last activity
  unreadCount: number; // Number of unread messages
}

export interface ChatUser {
  id: number;
  name: string;
  profilePicture: string;
  isOnline: boolean;
  lastSeen?: string;
}

// Socket.io event names (const object instead of enum for erasableSyntaxOnly compatibility)
export const SocketEvents = {
  NEW_MESSAGE: "new_message",
  SEND_MESSAGE: "send_message",
  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline",
  USER_TYPING: "user_typing",
  USER_STOPPED_TYPING: "user_stopped_typing",
} as const;

// DTO for sending messages
export interface SendMessageRequest {
  chatId: string;
  recipientId: number;
  content: string;
  fileUrl?: string;
  fileType?: string;
}
