package com.matchme.dto;

import com.matchme.entity.UserPreferences;
import com.matchme.entity.UserProfile;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class UserResponseDto {

    private Long id;
    private String firstName;
    private String lastName;
    private String bio;
    private LocalDate dateOfBirth;
    private String profilePictureUrl;
    private String location;
    private Double longitude;
    private Double latitude;

    // movie-related preferences
    private List<String> favoriteGenres;
    private List<String> dislikedGenres;
    private List<Long> favoriteActors;
    private List<Long> dislikedActors;
    private List<Long> favoriteDirectors;
    private List<Long> dislikedDirectors;
    private List<Long> favoriteMovies;
    private List<Long> dislikedMovies;
    private String email;
    private List<String> favoriteDecades;
    private List<String> dislikedDecades;
    private List<Long> watchlist;

    public UserResponseDto(UserProfile profile, UserPreferences userPreferences, String email) {
        this.id = profile.getId();
        this.email = email;
        this.firstName = profile.getFirstName();
        this.lastName = profile.getLastName();
        this.bio = profile.getBio();
        this.dateOfBirth = profile.getDateOfBirth();
        this.profilePictureUrl = profile.getProfilePictureUrl();
        this.longitude = profile.getLongitude();
        this.latitude = profile.getLatitude();
        this.location = profile.getLocation();

        if (userPreferences != null) {
            this.favoriteGenres = userPreferences.getFavoriteGenres();
            this.dislikedGenres = userPreferences.getDislikedGenres();
            this.favoriteActors = userPreferences.getFavoriteActors();
            this.dislikedActors = userPreferences.getDislikedActors();
            this.favoriteDirectors = userPreferences.getFavoriteDirectors();
            this.dislikedDirectors = userPreferences.getDislikedDirectors();
            this.favoriteMovies = userPreferences.getFavoriteMovies();
            this.dislikedMovies = userPreferences.getDislikedMovies();
            this.watchlist = userPreferences.getWatchlist();
            this.favoriteDecades = userPreferences.getFavoriteDecades();
            this.dislikedDecades = userPreferences.getDislikedDecades();
        } else {
            this.favoriteGenres = List.of();
            this.dislikedGenres = List.of();
            this.favoriteActors = List.of();
            this.dislikedActors = List.of();
            this.favoriteDirectors = List.of();
            this.dislikedDirectors = List.of();
            this.favoriteMovies = List.of();
            this.dislikedMovies = List.of();
            this.watchlist = List.of();
            this.favoriteDecades = List.of();
            this.dislikedDecades = List.of();
        }
    }

}
