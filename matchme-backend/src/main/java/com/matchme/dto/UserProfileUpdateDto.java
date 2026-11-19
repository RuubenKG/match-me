package com.matchme.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class UserProfileUpdateDto {

    // personal info
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private Double longitude;
    private Double latitude;
    private String location;

    // account info
    private String username;
    private String email;
    private String password;
    private String bio;
    private String profilePictureUrl;
    private Integer maxDistance;
    private Boolean removePhoto;

    // movie-related preferences
    private List<String> favoriteGenres;
    private List<String> dislikedGenres;
    private List<Long> favoriteActors;
    private List<Long> dislikedActors;
    private List<Long> favoriteDirectors;
    private List<Long> dislikedDirectors;
    private List<Long> favoriteMovies;
    private List<Long> dislikedMovies;
    private List<String> favoriteDecades;
    private List<String> dislikedDecades;
    private List<Long> watchlist;
}
