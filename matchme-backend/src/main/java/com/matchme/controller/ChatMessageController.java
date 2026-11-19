package com.matchme.controller;

import com.matchme.dto.ChatMessageDto;
import com.matchme.dto.ChatSummaryDto;
import com.matchme.dto.SendMessageRequest;
import com.matchme.security.UserDetailsImpl;
import com.matchme.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    // Get chat list with metadata (last message, unread count, etc.)
    @GetMapping("/list")
    public ResponseEntity<List<ChatSummaryDto>> getChatList(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(chatMessageService.getUserChatList(userDetails.getUserId()));
    }

    // Get messages with pagination + security check
    @GetMapping("/messages/{partnerId}")
    public ResponseEntity<List<ChatMessageDto>> getMessages(
            @PathVariable Long partnerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        List<ChatMessageDto> messages = chatMessageService.getMessagesPaginated(userDetails.getUserId(), partnerId,
                page, size);
        return ResponseEntity.ok(messages);
    }

    // Save a message
    @PostMapping("/messages")
    public ResponseEntity<ChatMessageDto> saveMessage(
            @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        ChatMessageDto saved = chatMessageService.saveMessage(request, userDetails.getUserId());
        return ResponseEntity.ok(saved);
    }

    // Mark chat as read
    @PostMapping("/messages/{partnerId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long partnerId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        chatMessageService.markChatAsRead(userDetails.getUserId(), partnerId);
        return ResponseEntity.ok().build();
    }

    // Get unread message count
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        Long count = chatMessageService.getUnreadCount(userDetails.getUserId());
        return ResponseEntity.ok(count);
    }
}