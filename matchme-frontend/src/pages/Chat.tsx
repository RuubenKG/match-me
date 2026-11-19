import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { chatService } from "../services/chatService";
import { authService } from "../services/authService";
import { useWebSocket } from "../contexts/WebSocketContext";
import { API_BASE_URL } from "../config";
import AlienBackground from "../components/alien-background";
import "../styles/crt-effect.css";
import type { Chat, Message, ChatUser } from "../types/chat.types";

function ChatPage() {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const { client, isConnected, sendMessage, markAsRead, addMessageListener, removeMessageListener, addStatusListener, removeStatusListener, addTypingListener, removeTypingListener, sendTypingStatus } = useWebSocket();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const isTypingSentRef = useRef(false);

  // Refs to fix stale closures in WebSocket callbacks
  const selectedUserRef = useRef<ChatUser | null>(null);
  const currentUserIdRef = useRef<number>(0);
  const chatIdRef = useRef<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // Safe user parsing
  const userJson = localStorage.getItem("user");
  let currentUserId = 0;
  console.log("LocalStorage 'user' raw:", userJson);
  try {
    const parsed = userJson ? JSON.parse(userJson) : 0;
    // Handle case where "user" might be object or ID
    currentUserId = typeof parsed === 'object' ? parsed.id || 0 : parsed;
    console.log("Resolved CurrentUserID:", currentUserId);
  } catch (e) {
    console.error("Failed to parse user from local storage", e);
  }

  // Keep refs updated
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  const isInChatView = !!chatId;

  // Helper to resolve images (consistent with MainPage/Connections)
  const getDisplayImage = (pic: string | null | undefined) => {
    if (!pic) return "/default-alien-avatar.png";
    if (pic.startsWith("http")) return pic;
    return `${API_BASE_URL}/user-photos/${pic}`;
  };

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (chatId) {
      loadChatById(chatId);
    } else {
      setSelectedChat(null);
      setMessages([]);
      setSelectedUser(null);
    }
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // 1. Register global message listener
    addMessageListener(handleNewMessage);

    // 2. Subscribe to Read Receipts (Specific to this page, keep local)
    let receiptSub: any;
    if (client && isConnected) {
      console.log("📝 Attempting subscription to /user/queue/read-receipt");
      receiptSub = client.subscribe('/user/queue/read-receipt', (message) => {
        try {
          const body = JSON.parse(message.body);
          const readerId = body.readerId;

          console.log("👀 Read Receipt from User:", readerId);

          setMessages(prev => prev.map(m => {
            if (m.recipientId === readerId && m.senderId === currentUserIdRef.current) {
              return { ...m, isRead: true };
            }
            return m;
          }));
        } catch (err) {
          console.error("Error processing read receipt", err);
        }
      });
    }

    return () => {
      removeMessageListener(handleNewMessage);
      if (receiptSub) receiptSub.unsubscribe();
    };
  }, [client, isConnected, addMessageListener, removeMessageListener]);

  useEffect(() => {
    const handleStatusUpdate = (data: { userId: number, isOnline: boolean, lastSeen?: string }) => {
      console.log("Header Status Update:", data);
      setChats(prev => prev.map(c => {
        const otherUserId = c.participants.find(p => p !== currentUserId);
        if (otherUserId === data.userId) {
          // This only works if we load users for each chat item, which we do in ChatListItem
          // But ChatListItem has its own state. 
        }
        return c;
      }));

      setSelectedUser(prev => {
        if (prev && prev.id === data.userId) {
          return { ...prev, isOnline: data.isOnline, lastSeen: data.lastSeen };
        }
        return prev;
      });
    };

    addStatusListener(handleStatusUpdate);
    return () => removeStatusListener(handleStatusUpdate);
  }, [addStatusListener, removeStatusListener, currentUserId]);

  useEffect(() => {
    const handleTypingUpdate = (data: { userId: number, isTyping: boolean }) => {
      console.log("Header Typing Update Received:", data, "PartnerRefId:", selectedUserRef.current?.id);
      if (selectedUserRef.current && data.userId == selectedUserRef.current.id) {
        console.log("MATCH! Setting partner typing status to:", data.isTyping);
        setIsPartnerTyping(data.isTyping);
      } else {
        console.log("NO MATCH. DataId:", data.userId, "is NOT PartnerId:", selectedUserRef.current?.id);
      }
    };

    addTypingListener(handleTypingUpdate);
    return () => removeTypingListener(handleTypingUpdate);
  }, [addTypingListener, removeTypingListener]);

  useEffect(() => {
    setIsPartnerTyping(false);
  }, [chatId]);

  const handleNewMessage = (message: Message) => {
    const currentUser = currentUserIdRef.current;
    const activeUser = selectedUserRef.current;
    const activeChatId = chatIdRef.current;

    console.log("Handling Msg. CurrentUser:", currentUser, "ActiveUser:", activeUser?.id, "ActiveChatId:", activeChatId);

    // IF sending msg from active user, mark it read immediately because I see it
    if (activeUser && message.senderId === activeUser.id && markAsRead) {
      try {
        markAsRead(activeUser.id);
      } catch (e) {
        console.error("Failed to mark as read within handler", e);
      }
    }

    setMessages((prev) => {
      const isRelevant =
        activeUser &&
        ((message.senderId === currentUser && message.recipientId === activeUser.id) ||
          (message.senderId === activeUser.id && message.recipientId === currentUser));

      if (isRelevant) {
        console.log("✅ Msg is Relevant to active chat. Updating bubbles.");
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      }
      console.log("⚠️ Msg NOT relevant to active chat (Sender:", message.senderId, "Recipient:", message.recipientId, ")");
      return prev;
    });

    setChats((prevChats) => {
      const existingChat = prevChats.find((c) =>
        c.participants.includes(message.senderId) && c.participants.includes(message.recipientId)
      );

      if (existingChat) {
        console.log("Updating existing chat:", existingChat.id);
        return prevChats.map(c => {
          if (c.id === existingChat.id) {
            // Unread logic: If I am NOT the sender AND I am NOT looking at this chat
            const shouldIncrement = (message.senderId !== currentUser && c.id !== activeChatId);
            return {
              ...c,
              lastMessage: message.content,
              updatedAt: message.timestamp,
              unreadCount: shouldIncrement ? c.unreadCount + 1 : c.unreadCount
            };
          }
          return c;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      } else {
        console.log("Creating new chat entry for msg.");
        const newChatId = `${Math.min(message.senderId, message.recipientId)}_${Math.max(message.senderId, message.recipientId)}`;
        // If I am sender OR I am looking at this new chat (edge case), unread is 0. Else 1.
        const shouldIncrement = (message.senderId !== currentUser && newChatId !== activeChatId);

        const newChat: Chat = {
          id: newChatId,
          participants: [message.senderId, message.recipientId],
          lastMessage: message.content,
          updatedAt: message.timestamp,
          unreadCount: shouldIncrement ? 1 : 0
        };
        return [newChat, ...prevChats];
      }
    });
  };


  const loadChats = async () => {
    try {
      setLoading(true);
      const chatsData = await chatService.getChats();
      setChats(chatsData);
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatById = async (chatId: string) => {
    console.log("🚀 loadChatById triggered for:", chatId);
    if (isLoadingRef.current) {
      console.log("⚠️ loadChatById skipped - already loading");
      return;
    }

    isLoadingRef.current = true;
    setIsLoadingMessages(true);

    try {
      let chatList = chats;
      if (chatList.length === 0) {
        console.log("Empty chat list, fetching from API...");
        chatList = await chatService.getChats();
        console.log("Fetched chats:", chatList);
        setChats(chatList);
      } else {
        console.log("Using existing chat list:", chatList);
      }

      const chat = chatList.find((c) => c.id === chatId);

      if (chat) {
        console.log("Found existing chat in list:", chat);
        setSelectedChat(chat);
        const otherUserId = chat.participants.find((p) => p !== currentUserId);
        if (otherUserId) {
          console.log("Fetching user details for partner:", otherUserId);
          const userData = await chatService.getUserById(otherUserId);
          setSelectedUser(userData);
          // Removed blocking call
        }

        if (otherUserId) {
          console.log("Fetching messages for partner:", otherUserId);
          const dbMessages = await chatService.getMessages(String(otherUserId), 0, 20);
          console.log("Fetched messages:", dbMessages);
          setMessages(dbMessages);
        }

        setChats((prevChats) =>
          prevChats.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
        );
      } else {
        console.log("Chat not found in list, attempting fallback...");
        // Fallback for direct URL access or new chat
        const match = chatId.match(/(\d+)_(\d+)/);
        if (match) {
          const id1 = parseInt(match[1]);
          const id2 = parseInt(match[2]);
          const otherUserId = id1 === currentUserId ? id2 : id1;
          console.log("Derived otherUserId from URL:", otherUserId);

          const userData = await chatService.getUserById(otherUserId);
          setSelectedUser(userData);

          setSelectedChat({
            id: chatId,
            participants: [currentUserId, otherUserId],
            lastMessage: "",
            updatedAt: new Date().toISOString(),
            unreadCount: 0,
          });
          setMessages([]);
        } else {
          if (!isNaN(Number(chatId))) {
            console.log("Numeric chatId detected, treating as UserId:", chatId);
            try {
              const userData = await chatService.getUserById(Number(chatId));
              setSelectedUser(userData);
              setMessages([]);
            } catch (e) {
              console.error("Partner not found");
            }
          }
        }
      }

    } catch (error) {
      console.error("❌ Error loading/initializing chat:", error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
      isLoadingRef.current = false;
      console.log("🏁 loadChatById finished");
    }
  };

  const handleChatClick = (chat: Chat) => {
    navigate(`/chat/${chat.id}`);
  };

  const handleBackToList = () => {
    navigate("/chat");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    // Typing Logic
    if (selectedUser && isConnected) {
      if (!isTypingSentRef.current && value.length > 0) {
        console.log("📤 Sending Typing START to partner:", selectedUser.id);
        isTypingSentRef.current = true;
        sendTypingStatus(selectedUser.id, true);
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingSentRef.current) {
          console.log("📤 Sending Typing STOP to partner:", selectedUser.id);
          isTypingSentRef.current = false;
          sendTypingStatus(selectedUser.id, false);
        }
      }, 2000);
    } else {
      console.warn("⚠️ Typing Logic Skipped: selectedUser=", !!selectedUser, "isConnected=", isConnected);
    }
  };

  const handleSendMessage = async () => {
    console.log("🚀 handleSendMessage triggered. Input:", messageInput, "Connected:", isConnected, "SelectedUser:", selectedUser?.id);
    if (!messageInput.trim() || !client || !isConnected || !selectedUser) {
      console.warn("⚠️ Cannot send: missing requirements", { input: !!messageInput.trim(), client: !!client, connected: isConnected, user: !!selectedUser });
      return;
    }

    try {
      setSending(true);
      console.log("Attempting to send message to user:", selectedUser.id);

      // Stop typing immediately when sending
      if (isTypingSentRef.current) {
        isTypingSentRef.current = false;
        sendTypingStatus(selectedUser.id, false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }

      sendMessage(selectedUser.id, messageInput.trim());
      setMessageInput("");
    } catch (error) {
      console.error("❌ Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleProfileClick = (userId: number) => {
    navigate(`/user/${userId}`);
  };

  // Trigger markAsRead when entering a chat or when messages load
  useEffect(() => {
    if (selectedUser && messages.length > 0 && isConnected && markAsRead) {
      // Send signal to backend
      try {
        markAsRead(selectedUser.id);
      } catch (e) { console.error("Error marking chat as read:", e); }
    }
  }, [selectedUser, messages.length, isConnected]);

  return (
    <>
      <AlienBackground />
      <div className="min-h-screen flex relative z-10">
        <div
          className={`${isInChatView ? "hidden md:flex" : "flex"
            } w-full md:w-[450px] flex-col h-screen border-r-4 border-green-500 bg-black/95 z-30`}
        >
          <div className="p-4 border-b-4 border-green-500 bg-black/90 flex flex-col gap-4">
            <div className="flex justify-between items-center gap-4">
              <button
                onClick={() => navigate("/MainPage")}
                className="border-4 border-green-500 bg-green-900/50 hover:bg-green-700 px-4 py-2 text-green-300 hover:text-white text-lg font-bold alien-glow transition-all font-sevastopol"
              >
                BACK
              </button>
              <button
                onClick={async () => {
                  await (window as any).disconnectSocket?.();
                  authService.logout();
                  navigate("/login");
                }}
                className="border-4 border-red-500 bg-red-900/50 hover:bg-red-700 px-4 py-2 text-red-400 hover:text-white text-lg font-bold alien-glow-red transition-all font-sevastopol"
              >
                LOGOUT
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div
                className="p-4 text-center text-3xl font-bold animate-pulse alien-glow"
                style={{ fontFamily: "Sevastopol Interface" }}
              >
                LOADING TRANSMISSIONS...
              </div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center">
                <p
                  className="mb-4 text-3xl font-bold alien-glow"
                  style={{ fontFamily: "Sevastopol Interface" }}
                >
                  NO ACTIVE TRANSMISSIONS
                </p>
                <button
                  onClick={() => navigate("/MainPage")}
                  className="px-6 py-3 border-4 border-green-500 bg-green-600 hover:bg-green-700 text-black hover:text-white text-xl font-bold alien-glow transition-all"
                  style={{ fontFamily: "Sevastopol Interface" }}
                >
                  INITIATE CONTACT
                </button>
              </div>
            ) : (
              chats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  currentUserId={currentUserId}
                  isSelected={selectedChat?.id === chat.id}
                  onClick={() => handleChatClick(chat)}
                  onProfileClick={handleProfileClick}
                  getDisplayImage={getDisplayImage}
                />
              )
              )
            )}
          </div>
        </div>

        <div
          className={`${isInChatView ? "flex" : "hidden md:flex"
            } flex-1 flex-col h-screen bg-black/80`}
        >
          {selectedChat && selectedUser ? (
            <>
              <div className="p-4 border-b-4 border-green-500 bg-black/90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBackToList}
                      className="md:hidden text-green-400 hover:text-green-300 text-3xl font-bold alien-glow"
                      style={{ fontFamily: "Sevastopol Interface" }}
                    >
                      BACK
                    </button>
                    <div
                      className="w-16 h-16 border-4 border-green-500 overflow-hidden cursor-pointer hover:opacity-80 hover:border-green-400 transition-all bg-black alien-glow"
                      onClick={() => handleProfileClick(selectedUser.id)}
                    >
                      <img
                        src={getDisplayImage(selectedUser.profilePicture)}
                        alt={selectedUser.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3
                        className="text-3xl font-bold cursor-pointer hover:text-green-200 transition-all text-green-300"
                        onClick={() => handleProfileClick(selectedUser.id)}
                        style={{ fontFamily: "Sevastopol Interface" }}
                      >
                        USER: {selectedUser.name.toUpperCase()}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${selectedUser.isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-gray-600"}`} />
                        <p
                          className="text-2xl font-bold text-green-400"
                          style={{ fontFamily: "Sevastopol Interface" }}
                        >
                          {selectedUser.isOnline ? (
                            <span className="text-green-300">ONLINE</span>
                          ) : (
                            <span className="text-green-700">
                              OFFLINE {selectedUser.lastSeen ? `(LAST SEEN: ${new Date(selectedUser.lastSeen).toLocaleString()})` : ""}
                            </span>
                          )}
                        </p>
                      </div>
                      <p
                        className="text-lg font-bold text-green-600 opacity-50"
                        style={{ fontFamily: "Sevastopol Interface" }}
                      >
                        SYSTEM LINK: <span className={isConnected ? "text-green-300" : "text-red-500 animate-pulse"}>
                          {isConnected ? "ESTABLISHED" : "SEARCHING..."}
                        </span>
                      </p>
                      {isPartnerTyping && (
                        <p className="text-xl font-bold text-blue-400 animate-pulse" style={{ fontFamily: "Sevastopol Interface" }}>
                          {">"} USER IS GENERATING RESPONSE...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <p
                      className="text-3xl font-bold animate-pulse alien-glow"
                      style={{ fontFamily: "Sevastopol Interface" }}
                    >
                      LOADING TRANSMISSION DATA...
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-green-500">NO MESSAGES.</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isOwn={message.senderId === currentUserId}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="border-t-4 border-green-500 p-4 bg-black/90">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={isConnected ? "> ENTER MESSAGE..." : "CONNECTION INTERRUPTED..."}
                    disabled={sending || !isConnected}
                    className="flex-1 border-4 border-green-200 bg-black text-white p-3 placeholder-green-700 disabled:opacity-50 text-2xl font-bold alien-glow"
                    style={{ fontFamily: "Sevastopol Interface" }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sending || !isConnected}
                    className="px-8 py-3 border-4 border-green-500 bg-green-600 hover:bg-green-700 text-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-xl font-bold alien-glow transition-all"
                    style={{ fontFamily: "Sevastopol Interface" }}
                  >
                    {sending ? "SENDING..." : "SEND"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full"><p className="text-green-500">SELECT A CHAT</p></div>
          )}
        </div>
      </div>
    </>
  );
}

// CHAT LIST ITEM COMPONENT
interface ChatListItemProps {
  chat: Chat;
  currentUserId: number;
  isSelected: boolean;
  onClick: () => void;
  onProfileClick: (userId: number) => void;
  getDisplayImage: (url: string | null | undefined) => string;
}

function ChatListItem({
  chat,
  currentUserId,
  isSelected,
  onClick,
  onProfileClick,
  getDisplayImage
}: ChatListItemProps) {
  const [user, setUser] = useState<ChatUser | null>(null);
  const { addStatusListener, removeStatusListener } = useWebSocket();

  useEffect(() => {
    const loadUser = async () => {
      const otherUserId = chat.participants.find((p) => p !== currentUserId);
      if (otherUserId) {
        const userData = await chatService.getUserById(otherUserId);
        setUser(userData);
      }
    };
    loadUser();
  }, [chat, currentUserId]);

  useEffect(() => {
    const handleStatusUpdate = (data: { userId: number, isOnline: boolean, lastSeen?: string }) => {
      setUser(prev => {
        if (prev && prev.id === data.userId) {
          return { ...prev, isOnline: data.isOnline, lastSeen: data.lastSeen };
        }
        return prev;
      });
    };

    addStatusListener(handleStatusUpdate);
    return () => removeStatusListener(handleStatusUpdate);
  }, [addStatusListener, removeStatusListener]);

  if (!user) return null;

  return (
    <div
      className={`p-4 cursor-pointer hover:bg-green-900/30 border-b-4 border-green-500 transition-all ${isSelected ? "bg-green-900/50 alien-glow" : "bg-black/70"
        }`}
    >
      <div className="flex items-center gap-3" onClick={onClick}>
        <div className="relative flex-shrink-0">
          <div
            className="w-16 h-16 border-4 border-green-500 overflow-hidden cursor-pointer hover:opacity-80 hover:border-green-400 bg-black transition-all alien-glow"
            onClick={(e) => {
              e.stopPropagation();
              onProfileClick(user.id);
            }}
          >
            <img
              src={getDisplayImage(user.profilePicture)}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>
          {user.isOnline && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-black rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <p
              className="text-2xl font-bold truncate text-green-300"
              style={{ fontFamily: "Sevastopol Interface" }}
            >
              USER: {user.name.toUpperCase()}
            </p>
            {chat.unreadCount > 0 && (
              <span
                className="bg-green-400 text-black text-lg font-bold px-3 py-1 ml-2"
                style={{ fontFamily: "Sevastopol Interface" }}
              >
                {chat.unreadCount}
              </span>
            )}
          </div>
          {chat.lastMessage && (
            <p
              className="text-lg text-green-400 truncate font-bold"
              style={{ fontFamily: "Sevastopol Interface" }}
            >
              {">"} {chat.lastMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateStr}, ${timeStr}`;
  };
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`p-4 border-2 ${isOwn ? "border-green-500 bg-green-900/40" : "border-green-500 bg-black/80"} relative`}>
        <p className="text-xl text-green-300 font-bold">{message.content}</p>
        <div className="flex items-center justify-end gap-2 mt-1">
          <span className="text-xs text-green-600">{formatTimestamp(message.timestamp)}</span>
          {isOwn && (
            <span className="text-xs font-bold" title={message.isRead ? "Read" : "Sent"}>
              {message.isRead ? (
                <span className="text-blue-400">READ</span> // Text for read
              ) : (
                <span className="text-gray-500">SENT</span> // Text for sent
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;