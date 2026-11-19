package com.matchme.dto;

import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class SendMessageRequest {
    private String chatId;
    private Long recipientId;
    private String content;
    private String fileUrl;
    private String fileType;
}