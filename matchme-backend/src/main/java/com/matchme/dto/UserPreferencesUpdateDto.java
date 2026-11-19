package com.matchme.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class UserPreferencesUpdateDto {
    public String location;

    public List<String> favoriteGenres;
    public List<String> dislikedGenres;


    public List<Long> favoriteMovies;
    public List<Long> dislikedMovies;

    public List<String> favoriteDecades;
    public List<String> dislikedDecades;

    public List<Long> favoriteActors;
    public List<Long> dislikedActors;

    public List<Long> favoriteDirectors;
    public List<Long> dislikedDirectors;
}

