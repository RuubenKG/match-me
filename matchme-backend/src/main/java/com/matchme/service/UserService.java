package com.matchme.service;

import com.matchme.dto.MatchUserDto;
import com.matchme.enums.InteractionType;
import com.matchme.enums.Role;
import com.matchme.dto.UserProfileUpdateDto;
import com.matchme.dto.UserRegistrationDto;
import com.matchme.entity.User;
import com.matchme.entity.UserPreferences;
import com.matchme.entity.UserProfile;
import com.matchme.exception.ConflictException;
import com.matchme.exception.NotFoundException;
import com.matchme.repository.UserInteractionRepository;
import com.matchme.repository.UserRepository;
import com.matchme.security.UserDetailsImpl;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.*;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserInteractionRepository userInteractionRepository;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            UserInteractionRepository userInteractionRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userInteractionRepository = userInteractionRepository;
    }

    public List<User> findMatchCandidates(Long currentUserId) {

        List<Long> swipedByMe = userInteractionRepository.findTargetIdsBySourceId(currentUserId);
        List<Long> declinedMe = userInteractionRepository.findSourceIdsByTargetIdAndType(currentUserId,
                InteractionType.DECLINE);

        Set<Long> excludedIdsSet = new HashSet<>(swipedByMe);
        excludedIdsSet.addAll(declinedMe); // Exclude people who already declined me
        excludedIdsSet.add(currentUserId);

        List<Long> finalExcludedIds = excludedIdsSet.stream().toList();

        return userRepository.findCandidatesForMatching(currentUserId, finalExcludedIds);
    }

    @Transactional
    public MatchUserDto findUserForMatching(Long currentUserId) {
        User user = userRepository.findByIdEagerly(currentUserId)
                .orElseThrow(() -> new NotFoundException("User not found for matching."));

        UserPreferences prefs = user.getUserPreferences();

        if (prefs == null) {
            return new MatchUserDto(user.getId(), null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null);
        }

        UserProfile profile = user.getUserProfile();

        return new MatchUserDto(
                user.getId(),

                // --- Favorite Lists ---
                prefs.getFavoriteMovies(),
                prefs.getFavoriteGenres(),
                prefs.getFavoriteDecades(),
                prefs.getFavoriteActors(),
                prefs.getFavoriteDirectors(),

                // --- Disliked Lists ---
                prefs.getDislikedMovies(),
                prefs.getDislikedGenres(),
                prefs.getDislikedDecades(),
                prefs.getDislikedActors(),
                prefs.getDislikedDirectors(),

                // --- Location ---
                prefs.getLocation(),
                profile != null ? profile.getLatitude() : null,
                profile != null ? profile.getLongitude() : null,
                prefs.getMaxDistance());
    }

    public User saveUser(User user) {
        String rawPassword = user.getPassword();
        String hashedPassword = passwordEncoder.encode(rawPassword);
        user.setPassword(hashedPassword);

        return userRepository.save(user);
    }

    @Transactional
    public User registerUser(UserRegistrationDto dto) {
        String lowerEmail = dto.getEmail().toLowerCase();
        if (existsByEmail(lowerEmail)) {
            throw new ConflictException("Email already in use");
        }

        User user = User.builder()
                .email(lowerEmail)
                .username(dto.getUsername())
                .password(passwordEncoder.encode(dto.getPassword()))
                .role(Role.USER)
                .build();

        UserProfile profile = UserProfile.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .dateOfBirth(dto.getDateOfBirth())
                .user(user)
                .build();

        user.setUserProfile(profile);

        return userRepository.save(user);
    }

    public UserProfile getOrCreateUserProfile(User user) {
        if (user.getUserProfile() == null) {
            UserProfile userProfile = UserProfile.builder()
                    .user(user)
                    .build();

            user.setUserProfile(userProfile);
        }
        return user.getUserProfile();
    }

    @Transactional
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Username not found"));

        return new UserDetailsImpl(user);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public UserPreferences getOrCreateUserPreferences(User user) {
        if (user.getUserPreferences() == null) {
            UserPreferences prefs = new UserPreferences();
            prefs.setUser(user);
            // Initialize lists to prevent future NullPointerExceptions
            prefs.setFavoriteMovies(new ArrayList<>());
            prefs.setDislikedMovies(new ArrayList<>());
            prefs.setFavoriteActors(new ArrayList<>());
            prefs.setDislikedActors(new ArrayList<>());
            prefs.setFavoriteDirectors(new ArrayList<>());
            prefs.setDislikedDirectors(new ArrayList<>());
            prefs.setFavoriteDecades(new ArrayList<>());
            prefs.setDislikedDecades(new ArrayList<>());
            prefs.setWatchlist(new ArrayList<>());
            user.setUserPreferences(prefs);
        }
        return user.getUserPreferences();
    }

    @Transactional
    public User updateUserProfile(Long id, UserProfileUpdateDto dto, MultipartFile imageFile) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        UserProfile profile = getOrCreateUserProfile(user);
        UserPreferences prefs = getOrCreateUserPreferences(user);

        // --- 1. Handle the physical file ---
        if (dto.getRemovePhoto() != null && dto.getRemovePhoto()) {
            profile.setProfilePictureUrl(null);
        } else if (imageFile != null && !imageFile.isEmpty()) {
            try {
                // Folder where images will live
                String uploadDir = "user-photos/";
                Path uploadPath = Paths.get(uploadDir);
                if (!Files.exists(uploadPath))
                    Files.createDirectories(uploadPath);

                // Generate randomized filename: UUID + extension
                String originalName = imageFile.getOriginalFilename();
                String extension = originalName != null ? originalName.substring(originalName.lastIndexOf("."))
                        : ".jpg";
                String randomFilename = UUID.randomUUID().toString() + extension;

                // Save the file to the 'user-photos' directory
                Path filePath = uploadPath.resolve(randomFilename);
                Files.copy(imageFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                // Save ONLY the filename string to the database
                profile.setProfilePictureUrl(randomFilename);

            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save profile picture.");
            }
        }

        if (dto.getDateOfBirth() != null && dto.getDateOfBirth().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date of birth cannot be in the future");
        }
        if (dto.getUsername() != null && dto.getUsername().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username cannot be empty");
        }

        // --- personal info ---
        if (dto.getFirstName() != null)
            profile.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null)
            profile.setLastName(dto.getLastName());
        if (dto.getDateOfBirth() != null)
            profile.setDateOfBirth(dto.getDateOfBirth());
        if (dto.getBio() != null)
            profile.setBio(dto.getBio());
        if (dto.getProfilePictureUrl() != null)
            profile.setProfilePictureUrl(dto.getProfilePictureUrl());
        if (dto.getLongitude() != null)
            profile.setLongitude(dto.getLongitude());
        if (dto.getLatitude() != null)
            profile.setLatitude(dto.getLatitude());
        if (dto.getLocation() != null)
            profile.setLocation(dto.getLocation());

        // --- account info ---
        if (dto.getUsername() != null)
            user.setUsername(dto.getUsername());
        if (dto.getPassword() != null)
            user.setPassword(passwordEncoder.encode(dto.getPassword()));

        // --- user preferences ---
        if (dto.getFavoriteMovies() != null)
            prefs.setFavoriteMovies(dto.getFavoriteMovies());
        if (dto.getDislikedMovies() != null)
            prefs.setDislikedMovies(dto.getDislikedMovies());
        if (dto.getFavoriteActors() != null)
            prefs.setFavoriteActors(dto.getFavoriteActors());
        if (dto.getDislikedActors() != null)
            prefs.setDislikedActors(dto.getDislikedActors());
        if (dto.getFavoriteDirectors() != null)
            prefs.setFavoriteDirectors(dto.getFavoriteDirectors());
        if (dto.getDislikedDirectors() != null)
            prefs.setDislikedDirectors(dto.getDislikedDirectors());
        if (dto.getWatchlist() != null)
            prefs.setWatchlist(dto.getWatchlist());
        if (dto.getFavoriteDecades() != null)
            prefs.setFavoriteDecades(dto.getFavoriteDecades());
        if (dto.getDislikedDecades() != null)
            prefs.setDislikedDecades(dto.getDislikedDecades());
        if (dto.getFavoriteGenres() != null)
            prefs.setFavoriteGenres(dto.getFavoriteGenres());
        if (dto.getDislikedGenres() != null)
            prefs.setDislikedGenres(dto.getDislikedGenres());
        if (dto.getMaxDistance() != null)
            prefs.setMaxDistance(dto.getMaxDistance());

        if (dto.getEmail() != null && !dto.getEmail().equals(user.getEmail())) {
            if (existsByEmail(dto.getEmail())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already in use");
            }
            user.setEmail(dto.getEmail());
        }

        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (id == null || !userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found");
        }
        userRepository.deleteById(id);
    }

    @Transactional
    public void updateStatus(Long userId, boolean isOnline) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setOnline(isOnline);
            if (!isOnline) {
                user.setLastSeen(java.time.LocalDateTime.now());
            }
            userRepository.save(user);
        });
    }

}
