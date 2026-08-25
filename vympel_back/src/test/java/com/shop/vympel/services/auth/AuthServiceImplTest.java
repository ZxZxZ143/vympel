package com.shop.vympel.services.auth;

import com.shop.vympel.db.repositories.user.RoleRepository;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.db.repositories.user.UserRoleRepository;
import com.shop.vympel.dtos.auth.LoginByEmailRequest;
import com.shop.vympel.mappers.UserMapper;
import com.shop.vympel.security.jwt.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class AuthServiceImplTest {
    @Test
    void absentAccountStillPerformsPasswordHashVerification() {
        UserRepository users = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode(anyString())).thenReturn("dummy-hash");
        when(users.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());
        AuthServiceImpl service = new AuthServiceImpl(
                users,
                mock(UserMapper.class),
                encoder,
                mock(JwtService.class),
                mock(UserRoleRepository.class),
                mock(RoleRepository.class)
        );
        LoginByEmailRequest request = new LoginByEmailRequest();
        request.setEmail("missing@example.com");
        request.setPassword("guess");

        assertThatThrownBy(() -> service.authenticate(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
        verify(encoder).matches("guess", "dummy-hash");
    }
}
