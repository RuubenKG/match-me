package com.matchme.controller;

import com.matchme.dto.ConnectionActionDto;
import com.matchme.entity.User;
import com.matchme.security.UserDetailsImpl;
import com.matchme.service.ConnectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/connections")
@RequiredArgsConstructor
public class ConnectionController {

    private final ConnectionService connectionService;

    // List ACCEPTED connections
    @GetMapping
    public ResponseEntity<List<Long>> getConnectedUsers(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        List<User> users = connectionService.getConnectedUsers(userDetails.getUserId());
        return ResponseEntity.ok(toIds(users));
    }

    // List PENDING requests (incoming)
    @GetMapping("/requests")
    public ResponseEntity<List<Long>> getPendingRequests(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        List<User> users = connectionService.getPendingRequests(userDetails.getUserId());
        return ResponseEntity.ok(toIds(users));
    }

    // List PENDING OUTGOING requests (waiting for response)
    @GetMapping("/outgoing")
    public ResponseEntity<List<Long>> getPendingOutgoingRequests(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        List<User> users = connectionService.getPendingOutgoingRequests(userDetails.getUserId());
        return ResponseEntity.ok(toIds(users));
    }

    // Accept request
    @PostMapping("/accept/{requesterId}")
    public ResponseEntity<Void> acceptConnection(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long requesterId) {

        connectionService.acceptConnection(userDetails.getUserId(), requesterId);
        return ResponseEntity.ok().build();
    }

    // Reject request
    @PostMapping("/reject/{requesterId}")
    public ResponseEntity<Void> rejectConnection(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long requesterId) {

        connectionService.rejectConnection(userDetails.getUserId(), requesterId);
        return ResponseEntity.ok().build();
    }

    // Explicit Request (if not via Swipe)
    @PostMapping("/request")
    public ResponseEntity<Void> requestConnection(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody ConnectionActionDto dto) {

        connectionService.requestConnection(userDetails.getUserId(), dto.getTargetUserId());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // Dismiss/Disconnect
    @DeleteMapping("/{targetId}")
    public ResponseEntity<Void> dismissConnection(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long targetId) {

        connectionService.dismissConnection(userDetails.getUserId(), targetId);
        return ResponseEntity.noContent().build();
    }

    private List<Long> toIds(List<User> users) {
        return users.stream().map(User::getId).collect(Collectors.toList());
    }
}