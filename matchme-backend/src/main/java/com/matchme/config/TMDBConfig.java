package com.matchme.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TMDBConfig {
    @Value("${tmdb.api.key}")
    private String apiKey;

    public String getApiUrl(String path) {
        return "https://api.themoviedb.org/3/" + path + "?api_key=" + apiKey;
    }
}