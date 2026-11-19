// src/main/java/com/matchme/dto/MatchResultDto.java

package com.matchme.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class MatchResultDto {

    /**
     * Flag indicating whether the current 'like' action resulted in a mutual match.
     */
    private boolean mutualMatch;

    /**
     * A simple message explaining the result (e.g., "It's a Match!" or "Like
     * recorded.").
     */
    private String message;

    /**
     * Optional: The ID of the newly created Match entity, if a mutual match
     * occurred.
     * This is useful if the client needs to immediately navigate to the chat/match
     * list.
     */
    private Long matchId;

    /**
     * Optional: The ID of the user who was liked (target user).
     */
    private Long targetUserId;

    private String chatId;

    // Note: Removed the constructor, bio, profile fields, etc.,
    // as this DTO is for the result of a *like action*, not for displaying a
    // profile.

}