package com.matchme.config;

import com.matchme.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();
        log.info("WebSocket Connected Event: session={}, principal={}", headerAccessor.getSessionId(),
                (principal != null ? principal.getName() : "NULL"));

        if (principal != null) {
            String email = principal.getName();
            userService.findByEmail(email).ifPresent(user -> {
                Long userId = user.getId();
                log.info("Marking user ONLINE: {} ({})", email, userId);
                userService.updateStatus(userId, true);

                Map<String, Object> statusMap = new HashMap<>();
                statusMap.put("userId", userId);
                statusMap.put("isOnline", true);
                messagingTemplate.convertAndSend("/topic/user-status", statusMap);
            });
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();
        Map<String, Object> attrs = headerAccessor.getSessionAttributes();

        String email = (principal != null) ? principal.getName()
                : (attrs != null ? (String) attrs.get("userEmail") : null);
        Long userId = (attrs != null) ? (Long) attrs.get("userId") : null;

        log.info("WebSocket Disconnect Event: session={}, principal={}, attrEmail={}, attrUserId={}",
                headerAccessor.getSessionId(),
                (principal != null ? principal.getName() : "NULL"),
                (attrs != null ? attrs.get("userEmail") : "NULL"),
                (attrs != null ? attrs.get("userId") : "NULL"));

        if (userId != null) {
            log.info("Marking user OFFLINE based on session attributes: UserId={}", userId);
            userService.updateStatus(userId, false);

            Map<String, Object> statusMap = new HashMap<>();
            statusMap.put("userId", userId);
            statusMap.put("isOnline", false);
            statusMap.put("lastSeen", LocalDateTime.now().toString());
            messagingTemplate.convertAndSend("/topic/user-status", statusMap);
        } else if (email != null) {
            userService.findByEmail(email).ifPresent(user -> {
                Long uid = user.getId();
                log.info("Marking user OFFLINE based on email: {} ({})", email, uid);
                userService.updateStatus(uid, false);

                Map<String, Object> statusMap = new HashMap<>();
                statusMap.put("userId", uid);
                statusMap.put("isOnline", false);
                statusMap.put("lastSeen", LocalDateTime.now().toString());
                messagingTemplate.convertAndSend("/topic/user-status", statusMap);
            });
        }
    }
}
