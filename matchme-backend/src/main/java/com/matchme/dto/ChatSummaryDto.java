package com.matchme.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for chat list summaries
 * Contains all metadata needed to display a chat in the chat list
 */
@Getter
@Setter
@Builder
public class ChatSummaryDto {
    private String chatId;
    private List<Long> participants; // User IDs in the chat
    private String lastMessage;
    private LocalDateTime updatedAt; // Timestamp of last message
    private Long unreadCount; // Number of unread messages for current user
}