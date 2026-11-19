package com.matchme.repository;

import com.matchme.entity.Connection;
import com.matchme.entity.User;
import com.matchme.enums.ConnectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {

    @Query("SELECT c FROM Connection c WHERE (c.requester = :user OR c.responder = :user) AND c.status = :status")
    List<Connection> findAllByParticipantAndStatus(@Param("user") User user, @Param("status") ConnectionStatus status);

    @Query("SELECT c FROM Connection c WHERE c.requester.id = :userId OR c.responder.id = :userId")
    List<Connection> findAllConnectionsByUserId(@Param("userId") Long userId);

    // For specific pair check
    @Query("SELECT c FROM Connection c WHERE (c.requester = :u1 AND c.responder = :u2) OR (c.requester = :u2 AND c.responder = :u1)")
    Optional<Connection> findConnectionBetweenUsers(@Param("u1") User u1, @Param("u2") User u2);

    List<Connection> findAllByResponderAndStatus(User responder, ConnectionStatus status);

    List<Connection> findAllByRequesterAndStatus(User requester, ConnectionStatus status);

    Optional<Connection> findByRequesterAndResponder(User requester, User responder);
}
