package com.matchme.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class UserBioDto {
    private Long id;
    private List<String> interests;
    private List<Long> favoriteMovies;
    private List<String> favoriteGenres;
    private List<String> favoriteDecades;
    private List<Long> favoriteActors;
    private List<Long> favoriteDirectors;
    private List<Long> dislikedMovies;
    private List<String> dislikedGenres;
    private List<String> dislikedDecades;
    private List<Long> dislikedActors;
    private List<Long> dislikedDirectors;
}
