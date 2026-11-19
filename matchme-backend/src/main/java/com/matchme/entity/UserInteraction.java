
package com.matchme.entity;

import com.matchme.enums.InteractionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_interaction",
        // Ensure one user can only interact with another user once
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"source_user_id", "target_user_id"})
        })
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class UserInteraction {



    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The user performing the action (swiping/liking/declining)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_user_id", nullable = false)
    private User sourceUser;

    // The user being acted upon (the one who was swiped on)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id", nullable = false)
    private User targetUser;

    // The type of interaction (LIKE or DECLINE)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InteractionType type;

    // When the interaction happened
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();


}