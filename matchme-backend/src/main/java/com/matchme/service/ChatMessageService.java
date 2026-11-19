package com.matchme.service;

import com.matchme.dto.ChatMessageDto;
import com.matchme.dto.ChatSummaryDto;
import com.matchme.dto.SendMessageRequest;
import com.matchme.entity.ChatMessage;
import com.matchme.entity.User;
import com.matchme.controller.GraphQLController;
import com.matchme.repository.ChatMessageRepository;
import com.matchme.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ChatMessageService {

        private final ChatMessageRepository chatMessageRepository;
        private final UserRepository userRepository;
        private final ConnectionService connectionService;
        private final GraphQLController graphQLController;

        public ChatMessageService(ChatMessageRepository chatMessageRepository,
                        UserRepository userRepository,
                        @org.springframework.context.annotation.Lazy ConnectionService connectionService,
                        @org.springframework.context.annotation.Lazy GraphQLController graphQLController) {
                this.chatMessageRepository = chatMessageRepository;
                this.userRepository = userRepository;
                this.connectionService = connectionService;
                this.graphQLController = graphQLController;
        }

        @Transactional
        public ChatMessageDto saveMessage(SendMessageRequest request, Long senderId) {
                User sender = userRepository.findById(senderId)
                                .orElseThrow(() -> new EntityNotFoundException("Sender not found"));
                User recipient = userRepository.findById(request.getRecipientId())
                                .orElseThrow(() -> new EntityNotFoundException("Recipient not found"));

                ChatMessage message = ChatMessage.builder()
                                .sender(sender)
                                .recipient(recipient)
                                .content(request.getContent())
                                .timestamp(LocalDateTime.now())
                                .isRead(false)
                                .build();

                ChatMessage saved = chatMessageRepository.save(message);

                // Notify GraphQL Subscriptions
                if (graphQLController != null) {
                        graphQLController.publishMessage(saved);
                }

                return toDto(saved);
        }

        @Transactional
        public void sendSystemMessage(Long senderId, Long recipientId, String content) {
                // System message usually comes from a "system" user, but if we don't have one,
                // we can use the sender as the source or a special ID if the DB allows.
                // For now, let's assume it comes from the sender to initiate the thread.
                try {
                        User sender = userRepository.findById(senderId).orElseThrow();
                        User recipient = userRepository.findById(recipientId).orElseThrow();

                        ChatMessage message = ChatMessage.builder()
                                        .sender(sender)
                                        .recipient(recipient)
                                        .content(content)
                                        .timestamp(LocalDateTime.now())
                                        .isRead(false)
                                        .build();
                        chatMessageRepository.save(message);
                } catch (Exception e) {
                        log.error("Failed to send system message", e);
                }
        }

        public List<ChatSummaryDto> getUserChatList(Long userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new EntityNotFoundException("User not found"));

                // Find all distinct users connected via chat OR connection
                Set<User> partners = new HashSet<>();
                partners.addAll(chatMessageRepository.findSenders(user));
                partners.addAll(chatMessageRepository.findRecipients(user));

                // Add all accepted connections (fixes "New Match not showing" bug)
                partners.addAll(connectionService.getConnectedUsers(userId));

                List<ChatSummaryDto> summaries = new ArrayList<>();

                for (User partner : partners) {
                        // Get last message
                        Page<ChatMessage> lastMsgPage = chatMessageRepository.findChatHistoryPaginated(
                                        user, partner, PageRequest.of(0, 1));

                        String content = "New Connection";
                        LocalDateTime timestamp = LocalDateTime.MIN; // push to bottom? or top?
                        // If new match, maybe push to top?
                        // Let's us creation date of connection? We don't have it handy.
                        // Let's use MIN for now, so active chats are top.

                        if (lastMsgPage.hasContent()) {
                                ChatMessage lastMsg = lastMsgPage.getContent().get(0);
                                content = lastMsg.getContent();
                                timestamp = lastMsg.getTimestamp();
                        }

                        // Get unread count from this partner
                        Long unreadCount = chatMessageRepository.countUnreadMessagesFromUser(partner, user);

                        summaries.add(ChatSummaryDto.builder()
                                        .chatId(String.valueOf(partner.getId()))
                                        .participants(Arrays.asList(user.getId(), partner.getId()))
                                        .lastMessage(content)
                                        .updatedAt(timestamp)
                                        .unreadCount(unreadCount)
                                        .build());
                }

                summaries.sort((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()));
                return summaries;
        }

        public List<ChatMessageDto> getMessagesPaginated(Long userId, Long partnerId, int page, int size) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new EntityNotFoundException("User not found"));
                User partner = userRepository.findById(partnerId)
                                .orElseThrow(() -> new EntityNotFoundException("Partner not found"));

                Pageable pageable = PageRequest.of(page, size); // Repository orders by DESC
                Page<ChatMessage> messagePage = chatMessageRepository.findChatHistoryPaginated(user, partner, pageable);

                List<ChatMessageDto> messages = messagePage.getContent()
                                .stream()
                                .map(this::toDto)
                                .collect(Collectors.toList());

                Collections.reverse(messages); // Return chronological order for UI
                return messages;
        }

        @Transactional
        public void markChatAsRead(Long userId, Long partnerId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new EntityNotFoundException("User not found"));
                User partner = userRepository.findById(partnerId)
                                .orElseThrow(() -> new EntityNotFoundException("Partner not found"));

                chatMessageRepository.markMessagesAsRead(partner, user);
        }

        public Long getUnreadCount(Long userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new EntityNotFoundException("User not found"));
                return chatMessageRepository.countUnreadMessages(user);
        }

        public ChatMessageDto toDto(ChatMessage message) {
                return ChatMessageDto.builder()
                                .id(message.getId())
                                .chatId(null) // Deprecated
                                .senderId(message.getSender().getId())
                                .recipientId(message.getRecipient().getId())
                                .content(message.getContent())
                                .timestamp(message.getTimestamp())
                                .isRead(message.isRead())
                                .build();
        }
}