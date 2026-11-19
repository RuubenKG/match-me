package com.matchme.security;


import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TokenBlacklist {

    private final Map<String, Long> blacklist = new ConcurrentHashMap<>();

    public void blacklist(String token, long expirationMillis) {
        blacklist.put(token, expirationMillis);
    }

    public boolean isBlacklisted(String token) {
        Long exp = blacklist.get(token);
        if (exp == null) return false;
        if (exp < Instant.now().toEpochMilli()) {
            blacklist.remove(token);
            return false;
        }
        return true;
    }
}

