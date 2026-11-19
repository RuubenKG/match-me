package com.matchme.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@Builder(toBuilder = true)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class UserProfile {

    @Id
    private Long id;

    private String firstName;
    private String lastName;
    private Double longitude;
    private Double latitude;
    private String location;

    private LocalDate dateOfBirth;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String profilePictureUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @Builder.Default
    private List<String> interests = new java.util.ArrayList<>();

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    @JsonBackReference
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;
}
