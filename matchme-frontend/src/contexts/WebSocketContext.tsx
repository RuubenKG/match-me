import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../config';
import type { Message } from '../types/chat.types';

type MessageListener = (message: Message) => void;

interface WebSocketContextType {
    client: Client | null;
    isConnected: boolean;
    unreadCount: number;
    sendMessage: (recipientId: number, content: string) => void;
    markAsRead: (senderId: number) => void;
    disconnectSocket: () => Promise<void>;
    addMessageListener: (listener: MessageListener) => void;
    removeMessageListener: (listener: MessageListener) => void;
    addStatusListener: (listener: (data: { userId: number, isOnline: boolean, lastSeen?: string }) => void) => void;
    removeStatusListener: (listener: (data: { userId: number, isOnline: boolean, lastSeen?: string }) => void) => void;
    addTypingListener: (listener: (data: { userId: number, isTyping: boolean }) => void) => void;
    removeTypingListener: (listener: (data: { userId: number, isTyping: boolean }) => void) => void;
    sendTypingStatus: (recipientId: number, isTyping: boolean) => void;
    refreshUnreadCount: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [client, setClient] = useState<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const stompClientRef = useRef<Client | null>(null);
    const listenersRef = useRef<Set<MessageListener>>(new Set());
    const statusListenersRef = useRef<Set<(data: any) => void>>(new Set());
    const typingListenersRef = useRef<Set<(data: { userId: number, isTyping: boolean }) => void>>(new Set());

    const addMessageListener = (listener: MessageListener) => {
        listenersRef.current.add(listener);
    };

    const removeMessageListener = (listener: MessageListener) => {
        listenersRef.current.delete(listener);
    };

    const addStatusListener = (listener: (data: any) => void) => {
        statusListenersRef.current.add(listener);
    };

    const removeStatusListener = (listener: (data: any) => void) => {
        statusListenersRef.current.delete(listener);
    };

    const addTypingListener = (listener: (data: { userId: number, isTyping: boolean }) => void) => {
        typingListenersRef.current.add(listener);
    };

    const removeTypingListener = (listener: (data: { userId: number, isTyping: boolean }) => void) => {
        typingListenersRef.current.delete(listener);
    };

    const refreshUnreadCount = async () => {
        const token = authService.getToken();
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat/unread-count`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const count = await response.json();
                setUnreadCount(count);
            }
        } catch (e) {
            console.error("Failed to fetch unread count:", e);
        }
    };

    const disconnectSocket = async () => {
        if (stompClientRef.current) {
            console.log('Deactivating WebSocket...');
            await stompClientRef.current.deactivate();
            stompClientRef.current = null;
        }
        setClient(null);
        setIsConnected(false);
    };

    const connectSocket = () => {
        const token = authService.getToken();
        if (!token) {
            console.warn('No token found, skipping WebSocket connection');
            return;
        }

        if (stompClientRef.current?.active) {
            console.log('📡 WebSocket already active, deactivating old connection first');
            stompClientRef.current.deactivate();
        }

        console.log('🌐 Initializing WebSocket connection...');
        const stompClient = new Client({
            webSocketFactory: () => {
                const currentToken = authService.getToken();
                // SockJS requires http/https, not ws/wss
                const url = `${API_BASE_URL}/ws?token=${encodeURIComponent(currentToken || '')}`;
                console.log('Creating SockJS connection to:', url);
                return new SockJS(url);
            },
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            reconnectDelay: 5000,
            debug: () => {
                // console.log('📡 STOMP Debug:', str);
            },
            onConnect: () => {
                console.log('Connected to WebSocket');
                setIsConnected(true);

                refreshUnreadCount();

                stompClient.subscribe('/user/queue/messages', (message) => {
                    try {
                        const newMessage: Message = JSON.parse(message.body);
                        console.log("Global WebSocket Msg Received:", newMessage);

                        // Update global unread count: if I am NOT the sender, increment
                        const userJson = localStorage.getItem("user");
                        let myId = 0;
                        if (userJson) {
                            const parsed = JSON.parse(userJson);
                            myId = typeof parsed === 'object' ? parsed.id : parsed;
                        }

                        if (newMessage.senderId !== myId) {
                            setUnreadCount(prev => prev + 1);
                        }

                        // Notify all listeners (e.g., ChatPage)
                        listenersRef.current.forEach(listener => listener(newMessage));
                    } catch (err) {
                        console.error("Error processing incoming message in context:", err);
                    }
                });

                stompClient.subscribe('/topic/user-status', (status) => {
                    try {
                        const statusUpdate = JSON.parse(status.body);
                        console.log("Status Update Received:", statusUpdate);
                        statusListenersRef.current.forEach(listener => listener(statusUpdate));
                    } catch (err) {
                        console.error("Error processing status update in context:", err);
                    }
                });

                stompClient.subscribe('/user/queue/typing', (typing) => {
                    try {
                        const typingUpdate = JSON.parse(typing.body);
                        console.log("Typing Update Received:", typingUpdate);
                        typingListenersRef.current.forEach(listener => listener(typingUpdate));
                    } catch (err) {
                        console.error("Error processing typing update in context:", err);
                    }
                });
            },
            onStompError: () => {
                console.error('Broker reported error');
            },
            onWebSocketClose: () => {
                console.warn('WebSocket closed');
                setIsConnected(false);
            },
            onDisconnect: () => {
                console.log('Disconnected from WebSocket');
                setIsConnected(false);
            }
        });

        stompClient.activate();
        stompClientRef.current = stompClient;
        setClient(stompClient);
    };

    useEffect(() => {
        connectSocket();

        // Safety: check every 2 seconds if token is gone
        const safetyInterval = setInterval(() => {
            const token = authService.getToken();
            if (!token && stompClientRef.current?.active) {
                console.warn('Token missing but socket active, auto-disconnecting...');
                disconnectSocket();
            }
        }, 2000);

        // expose globally for login/logout
        (window as any).reconnectSocket = connectSocket;
        (window as any).disconnectSocket = disconnectSocket;

        return () => {
            clearInterval(safetyInterval);
            disconnectSocket();
        };
    }, []);

    const sendMessage = (recipientId: number, content: string) => {
        console.log("📤 WebSocketContext: Sending message to", recipientId);
        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.publish({
                destination: '/app/chat.send',
                body: JSON.stringify({ recipientId, content })
            });
            console.log("Message published to /app/chat.send");
        } else {
            console.error("Cannot send message, socket not connected.");
        }
    };

    const markAsRead = (senderId: number) => {
        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.publish({
                destination: '/app/chat.read',
                body: JSON.stringify({ senderId })
            });
            // After marking as read, we might want to refresh the count
            // Or the backend could send a update, for now let's just refresh
            setTimeout(refreshUnreadCount, 500);
        }
    };

    const sendTypingStatus = (recipientId: number, isTyping: boolean) => {
        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.publish({
                destination: '/app/chat.typing',
                body: JSON.stringify({ recipientId, isTyping })
            });
        }
    };

    return (
        <WebSocketContext.Provider value={{
            client,
            isConnected,
            unreadCount,
            sendMessage,
            markAsRead,
            disconnectSocket,
            addMessageListener,
            removeMessageListener,
            addStatusListener,
            removeStatusListener,
            addTypingListener,
            removeTypingListener,
            sendTypingStatus,
            refreshUnreadCount
        }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
