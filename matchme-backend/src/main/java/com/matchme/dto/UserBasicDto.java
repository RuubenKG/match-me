package com.matchme.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class UserBasicDto {
    private Long id;
    private String name; // First + Last or Username
    private String profilePictureUrl;
    private String profileLink;
    private boolean isOnline;
    private java.time.LocalDateTime lastSeen;
}
