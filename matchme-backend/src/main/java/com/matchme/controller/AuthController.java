package com.matchme.controller;

import com.matchme.dto.LoginRequests;
import com.matchme.entity.User;
import com.matchme.security.JwtAuthenticator;
import com.matchme.security.TokenBlacklist;
import com.matchme.service.UserService;
import com.matchme.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private JwtAuthenticator jwtAuthenticator;
    @Autowired
    private TokenBlacklist tokenBlacklist;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequests request) {
        String lowerEmail = request.getEmail().toLowerCase();
        User user = userService.findByEmail(lowerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body("Incorrect password");
        }

        String token = jwtUtil.generateToken(user.getEmail().toLowerCase());

        Map<String, Object> body = new HashMap<>();
        body.put("token", token);
        body.put("userId", user.getId());

        return ResponseEntity.ok(body);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        String token = jwtAuthenticator.extractToken(request);
        if (token == null) {
            return ResponseEntity.badRequest().body("Invalid token");
        }

        long expirationMillis = jwtUtil.extractExpirationMillis(token);
        tokenBlacklist.blacklist(token, expirationMillis);

        return ResponseEntity.ok("Logged out successfully");
    }
}
