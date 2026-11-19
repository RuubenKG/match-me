package com.matchme.service;

import com.matchme.dto.MatchResultDto;
import com.matchme.dto.MatchUserDto;
import com.matchme.entity.Connection;
import com.matchme.entity.User;
import com.matchme.entity.UserInteraction;
import com.matchme.entity.UserPreferences;
import com.matchme.entity.UserProfile;
import com.matchme.enums.InteractionType;
import com.matchme.repository.UserInteractionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final UserInteractionRepository userInteractionRepository;
    private final UserService userService;
    private final ConnectionService connectionService;

    private User findUserById(Long userId) {
        return userService.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found with ID: " + userId));
    }

    public boolean isRecommended(User currentUser, User targetUser) {
        MatchUserDto currentUserDto = userService.findUserForMatching(currentUser.getId());
        // Allow recommended check to succeed regardless of distance (user might have
        // increased slider temporarily)
        List<ScoredMatch> matches = findMatches(currentUserDto, List.of(targetUser), 1, 0, 20000);
        return !matches.isEmpty();
    }

    public static class ScoredMatch {
        private final User user;
        private final int score;
        private final boolean distanceOk;
        private final Double distance;

        public ScoredMatch(User user, int score, boolean distanceOk, Double distance) {
            this.user = user;
            this.score = score;
            this.distanceOk = distanceOk;
            this.distance = distance;
        }

        public User getUser() {
            return user;
        }

        public int getScore() {
            return score;
        }

        public boolean isDistanceOk() {
            return distanceOk;
        }

        public Double getDistance() {
            return distance;
        }
    }

    public List<ScoredMatch> findMatches(MatchUserDto currentUserDto, List<User> candidates, int limit, int offset,
            Integer maxDistanceOverride) {
        Set<Long> myMovies = Optional.ofNullable(currentUserDto.favoriteMovies()).map(HashSet::new)
                .orElseGet(HashSet::new);
        Set<String> myGenres = Optional.ofNullable(currentUserDto.favoriteGenres()).map(HashSet::new)
                .orElseGet(HashSet::new);
        Set<String> myDecades = Optional.ofNullable(currentUserDto.favoriteDecades()).map(HashSet::new)
                .orElseGet(HashSet::new);
        Set<Long> myActors = Optional.ofNullable(currentUserDto.favoriteActors()).map(HashSet::new)
                .orElseGet(HashSet::new);
        Set<Long> myDirectors = Optional.ofNullable(currentUserDto.favoriteDirectors()).map(HashSet::new)
                .orElseGet(HashSet::new);

        Set<Long> myDislikedMovies = Optional.ofNullable(currentUserDto.dislikedMovies()).map(HashSet::new)
                .orElseGet(HashSet::new);
        Set<String> myDislikedGenres = Optional.ofNullable(currentUserDto.dislikedGenres()).map(HashSet::new)
                .orElseGet(HashSet::new);
        Set<String> myDislikedDecades = Optional.ofNullable(currentUserDto.dislikedDecades()).map(HashSet::new)
                .orElseGet(HashSet::new);
        Set<Long> myDislikedActors = Optional.ofNullable(currentUserDto.dislikedActors()).map(HashSet::new)
                .orElseGet(HashSet::new);
        Set<Long> myDislikedDirectors = Optional.ofNullable(currentUserDto.dislikedDirectors()).map(HashSet::new)
                .orElseGet(HashSet::new);

        int finalMaxDistance = (maxDistanceOverride != null) ? maxDistanceOverride
                : (currentUserDto.maxDistance() != null ? currentUserDto.maxDistance() : 50);

        List<ScoredMatch> scoredMatches = candidates.stream()
                .filter(other -> other.getUserPreferences() != null)
                .map(other -> {
                    UserPreferences candidatePrefs = other.getUserPreferences();
                    UserProfile candidateProfile = other.getUserProfile();

                    Double dist = null;
                    if (currentUserDto.latitude() != null && currentUserDto.longitude() != null
                            && candidateProfile != null && candidateProfile.getLatitude() != null
                            && candidateProfile.getLongitude() != null) {
                        dist = calculateDistance(
                                currentUserDto.latitude(), currentUserDto.longitude(),
                                candidateProfile.getLatitude(), candidateProfile.getLongitude());
                    }

                    int score = computeScore(
                            currentUserDto,
                            candidatePrefs,
                            dist,
                            myMovies, myGenres, myDecades, myActors, myDirectors,
                            myDislikedMovies, myDislikedGenres, myDislikedDecades,
                            myDislikedActors, myDislikedDirectors);

                    // 5001+ km is "Anywhere". If distance is unknown, we allow it.
                    boolean distanceOk = (finalMaxDistance > 5000) || (dist == null) || (dist <= finalMaxDistance);

                    return new ScoredMatch(other, score, distanceOk, dist);
                })
                .filter(match -> match.getScore() > 0)
                .filter(match -> match.isDistanceOk())
                .sorted((a, b) -> Integer.compare(b.getScore(), a.getScore()))
                .collect(Collectors.toList());

        return scoredMatches.stream()
                .skip(offset)
                .limit(limit)
                .collect(Collectors.toList());
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private int computeScore(
            MatchUserDto currentUserDto,
            UserPreferences candidatePrefs,
            Double distance,
            Set<Long> myMovies, Set<String> myGenres, Set<String> myDecades, Set<Long> myActors, Set<Long> myDirectors,
            Set<Long> myDislikedMovies, Set<String> myDislikedGenres, Set<String> myDislikedDecades,
            Set<Long> myDislikedActors, Set<Long> myDislikedDirectors) {

        int score = 0;

        score += calculateIntersectionScore(myMovies, candidatePrefs.getFavoriteMovies(), 5);
        score += calculateIntersectionScore(myGenres, candidatePrefs.getFavoriteGenres(), 3);

        if (currentUserDto.location() != null && currentUserDto.location().equals(candidatePrefs.getLocation())) {
            score += 15;
        }

        score -= calculatePenalty(myDislikedMovies, candidatePrefs.getFavoriteMovies(), 10);
        score -= calculatePenalty(myDislikedGenres, candidatePrefs.getFavoriteGenres(), 5);

        // Distance Penalty: max 5 points. 1 point per 1000km.
        if (distance != null) {
            int distancePenalty = (int) Math.min(distance / 1000, 5);
            score -= distancePenalty;
        }

        return score;
    }

    @Transactional
    public MatchResultDto processLike(Long sourceUserId, Long targetUserId) {
        User sourceUser = findUserById(sourceUserId);
        User targetUser = findUserById(targetUserId);

        userInteractionRepository.findBySourceUserIdAndTargetUserId(sourceUserId, targetUserId)
                .ifPresent(interaction -> {
                    if (interaction.getType() == InteractionType.DECLINE) {
                        interaction.setType(InteractionType.LIKE);
                        userInteractionRepository.save(interaction);
                    }
                });

        if (!userInteractionRepository.findBySourceUserIdAndTargetUserId(sourceUserId, targetUserId).isPresent()) {
            UserInteraction likeInteraction = UserInteraction.builder()
                    .sourceUser(sourceUser)
                    .targetUser(targetUser)
                    .type(InteractionType.LIKE)
                    .build();
            userInteractionRepository.save(likeInteraction);
        }

        boolean targetLikedBack = userInteractionRepository
                .existsBySourceUserIdAndTargetUserIdAndType(
                        targetUserId,
                        sourceUserId,
                        InteractionType.LIKE);

        MatchResultDto.MatchResultDtoBuilder resultBuilder = MatchResultDto.builder()
                .targetUserId(targetUserId);

        if (targetLikedBack) {
            Connection newMatch = connectionService.createMutualMatch(sourceUser, targetUser);

            return resultBuilder
                    .mutualMatch(true)
                    .message("It's a Match!")
                    .matchId(newMatch.getId())
                    .chatId(String.valueOf(targetUserId))
                    .build();
        } else {
            connectionService.createConnectionRequest(sourceUser, targetUser);

            return resultBuilder
                    .mutualMatch(false)
                    .message("Like recorded.")
                    .build();
        }
    }

    @Transactional
    public MatchResultDto processDecline(Long sourceUserId, Long targetUserId) {
        User sourceUser = findUserById(sourceUserId);

        Optional<UserInteraction> existingInteraction = userInteractionRepository
                .findBySourceUserIdAndTargetUserId(sourceUserId, targetUserId);

        if (existingInteraction.isPresent()) {
            UserInteraction interaction = existingInteraction.get();
            interaction.setType(InteractionType.DECLINE);
            userInteractionRepository.save(interaction);
        } else {
            User sourceUserEntity = findUserById(sourceUserId);
            User targetUserEntity = findUserById(targetUserId);

            UserInteraction declineInteraction = UserInteraction.builder()
                    .sourceUser(sourceUserEntity)
                    .targetUser(targetUserEntity)
                    .type(InteractionType.DECLINE)
                    .build();
            userInteractionRepository.save(declineInteraction);
        }

        return MatchResultDto.builder()
                .mutualMatch(false)
                .targetUserId(targetUserId)
                .message("Decline action recorded.")
                .build();
    }

    private <T> int calculateIntersectionScore(Set<T> set1, List<T> list2, int pointsPerMatch) {
        if (set1.isEmpty() || list2 == null || list2.isEmpty())
            return 0;
        int matches = 0;
        for (T item : list2) {
            if (set1.contains(item))
                matches++;
        }
        return matches * pointsPerMatch;
    }

    private <T> int calculatePenalty(Set<T> myDislikedSet, List<T> candidateFavoriteList, int penaltyPerMatch) {
        if (myDislikedSet.isEmpty() || candidateFavoriteList == null || candidateFavoriteList.isEmpty())
            return 0;
        int penalties = 0;
        for (T item : candidateFavoriteList) {
            if (myDislikedSet.contains(item))
                penalties++;
        }
        return penalties * penaltyPerMatch;
    }

}