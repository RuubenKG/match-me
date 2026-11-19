package com.matchme.repository;

import com.matchme.entity.UserInteraction;
import com.matchme.enums.InteractionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserInteractionRepository extends JpaRepository<UserInteraction, Long> {

        /**
         * Finds the IDs of all target users that the source user has already swiped on
         * (Liked or Declined).
         */
        @Query("SELECT ui.targetUser.id FROM UserInteraction ui WHERE ui.sourceUser.id = :sourceId")
        List<Long> findTargetIdsBySourceId(@Param("sourceId") Long sourceId);

        /**
         * Checks if a specific interaction exists (e.g., Target liked Source).
         * 
         * @param sourceUserId The ID of the user who performed the interaction (Target
         *                     User in the "match back" check).
         * @param targetUserId The ID of the user who received the interaction (Source
         *                     User in the "match back" check).
         * @param type         The type of interaction (must be LIKE for a match check).
         * @return true if the interaction exists, false otherwise.
         */
        boolean existsBySourceUserIdAndTargetUserIdAndType(
                        Long sourceUserId,
                        Long targetUserId,
                        InteractionType type);

        @Query("SELECT ui.sourceUser.id FROM UserInteraction ui WHERE ui.targetUser.id = :targetId AND ui.type = :type")
        List<Long> findSourceIdsByTargetIdAndType(@Param("targetId") Long targetId,
                        @Param("type") InteractionType type);

        /**
         * Retrieves a specific interaction, useful for updating a DECLINE to a LIKE if
         * needed.
         */
        Optional<UserInteraction> findBySourceUserIdAndTargetUserId(
                        Long sourceUserId,
                        Long targetUserId);
}
