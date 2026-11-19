package com.matchme.repository;

import com.matchme.entity.ChatMessage;
import com.matchme.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE (m.sender = :user1 AND m.recipient = :user2) OR (m.sender = :user2 AND m.recipient = :user1) ORDER BY m.timestamp ASC")
    List<ChatMessage> findChatHistory(@Param("user1") User user1, @Param("user2") User user2);

    @Query("SELECT m FROM ChatMessage m WHERE (m.sender = :user1 AND m.recipient = :user2) OR (m.sender = :user2 AND m.recipient = :user1) ORDER BY m.timestamp DESC")
    Page<ChatMessage> findChatHistoryPaginated(@Param("user1") User user1, @Param("user2") User user2,
            Pageable pageable);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.recipient = :recipient AND m.isRead = false")
    Long countUnreadMessages(@Param("recipient") User recipient);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.sender = :sender AND m.recipient = :recipient AND m.isRead = false")
    Long countUnreadMessagesFromUser(@Param("sender") User sender, @Param("recipient") User recipient);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.sender = :sender AND m.recipient = :recipient AND m.isRead = false")
    void markMessagesAsRead(@Param("sender") User sender, @Param("recipient") User recipient);

    @Query("SELECT DISTINCT m.sender FROM ChatMessage m WHERE m.recipient = :user")
    List<User> findSenders(@Param("user") User user);

    @Query("SELECT DISTINCT m.recipient FROM ChatMessage m WHERE m.sender = :user")
    List<User> findRecipients(@Param("user") User user);
}