package com.matchme.controller;

import com.matchme.dto.MatchResultDto;
import com.matchme.dto.MatchUserDto;
import com.matchme.entity.User;
import com.matchme.security.UserDetailsImpl;
import com.matchme.service.MatchService;
import com.matchme.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/match")
@RequiredArgsConstructor
public class MatchController {

    private final UserService userService;
    private final MatchService matchService;

    @GetMapping("/me")
    public ResponseEntity<List<Long>> getMatches(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(required = false) Integer maxDistance) {

        Long currentUserId = userDetails.getUserId();

        List<User> candidates = userService.findMatchCandidates(currentUserId);
        MatchUserDto currentUserDto = userService.findUserForMatching(currentUserId);

        List<MatchService.ScoredMatch> scoredMatches = matchService.findMatches(currentUserDto, candidates, limit,
                offset, maxDistance);

        List<Long> response = scoredMatches.stream()
                .map(match -> match.getUser().getId())
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/like/{targetUserId}")
    public ResponseEntity<MatchResultDto> likeUser(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long targetUserId) {

        Long sourceUserId = userDetails.getUserId();

        MatchResultDto result = matchService.processLike(sourceUserId, targetUserId);

        if (result.isMutualMatch()) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        }
    }

    @PostMapping("/decline/{targetUserId}")
    public ResponseEntity<MatchResultDto> declineUser(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long targetUserId) {

        Long sourceUserId = userDetails.getUserId();

        MatchResultDto result = matchService.processDecline(
                sourceUserId,
                targetUserId);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
}