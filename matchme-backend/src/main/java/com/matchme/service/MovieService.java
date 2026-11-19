package com.matchme.service;

import com.matchme.config.TMDBConfig;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class MovieService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final TMDBConfig config;

    public MovieService(TMDBConfig config) {
        this.config = config;
    }

    public Map<String, Object> searchMovie(String query) {
        String url = config.getApiUrl("search/movie") + "&query=" + UriUtils.encode(query, StandardCharsets.UTF_8);
        return restTemplate.getForObject(url, Map.class);
    }

    public Map<String, Object> searchActor(String query) {
        String url = config.getApiUrl("search/person") + "&query=" + UriUtils.encode(query, StandardCharsets.UTF_8);
        return restTemplate.getForObject(url, Map.class);
    }

    public Map<String, Object> getMovieDetails(Long id) {
        String url = config.getApiUrl("movie/" + id);
        return restTemplate.getForObject(url, Map.class);
    }

    public Map<String, Object> getActorDetails(Long id) {
        String url = config.getApiUrl("person/" + id);
        return restTemplate.getForObject(url, Map.class);
    }
}