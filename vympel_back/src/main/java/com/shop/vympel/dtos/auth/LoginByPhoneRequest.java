package com.shop.vympel.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginByPhoneRequest {

    @NotBlank
    @Size(max = 50)
    @Pattern(regexp = "^[+0-9][0-9\\s\\-()]{6,49}$")
    private String phone;

    @NotBlank
    private String password;
}
