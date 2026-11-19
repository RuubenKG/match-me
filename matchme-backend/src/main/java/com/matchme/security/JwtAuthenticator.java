package com.matchme.security;

import com.matchme.service.UserService;
import com.matchme.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticator extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final TokenBlacklist tokenBlacklist;
    private final UserService userService;

    public JwtAuthenticator(
            JwtUtil jwtUtil,
            TokenBlacklist tokenBlacklist,
            UserService userService) {

        this.jwtUtil = jwtUtil;
        this.tokenBlacklist = tokenBlacklist;
        this.userService = userService;
    }

    public String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        return header.substring(7);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractToken(request);

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (tokenBlacklist.isBlacklisted(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        String username = jwtUtil.extractUsername(token);
        System.out.println("JwtAuthenticator: Validating token for user: " + username);
        UserDetails userDetails = userService.loadUserByUsername(username);

        if (jwtUtil.validateToken(token, userDetails)) {
            System.out.println("JwtAuthenticator: Token valid. Setting authentication context.");
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(auth);
        } else {
            System.err.println("JwtAuthenticator: Token validation FAILED for user: " + username);
        }
        filterChain.doFilter(request, response);

    }
}
