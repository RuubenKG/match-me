package com.matchme.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class UserProfileInfoDto {
    private Long id;
    private String email;
    private String bio; // About me
    private String location;
    private Double latitude;
    private Double longitude;
    // Add other "About me" fields here if added to Entity (e.g., job, education)
}
