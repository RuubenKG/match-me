package com.matchme.controller;

import com.matchme.dto.*;
import com.matchme.enums.ConnectionStatus;
import com.matchme.entity.Connection;
import com.matchme.entity.User;
import com.matchme.entity.UserProfile;
import com.matchme.entity.UserPreferences;
import com.matchme.repository.ConnectionRepository;
import com.matchme.security.UserDetailsImpl;
import com.matchme.service.UserService;
import com.matchme.service.MatchService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserController {

    private final UserService userService;
    private final ConnectionRepository connectionRepository;
    private final MatchService matchService;

    @PostMapping("/users/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationDto dto) {
        userService.registerUser(dto);
        return ResponseEntity.ok().body(Map.of("message", "User registered successfully"));
    }

    // --- /me Endpoints ---

    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getMe(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity
                .ok(new UserResponseDto(user.getUserProfile(), user.getUserPreferences(), user.getEmail()));
    }

    @GetMapping("/me/profile")
    public ResponseEntity<UserProfileInfoDto> getMyProfileInfo(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(toProfileInfoDto(user, true));
    }

    @GetMapping("/me/bio")
    public ResponseEntity<UserBioDto> getMyBio(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(toBioDto(user));
    }

    // --- /users/{id} Endpoints ---

    @GetMapping("/users/{id}")
    public ResponseEntity<UserBasicDto> getUserBasic(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User targetUser = checkAccess(userDetails, id);
        return ResponseEntity.ok(toBasicDto(targetUser));
    }

    @GetMapping("/users/{id}/profile")
    public ResponseEntity<UserProfileInfoDto> getUserProfile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User targetUser = checkAccess(userDetails, id);
        boolean isSelf = userDetails != null && userDetails.getUserId().equals(id);
        return ResponseEntity.ok(toProfileInfoDto(targetUser, isSelf));
    }

    @GetMapping("/users/{id}/bio")
    public ResponseEntity<UserBioDto> getUserBio(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User targetUser = checkAccess(userDetails, id);
        return ResponseEntity.ok(toBioDto(targetUser));
    }

    // --- Updates ---

    @PatchMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateMyProfile(
            @RequestPart("data") UserProfileUpdateDto dto,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User currentUser = getUser(userDetails);
        User updated = userService.updateUserProfile(currentUser.getId(), dto, image);
        // Returning full DTO for now as confirmation, or could return specific parts
        return ResponseEntity
                .ok(new UserResponseDto(updated.getUserProfile(), updated.getUserPreferences(), updated.getEmail()));
    }

    // --- Helpers ---

    private User getUser(UserDetailsImpl userDetails) {
        if (userDetails == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return userService.findById(userDetails.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    /**
     * Checks if the authenticated user is allowed to view the target user.
     * Returns the target User entity if allowed, otherwise throws 404 (to hide
     * existence/block status).
     */
    private User checkAccess(UserDetailsImpl userDetails, Long targetId) {
        if (userDetails == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Long currentUserId = userDetails.getUserId();

        // 1. If asking for self, allow.
        if (currentUserId.equals(targetId)) {
            return userService.findById(currentUserId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        }

        // 2. Fetch target user (if not found, 404)
        User targetUser = userService.findById(targetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        // 3. Check permissions
        // Allowed if:
        // - Connected (Connection exists)
        // - Connection Request Pending (Connection exists)
        // - Recommended (Hard to prove strictly, but we can assume if no negative
        // interaction exists and they are not blocked)
        // For now, strict check: Must have some relation OR be "discoverable".
        // "Profiles are viewable... only if: They are recommended, There is an
        // outstanding connection request, They are connected"

        // Check Connection Table
        User currentUser = userService.findById(currentUserId).orElseThrow();
        Optional<Connection> connection = connectionRepository.findConnectionBetweenUsers(currentUser, targetUser);

        if (connection.isPresent()) {
            ConnectionStatus status = connection.get().getStatus();
            if (status == ConnectionStatus.ACCEPTED || status == ConnectionStatus.PENDING) {
                return targetUser;
            }
        }

        // For a strict "recommended" proof, we check if they would show up in the feed.
        boolean isRecommended = matchService.isRecommended(currentUser, targetUser);

        if (!isRecommended) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "ACCESS DENIED: User is not in your recommendation feed or has been declined.");
        }

        return targetUser;
    }

    private UserBasicDto toBasicDto(User user) {
        String name = user.getUsername(); // Default
        if (user.getUserProfile() != null) {
            if (user.getUserProfile().getFirstName() != null) {
                name = user.getUserProfile().getFirstName();
                if (user.getUserProfile().getLastName() != null) {
                    name += " " + user.getUserProfile().getLastName();
                }
            }
        }
        return UserBasicDto.builder()
                .id(user.getId())
                .name(name)
                .profilePictureUrl(user.getUserProfile() != null ? user.getUserProfile().getProfilePictureUrl() : null)
                .profileLink("/api/users/" + user.getId() + "/profile")
                .isOnline(user.isOnline())
                .lastSeen(user.getLastSeen())
                .build();
    }

    private UserProfileInfoDto toProfileInfoDto(User user, boolean includeEmail) {
        UserProfile p = user.getUserProfile();
        return UserProfileInfoDto.builder()
                .id(user.getId())
                .email(includeEmail ? user.getEmail() : null)
                .bio(p != null ? p.getBio() : "")
                .location(p != null ? p.getLocation() : "")
                .latitude(p != null ? p.getLatitude() : null)
                .longitude(p != null ? p.getLongitude() : null)
                .build();
    }

    private UserBioDto toBioDto(User user) {
        UserProfile p = user.getUserProfile();
        UserPreferences prefs = user.getUserPreferences();
        return UserBioDto.builder()
                .id(user.getId())
                .interests(p != null ? p.getInterests() : Collections.emptyList())
                .favoriteMovies(prefs != null ? prefs.getFavoriteMovies() : Collections.emptyList())
                .favoriteGenres(prefs != null ? prefs.getFavoriteGenres() : Collections.emptyList())
                .favoriteDecades(prefs != null ? prefs.getFavoriteDecades() : Collections.emptyList())
                .favoriteActors(prefs != null ? prefs.getFavoriteActors() : Collections.emptyList())
                .favoriteDirectors(prefs != null ? prefs.getFavoriteDirectors() : Collections.emptyList())
                .dislikedMovies(prefs != null ? prefs.getDislikedMovies() : Collections.emptyList())
                .dislikedGenres(prefs != null ? prefs.getDislikedGenres() : Collections.emptyList())
                .dislikedDecades(prefs != null ? prefs.getDislikedDecades() : Collections.emptyList())
                .dislikedActors(prefs != null ? prefs.getDislikedActors() : Collections.emptyList())
                .dislikedDirectors(prefs != null ? prefs.getDislikedDirectors() : Collections.emptyList())
                .build();
    }
}
