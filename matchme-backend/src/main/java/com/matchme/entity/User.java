package com.matchme.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.matchme.enums.Role;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder(toBuilder = true)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode
@ToString
public class User {
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Email
    @Column(unique = true, nullable = false)
    private String email;

    @Size(min = 8, message = "Password must be at least 8 characters")
    @Column(nullable = false)
    private String password;

    @Pattern(regexp = ".*\\S.*", message = "Username cannot be blank or whitespace")
    @Column(unique = true, nullable = false)
    private String username;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonManagedReference
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private UserProfile userProfile;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private UserPreferences userPreferences;

    @Builder.Default
    @Column(name = "is_online")
    private boolean isOnline = false;

    @Column(name = "last_seen")
    private java.time.LocalDateTime lastSeen;

    public boolean isAdmin() {
        return this.role == Role.ADMIN;
    }
}
