package com.matchme.dto;

import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequests {
    @Email
    private String email;
    private String password;
}
