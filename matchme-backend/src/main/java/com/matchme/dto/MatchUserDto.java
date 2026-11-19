package com.matchme.dto;

import java.util.List;

public record MatchUserDto(
                Long id,
                List<Long> favoriteMovies,
                List<String> favoriteGenres,
                List<String> favoriteDecades,
                List<Long> favoriteActors,
                List<Long> favoriteDirectors,
                List<Long> dislikedMovies,
                List<String> dislikedGenres,
                List<String> dislikedDecades,
                List<Long> dislikedActors,
                List<Long> dislikedDirectors,
                String location,
                Double latitude,
                Double longitude,
                Integer maxDistance) {
}