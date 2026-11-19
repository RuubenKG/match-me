package com.matchme.service;

import com.matchme.entity.Connection;
import com.matchme.entity.User;
import com.matchme.enums.ConnectionStatus;
import com.matchme.repository.ConnectionRepository;
import com.matchme.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final ChatMessageService chatMessageService;

    /**
     * Retrieves all User entities that the current user has a 'ACCEPTED' status
     * with.
     */
    @Transactional
    public List<User> getConnectedUsers(Long currentUserId) {
        // Find all connections where user is A or B and status is ACCEPTED
        List<Connection> connections = connectionRepository.findAllConnectionsByUserId(currentUserId);

        return connections.stream()
                .filter(c -> c.getStatus() == ConnectionStatus.ACCEPTED)
                .map(c -> c.getRequester().getId() == currentUserId ? c.getResponder() : c.getRequester())
                .collect(Collectors.toList());
    }

    @Transactional
    public List<User> getPendingRequests(Long currentUserId) {
        User user = userRepository.findById(currentUserId).orElseThrow();
        List<Connection> requests = connectionRepository.findAllByResponderAndStatus(user, ConnectionStatus.PENDING);

        return requests.stream()
                .map(Connection::getRequester)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<User> getPendingOutgoingRequests(Long currentUserId) {
        User user = userRepository.findById(currentUserId).orElseThrow();
        List<Connection> requests = connectionRepository.findAllByRequesterAndStatus(user, ConnectionStatus.PENDING);

        return requests.stream()
                .map(Connection::getResponder)
                .collect(Collectors.toList());
    }

    @Transactional
    public void createConnectionRequest(User requester, User responder) {
        Optional<Connection> existing = connectionRepository.findConnectionBetweenUsers(requester, responder);

        if (existing.isEmpty()) {
            Connection connection = Connection.builder()
                    .requester(requester)
                    .responder(responder)
                    .status(ConnectionStatus.PENDING)
                    .build();
            connectionRepository.save(connection);
        }
    }

    @Transactional
    public void requestConnection(Long requesterId, Long responderId) {
        User req = userRepository.findById(requesterId).orElseThrow();
        User res = userRepository.findById(responderId).orElseThrow();
        createConnectionRequest(req, res);
    }

    @Transactional
    public Connection createMutualMatch(User user1, User user2) {
        Optional<Connection> existing = connectionRepository.findConnectionBetweenUsers(user1, user2);

        if (existing.isPresent()) {
            Connection connection = existing.get();
            connection.setStatus(ConnectionStatus.ACCEPTED);
            return connectionRepository.save(connection);
        } else {
            Connection connection = Connection.builder()
                    .requester(user1)
                    .responder(user2)
                    .status(ConnectionStatus.ACCEPTED)
                    .build();
            Connection saved = connectionRepository.save(connection);

            chatMessageService.sendSystemMessage(user1.getId(), user2.getId(),
                    "CRITICAL: MUTUAL CONNECTION ESTABLISHED.");

            return saved;
        }
    }

    @Transactional
    public void acceptConnection(Long acceptorId, Long requesterId) {
        User acceptor = userRepository.findById(acceptorId).orElseThrow();
        User requester = userRepository.findById(requesterId).orElseThrow();

        Connection connection = connectionRepository.findByRequesterAndResponder(requester, acceptor)
                .orElseThrow(() -> new EntityNotFoundException("No pending request found from user " + requesterId));

        if (connection.getStatus() == ConnectionStatus.PENDING) {
            connection.setStatus(ConnectionStatus.ACCEPTED);
            connectionRepository.save(connection);
            chatMessageService.sendSystemMessage(requesterId, acceptorId, "Connection Accepted!");
        }
    }

    @Transactional
    public void rejectConnection(Long rejectorId, Long requesterId) {
        User rejector = userRepository.findById(rejectorId).orElseThrow();
        User requester = userRepository.findById(requesterId).orElseThrow();

        Connection connection = connectionRepository.findByRequesterAndResponder(requester, rejector)
                .orElseThrow(() -> new EntityNotFoundException("No pending request found"));

        connectionRepository.delete(connection);
    }

    @Transactional
    public void dismissConnection(Long userId, Long targetId) {
        User u1 = userRepository.findById(userId).orElseThrow();
        User u2 = userRepository.findById(targetId).orElseThrow();

        connectionRepository.findConnectionBetweenUsers(u1, u2)
                .ifPresent(connectionRepository::delete);
    }
}