package com.matchme.controller;

import com.matchme.dto.ChatMessageDto;
import com.matchme.dto.SendMessageRequest;
import com.matchme.entity.User;
import com.matchme.service.ChatMessageService;
import com.matchme.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;
import java.util.HashMap;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketChatController {

    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserService userService;
    private final SimpUserRegistry userRegistry;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload SendMessageRequest request, Principal principal) {
        if (principal == null) {
            log.error("Unauthorized websocket message attempt");
            return;
        }

        try {
            // Debug: List all connected users
            int userCount = userRegistry.getUserCount();
            log.info("--- Connected Users Audit (Total: {}) ---", userCount);
            for (SimpUser u : userRegistry.getUsers()) {
                log.info("Active Principal: '{}' Sessions: {}", u.getName(), u.getSessions());
            }
            log.info("-----------------------------");

            String email = principal.getName();
            log.info("WebSocket Message Received from Principal: {}", email);

            User sender = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));

            User recipient = userService.findById(request.getRecipientId())
                    .orElseThrow(() -> new RuntimeException("Recipient not found: " + request.getRecipientId()));

            log.info("Processing message from {} ({}) to {} ({})", sender.getEmail(), sender.getId(),
                    recipient.getEmail(), recipient.getId());

            log.info("Saving message: Sender={}, Recipient={}, Content='{}'", sender.getId(), recipient.getId(),
                    request.getContent());
            ChatMessageDto savedMsg = chatMessageService.saveMessage(request, sender.getId());
            log.info("Message saved to DB with ID: {}. isRead={}", savedMsg.getId(), savedMsg.getIsRead());

            String recipientEmail = recipient.getEmail().toLowerCase();
            log.info("Routing to Recipient: {} on /user/queue/messages", recipientEmail);
            messagingTemplate.convertAndSendToUser(
                    recipientEmail,
                    "/queue/messages",
                    savedMsg);

            String senderEmail = email.toLowerCase();
            log.info("Routing back to Sender: {} on /user/queue/messages", senderEmail);
            messagingTemplate.convertAndSendToUser(
                    senderEmail,
                    "/queue/messages",
                    savedMsg);

        } catch (Exception e) {
            log.error("Error processing websocket message", e);
        }
    }

    @MessageMapping("/chat.read")
    public void markAsRead(@Payload Map<String, Long> payload, Principal principal) {
        if (principal == null)
            return;

        try {
            Long senderId = payload.get("senderId"); // The person whose messages I am reading
            String email = principal.getName();
            User reader = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            chatMessageService.markChatAsRead(reader.getId(), senderId);

            // Notify the SENDER that their messages were read
            User sender = userService.findById(senderId)
                    .orElseThrow(() -> new RuntimeException("Sender not found"));

            Map<String, Object> receipt = new HashMap<>();
            receipt.put("readerId", reader.getId());
            receipt.put("readAt", java.time.LocalDateTime.now().toString());

            messagingTemplate.convertAndSendToUser(
                    sender.getEmail().toLowerCase(),
                    "/queue/read-receipt",
                    receipt);

        } catch (Exception e) {
            log.error("Error processing read receipt", e);
        }
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload Map<String, Object> payload, Principal principal) {
        log.info("DEBUG TYPING RECEIVED: Principal={}, Payload={}",
                (principal != null ? principal.getName() : "NULL"), payload);

        if (principal == null)
            return;

        try {
            Object recipientIdObj = payload.get("recipientId");
            Object isTypingObj = payload.get("isTyping");

            if (recipientIdObj == null || isTypingObj == null) {
                log.error("Invalid typing payload: recipientId or isTyping missing");
                return;
            }

            Long recipientId = Long.valueOf(recipientIdObj.toString());
            boolean isTyping = (Boolean) isTypingObj;

            String email = principal.getName();
            User sender = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));

            User recipient = userService.findById(recipientId)
                    .orElseThrow(() -> new RuntimeException("Recipient not found: " + recipientId));

            Map<String, Object> typingUpdate = new HashMap<>();
            typingUpdate.put("userId", sender.getId());
            typingUpdate.put("isTyping", isTyping);

            String targetUser = recipient.getEmail().toLowerCase();
            String destination = "/queue/typing";

            log.info("RELAYING TYPING: {} -> {} on /user/{}{}",
                    sender.getEmail(), targetUser, targetUser, destination);

            messagingTemplate.convertAndSendToUser(
                    targetUser,
                    destination,
                    typingUpdate);

        } catch (Exception e) {
            log.error("Error processing typing event", e);
        }
    }
}
