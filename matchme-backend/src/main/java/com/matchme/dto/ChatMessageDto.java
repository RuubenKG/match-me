package com.matchme.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;


@Getter
@Setter
@Builder
public class ChatMessageDto {
    private Long id;
    private String chatId;
    private Long senderId;
    private Long recipientId;
    private String content;
    private LocalDateTime timestamp;
    private Boolean isRead; 
    private String fileUrl;
    private String fileType;
}
