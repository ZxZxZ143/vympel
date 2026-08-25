package com.shop.vympel.dtos.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginByEmailRequest {

    @Email
    @NotBlank
    @Size(max = 255)
    private String email;

    @NotBlank
    @Size(max = 255)
    private String password;
}
