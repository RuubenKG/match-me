import axiosInstance from "../api/axios";
import type { Message, Chat, ChatUser } from "../types/chat.types";

class ChatService {
  private readonly API_URL = "/api/chat";


  async getChats(): Promise<Chat[]> {
    try {
      const response = await axiosInstance.get(`${this.API_URL}/list`);

      return response.data.map((chat: any) => ({
        id: chat.chatId,
        participants: chat.participants,
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt,
        unreadCount: chat.unreadCount || 0,
      }));
    } catch (error) {
      console.error("Error loading chats:", error);
      return [];
    }
  }


  async getMessages(
    chatId: string,
    page: number = 0,
    size: number = 20
  ): Promise<Message[]> {
    try {
      const response = await axiosInstance.get(
        `${this.API_URL}/messages/${chatId}`,
        {
          params: { page, size },
        }
      );

      return response.data.map((msg: any) => ({
        id: msg.id,
        chatId: msg.chatId,
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        content: msg.content,
        timestamp: msg.timestamp,
        isRead: msg.isRead,
        fileUrl: msg.fileUrl,
        fileType: msg.fileType,
      }));
    } catch (error) {
      console.error("Error loading messages:", error);
      return [];
    }
  }


  async markChatAsRead(chatId: string): Promise<void> {
    try {
      await axiosInstance.post(`${this.API_URL}/messages/${chatId}/read`);
    } catch (error) {
      console.error("Error marking chat as read:", error);
    }
  }


  async getUnreadCount(): Promise<number> {
    try {
      const response = await axiosInstance.get(`${this.API_URL}/unread-count`);
      return response.data;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }


  async getUserById(userId: number): Promise<ChatUser> {
    try {
      const response = await axiosInstance.get(`/api/users/${userId}`);
      const userData = response.data;
      return {
        id: userData.id,
        name: userData.name, // API returns pre-formatted name
        profilePicture: userData.profilePictureUrl || "", // API field is profilePictureUrl
        isOnline: userData.online || false, // Renamed from isOnline in entity to online (getter is isOnline)
        lastSeen: userData.lastSeen,
      };
    } catch (error) {
      console.error("Error loading user:", error);
      // Return a safe fallback rather than mock random data
      return {
        id: userId,
        name: `User ${userId}`,
        profilePicture: "",
        isOnline: false,
      };
    }
  }
}

export const chatService = new ChatService();
