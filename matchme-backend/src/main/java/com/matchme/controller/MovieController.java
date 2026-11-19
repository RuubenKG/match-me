package com.matchme.controller;

import com.matchme.service.MovieService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping("/search")
    public Map<String, Object> search(@RequestParam String query) {
        return movieService.searchMovie(query);
    }

    @GetMapping("/actors/search")
    public Map<String, Object> searchActors(@RequestParam String query) {
        return movieService.searchActor(query);
    }

    @GetMapping("/{id}")
    public Map<String, Object> getMovieDetails(@PathVariable Long id) {
        return movieService.getMovieDetails(id);
    }

    @GetMapping("/actors/{id}")
    public Map<String, Object> getActorDetails(@PathVariable Long id) {
        return movieService.getActorDetails(id);
    }
}
