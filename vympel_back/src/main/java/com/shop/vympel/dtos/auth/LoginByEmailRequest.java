package com.shop.vympel.dtos.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginByEmailRequest {

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;
}
