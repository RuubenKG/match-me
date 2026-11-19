package com.matchme.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.util.Map;
import com.matchme.util.JwtUtil;
import com.matchme.service.UserService;
import com.matchme.entity.User;

@Component
@Slf4j
public class JwtHandshakeInterceptor implements HandshakeInterceptor {
    private final JwtUtil jwtUtil;
    private final UserService userService;

    public JwtHandshakeInterceptor(JwtUtil jwtUtil, UserService userService) {
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler,
            Map<String, Object> attributes) throws Exception {
        // Try to get token from Authorization header or query param "token"
        String token = null;
        if (request.getHeaders().containsKey("Authorization")) {
            token = request.getHeaders().getFirst("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
        }
        if (token == null) {
            // fallback to query param
            String query = request.getURI().getQuery();
            if (query != null) {
                for (String param : query.split("&")) {
                    String[] kv = param.split("=");
                    if (kv.length == 2 && kv[0].equals("token")) {
                        token = kv[1];
                        break;
                    }
                }
            }
        }
        if (token == null || !jwtUtil.validateToken(token)) {
            log.warn("WebSocket Handshake: Missing or invalid token");
            return false;
        }

        String rawEmail = jwtUtil.extractUsername(token);
        String normalizedEmail = rawEmail.toLowerCase();
        log.info("WebSocket Handshake: Extracted raw email '{}', normalized to '{}'", rawEmail, normalizedEmail);

        User user = userService.findByEmail(normalizedEmail).orElse(null);
        if (user == null) {
            log.error("WebSocket Handshake Failed: No user found in DB for email '{}'", normalizedEmail);
            return false;
        }

        // Store a Principal in attributes for later use by Spring's
        // SimpMessageHeaderAccessor
        log.info("WebSocket Handshake Success: Assigning Principal '{}' (UserId: {})", normalizedEmail, user.getId());
        attributes.put("principal", new StompPrincipal(normalizedEmail));
        attributes.put("userId", user.getId());
        attributes.put("userEmail", normalizedEmail);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler,
            Exception exception) {
        // No-op
    }
}
