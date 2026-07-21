package com.shop.vympel.dtos.auth;

import lombok.Data;

@Data
public class UserResponse {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private Boolean enabled;
}

