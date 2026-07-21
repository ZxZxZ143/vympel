package com.shop.vympel.mappers;

import com.shop.vympel.db.entity.auth.User;
import com.shop.vympel.dtos.auth.RegisterByEmailRequest;
import com.shop.vympel.dtos.auth.RegisterByPhoneRequest;
import org.mapstruct.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;

@Mapper(componentModel = "spring")
public abstract class UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "enabled", constant = "true")
    @Mapping(target = "createdAt", expression = "java(java.time.Instant.now())")
    @Mapping(target = "updatedAt", expression = "java(java.time.Instant.now())")
    @Mapping(target="email", source="email", qualifiedByName="normalizeEmail")
    public abstract User toEntity(RegisterByEmailRequest req, @Context PasswordEncoder encoder);

    @AfterMapping
    protected void afterEmail(RegisterByEmailRequest req,
                              @MappingTarget User user,
                              @Context PasswordEncoder encoder) {
        user.setPasswordHash(encoder.encode(req.getPassword()));
        user.setEnabled(true);

        Instant now = Instant.now();
        if (user.getCreatedAt() == null) user.setCreatedAt(now);
        user.setUpdatedAt(now);
    }

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "enabled", constant = "true")
    @Mapping(target = "createdAt", expression = "java(java.time.Instant.now())")
    @Mapping(target = "updatedAt", expression = "java(java.time.Instant.now())")
    @Mapping(target="phone", source="phone", qualifiedByName="normalizePhone")
    public abstract User toEntity(RegisterByPhoneRequest req, @Context PasswordEncoder encoder);

    @AfterMapping
    protected void afterPhone(RegisterByPhoneRequest req,
                              @MappingTarget User user,
                              @Context PasswordEncoder encoder) {
        user.setPasswordHash(encoder.encode(req.getPassword()));
        user.setEnabled(true);

        Instant now = Instant.now();
        if (user.getCreatedAt() == null) user.setCreatedAt(now);
        user.setUpdatedAt(now);
    }

    @Named("normalizeEmail")
    protected String normalizeEmail(String email) {
        if (email == null) return null;
        String v = email.trim().toLowerCase();
        return v.isBlank() ? null : v;
    }

    @Named("normalizePhone")
    protected String normalizePhone(String phone) {
        if (phone == null) return null;
        String v = phone.trim();
        return v.isBlank() ? null : v;
    }
}

