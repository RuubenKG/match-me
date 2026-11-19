package com.matchme.repository;

import com.matchme.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

        @Query("SELECT u FROM User u " +
                        "LEFT JOIN FETCH u.userProfile up " +
                        "LEFT JOIN FETCH u.userPreferences upref " +
                        "WHERE LOWER(u.email) = LOWER(:email)")
        Optional<User> findByEmail(@Param("email") String email);

        @Query("SELECT COUNT(u) > 0 FROM User u WHERE LOWER(u.email) = LOWER(:email)")
        boolean existsByEmail(@Param("email") String email);

        @Query("SELECT u FROM User u " +
                        "LEFT JOIN FETCH u.userProfile up " +
                        "LEFT JOIN FETCH u.userPreferences upref " +
                        "WHERE u.id = :userId")
        Optional<User> findByIdEagerly(@Param("userId") Long userId);

        @Query("SELECT DISTINCT u FROM User u " +
                        "LEFT JOIN FETCH u.userProfile up " +
                        "LEFT JOIN FETCH u.userPreferences upref " +
                        "WHERE u.id != :currentUserId AND u.id NOT IN :excludedIds")
        List<User> findCandidatesForMatching(
                        @Param("currentUserId") Long currentUserId,
                        @Param("excludedIds") List<Long> excludedIds);

        // This custom query ensures the related UserProfile is loaded in the same
        // transaction
        @Query("SELECT u FROM User u LEFT JOIN FETCH u.userProfile WHERE u.id IN :ids")
        List<User> findAllByIdsEagerly(@Param("ids") List<Long> ids);
}