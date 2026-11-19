package com.matchme.controller;

import com.matchme.dto.*;
import com.matchme.entity.*;
import com.matchme.security.*;
import com.matchme.service.*;
import com.matchme.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.graphql.data.method.annotation.SubscriptionMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
public class GraphQLController {

    private final UserService userService;
    private final ConnectionService connectionService;
    private final ChatMessageService chatMessageService;
    private final MatchService matchService;
    private final MovieService movieService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final TokenBlacklist tokenBlacklist;

    // Sink for broadcasting new messages to subscribers
    private final Sinks.Many<ChatMessage> messageSink = Sinks.many().multicast().directBestEffort();

    // --- Basic Queries ---

    @QueryMapping
    public User user(@Argument Long id) {
        return userService.findById(id).orElse(null);
    }

    @QueryMapping
    public UserProfile bio(@Argument Long id) {
        return userService.findById(id)
                .map(User::getUserProfile)
                .orElse(null);
    }

    @QueryMapping
    public UserProfile profile(@Argument Long id) {
        return userService.findById(id)
                .map(User::getUserProfile)
                .orElse(null);
    }

    // --- Context Queries ---

    @QueryMapping
    public User me(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return null;
        return userService.findById(userDetails.getUserId()).orElse(null);
    }

    @QueryMapping
    public UserProfile myBio(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return null;
        return userService.findById(userDetails.getUserId())
                .map(User::getUserProfile)
                .orElse(null);
    }

    @QueryMapping
    public UserProfile myProfile(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return null;
        return userService.findById(userDetails.getUserId())
                .map(User::getUserProfile)
                .orElse(null);
    }

    // --- Social/Matching Queries ---

    @QueryMapping
    public List<User> recommendations(@Argument Integer limit, @Argument Integer offset, @Argument Integer maxDistance,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return List.of();

        List<User> candidates = userService.findMatchCandidates(userDetails.getUserId());
        MatchUserDto currentUserDto = userService.findUserForMatching(userDetails.getUserId());

        return matchService.findMatches(currentUserDto, candidates,
                limit != null ? limit : 10,
                offset != null ? offset : 0,
                maxDistance)
                .stream()
                .map(MatchService.ScoredMatch::getUser)
                .collect(Collectors.toList());
    }

    @QueryMapping
    public List<User> connections(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return List.of();
        return connectionService.getConnectedUsers(userDetails.getUserId());
    }

    @QueryMapping
    public List<User> incomingRequests(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return List.of();
        return connectionService.getPendingRequests(userDetails.getUserId());
    }

    @QueryMapping
    public List<User> outgoingRequests(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return List.of();
        return connectionService.getPendingOutgoingRequests(userDetails.getUserId());
    }

    // --- Chat Queries ---

    @QueryMapping
    public List<ChatSummaryDto> chatList(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return List.of();
        return chatMessageService.getUserChatList(userDetails.getUserId());
    }

    @QueryMapping
    public List<ChatMessageDto> chatMessages(@Argument Long partnerId, @Argument Integer page, @Argument Integer size,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return List.of();
        return chatMessageService.getMessagesPaginated(userDetails.getUserId(), partnerId,
                page != null ? page : 0,
                size != null ? size : 20);
    }

    @QueryMapping
    public Long unreadCount(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return 0L;
        return chatMessageService.getUnreadCount(userDetails.getUserId());
    }

    // --- Movie/Actor Queries ---

    @QueryMapping
    public List<Map<String, Object>> searchMovies(@Argument String query) {
        Map<String, Object> result = movieService.searchMovie(query);
        return (List<Map<String, Object>>) result.get("results");
    }

    @QueryMapping
    public List<Map<String, Object>> searchActors(@Argument String query) {
        Map<String, Object> result = movieService.searchActor(query);
        return (List<Map<String, Object>>) result.get("results");
    }

    @QueryMapping
    public Map<String, Object> movieDetails(@Argument Long id) {
        return movieService.getMovieDetails(id);
    }

    @QueryMapping
    public Map<String, Object> actorDetails(@Argument Long id) {
        return movieService.getActorDetails(id);
    }

    // --- Mutations ---

    @MutationMapping
    public AuthResponse login(@Argument String email, @Argument String password) {
        String lowerEmail = email.toLowerCase();
        User user = userService.findByEmail(lowerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Incorrect password");
        }

        String token = jwtUtil.generateToken(user.getEmail().toLowerCase());
        return new AuthResponse(token, String.valueOf(user.getId()));
    }

    @MutationMapping
    public String logout(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return "Logged out successfully";
    }

    @MutationMapping
    public String registerUser(@Argument UserRegistrationInput input) {
        UserRegistrationDto dto = new UserRegistrationDto(
                input.getFirstName(), input.getLastName(), input.getUsername(),
                input.getEmail(), input.getPassword(),
                java.time.LocalDate.parse(input.getDateOfBirth()));
        userService.registerUser(dto);
        return "User registered successfully";
    }

    @MutationMapping
    public User updateMyProfile(@Argument ProfileUpdateInput input,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return null;

        UserProfileUpdateDto dto = new UserProfileUpdateDto();
        dto.setFirstName(input.getFirstName());
        dto.setLastName(input.getLastName());
        dto.setUsername(input.getUsername());
        dto.setEmail(input.getEmail());
        dto.setBio(input.getBio());
        dto.setLocation(input.getLocation());
        dto.setLatitude(input.getLatitude());
        dto.setLongitude(input.getLongitude());
        dto.setFavoriteGenres(input.getFavoriteGenres());
        dto.setDislikedGenres(input.getDislikedGenres());
        dto.setFavoriteMovies(input.getFavoriteMovies());
        dto.setFavoriteActors(input.getFavoriteActors());
        dto.setFavoriteDirectors(input.getFavoriteDirectors());

        return userService.updateUserProfile(userDetails.getUserId(), dto, null);
    }

    @MutationMapping
    public ChatMessageDto sendMessage(@Argument Long recipientId, @Argument String content,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            throw new IllegalStateException(
                    "You must be authenticated to send messages. Please provide a Bearer token in the Authorization header.");
        }

        SendMessageRequest request = new SendMessageRequest();
        request.setRecipientId(recipientId);
        request.setContent(content);

        ChatMessageDto dto = chatMessageService.saveMessage(request, userDetails.getUserId());

        // Use the saved data to publish to subscriptions (converted to DTO)
        User sender = userService.findById(userDetails.getUserId()).get();
        User recipient = userService.findById(recipientId).get();

        ChatMessage message = ChatMessage.builder()
                .id(dto.getId())
                .sender(sender)
                .recipient(recipient)
                .content(content)
                .timestamp(LocalDateTime.now())
                .isRead(false)
                .build();

        publishMessage(message);
        return dto;
    }

    @MutationMapping
    public Boolean markChatAsRead(@Argument Long partnerId, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return false;
        chatMessageService.markChatAsRead(userDetails.getUserId(), partnerId);
        return true;
    }

    @MutationMapping
    public Boolean requestConnection(@Argument Long targetUserId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return false;
        connectionService.requestConnection(userDetails.getUserId(), targetUserId);
        return true;
    }

    @MutationMapping
    public Boolean acceptConnection(@Argument Long requesterId, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return false;
        connectionService.acceptConnection(userDetails.getUserId(), requesterId);
        return true;
    }

    @MutationMapping
    public Boolean rejectConnection(@Argument Long requesterId, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return false;
        connectionService.rejectConnection(userDetails.getUserId(), requesterId);
        return true;
    }

    @MutationMapping
    public Boolean dismissConnection(@Argument Long targetId, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return false;
        connectionService.dismissConnection(userDetails.getUserId(), targetId);
        return true;
    }

    @MutationMapping
    public MatchResultDto likeUser(@Argument Long targetUserId, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return null;
        return matchService.processLike(userDetails.getUserId(), targetUserId);
    }

    @MutationMapping
    public MatchResultDto declineUser(@Argument Long targetUserId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return null;
        return matchService.processDecline(userDetails.getUserId(), targetUserId);
    }

    @MutationMapping
    public UserProfile updateBio(@Argument String text, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null)
            return null;
        User user = userService.findById(userDetails.getUserId()).orElseThrow();
        UserProfile profile = userService.getOrCreateUserProfile(user);
        profile.setBio(text);
        userService.saveUser(user);
        return profile;
    }

    // --- Field Resolvers ---

    @SchemaMapping(typeName = "User", field = "bio")
    public UserProfile getUserBio(User user) {
        return user.getUserProfile();
    }

    @SchemaMapping(typeName = "User", field = "profile")
    public UserProfile getUserProfile(User user) {
        return user.getUserProfile();
    }

    @SchemaMapping(typeName = "Bio", field = "text")
    public String getBioText(UserProfile profile) {
        return profile.getBio();
    }

    @SchemaMapping(typeName = "Bio", field = "user")
    public User getBioUser(UserProfile profile) {
        return profile.getUser();
    }

    @SchemaMapping(typeName = "Profile", field = "user")
    public User getProfileUser(UserProfile profile) {
        return profile.getUser();
    }

    @SchemaMapping(typeName = "ChatSummary", field = "updatedAt")
    public String getChatSummaryUpdatedAt(ChatSummaryDto summary) {
        return (summary.getUpdatedAt() != null) ? summary.getUpdatedAt().toString() : null;
    }

    @SchemaMapping(typeName = "ChatMessage", field = "timestamp")
    public String getTimestamp(ChatMessageDto message) {
        return (message.getTimestamp() != null) ? message.getTimestamp().toString() : null;
    }

    @SchemaMapping(typeName = "MatchResult", field = "mutualMatch")
    public boolean getMutualMatch(MatchResultDto dto) {
        return dto.isMutualMatch();
    }

    // TMDb Field Mappings for Movie/Actor

    @SchemaMapping(typeName = "Movie", field = "releaseDate")
    public String getReleaseDate(Map<String, Object> movie) {
        Object date = movie.getOrDefault("release_date", movie.get("first_air_date"));
        return date != null ? date.toString() : null;
    }

    @SchemaMapping(typeName = "Movie", field = "posterPath")
    public String getPosterPath(Map<String, Object> movie) {
        Object path = movie.get("poster_path");
        return path != null ? path.toString() : null;
    }

    @SchemaMapping(typeName = "Actor", field = "profilePath")
    public String getProfilePath(Map<String, Object> actor) {
        Object path = actor.get("profile_path");
        return path != null ? path.toString() : null;
    }

    // --- Subscriptions ---

    @SubscriptionMapping
    public Flux<ChatMessageDto> newMessage() {
        return messageSink.asFlux().map(chatMessageService::toDto);
    }

    public void publishMessage(ChatMessage message) {
        messageSink.tryEmitNext(message);
    }

    // --- Inner Helper Types ---

    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class AuthResponse {
        private String token;
        private String userId;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UserRegistrationInput {
        private String firstName;
        private String lastName;
        private String username;
        private String email;
        private String password;
        private String dateOfBirth;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ProfileUpdateInput {
        private String firstName;
        private String lastName;
        private String username;
        private String email;
        private String bio;
        private String location;
        private Double latitude;
        private Double longitude;
        private List<String> favoriteGenres;
        private List<String> dislikedGenres;
        private List<Long> favoriteActors;
        private List<Long> favoriteDirectors;
        private List<Long> favoriteMovies;
    }
}
