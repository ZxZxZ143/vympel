package com.shop.vympel.bootstrap.admin;

import com.shop.vympel.db.entity.auth.Role;
import com.shop.vympel.db.entity.auth.User;
import com.shop.vympel.db.entity.auth.UserRole;
import com.shop.vympel.db.repositories.user.RoleRepository;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.db.repositories.user.UserRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocalAdminBootstrapServiceTest {
    private static final String EMAIL = "Local.Admin@Vympel.Test";
    private static final String NORMALIZED_EMAIL = "local.admin@vympel.test";
    private static final String PASSWORD = "StrongLocal_2026_Admin9!";
    private static final String ENCODED_PASSWORD = "$2a$10$encoded-password-marker";

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private UserRoleRepository userRoleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private LocalAdminBootstrapService service;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        service = new LocalAdminBootstrapService(
                userRepository,
                roleRepository,
                userRoleRepository,
                passwordEncoder
        );
        adminRole = role(1L, "ADMIN");
    }

    @Test
    void createsActiveAdminWithEncodedPasswordAndNormalizedEmail() {
        BootstrapAdminProperties properties = enabledProperties();
        when(roleRepository.findByCodeAndActiveTrue("ADMIN")).thenReturn(Optional.of(adminRole));
        when(userRepository.findByEmailIgnoreCase(NORMALIZED_EMAIL)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(PASSWORD)).thenReturn(ENCODED_PASSWORD);
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(42L);
            return user;
        });
        when(userRoleRepository.saveAndFlush(any(UserRole.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LocalAdminBootstrapService.BootstrapResult result = service.bootstrap(properties);

        assertEquals(LocalAdminBootstrapService.BootstrapResult.CREATED, result);
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals(NORMALIZED_EMAIL, savedUser.getEmail());
        assertEquals(ENCODED_PASSWORD, savedUser.getPasswordHash());
        assertEquals("Local Administrator", savedUser.getFirstName());
        assertTrue(savedUser.getEnabled());

        ArgumentCaptor<UserRole> roleCaptor = ArgumentCaptor.forClass(UserRole.class);
        verify(userRoleRepository).saveAndFlush(roleCaptor.capture());
        assertSame(savedUser, roleCaptor.getValue().getUser());
        assertSame(adminRole, roleCaptor.getValue().getRole());
        verify(passwordEncoder).encode(PASSWORD);
    }

    @Test
    void repeatedBootstrapCreatesOnceAndDoesNotResetPassword() {
        BootstrapAdminProperties properties = enabledProperties();
        AtomicReference<User> saved = new AtomicReference<>();
        when(roleRepository.findByCodeAndActiveTrue("ADMIN")).thenReturn(Optional.of(adminRole));
        when(userRepository.findByEmailIgnoreCase(NORMALIZED_EMAIL))
                .thenAnswer(invocation -> Optional.ofNullable(saved.get()));
        when(passwordEncoder.encode(PASSWORD)).thenReturn(ENCODED_PASSWORD);
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(42L);
            saved.set(user);
            return user;
        });
        when(userRoleRepository.saveAndFlush(any(UserRole.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRoleRepository.findByUserId(42L))
                .thenAnswer(invocation -> List.of(UserRole.of(saved.get(), adminRole)));

        assertEquals(LocalAdminBootstrapService.BootstrapResult.CREATED, service.bootstrap(properties));
        assertEquals(LocalAdminBootstrapService.BootstrapResult.EXISTING_ADMIN, service.bootstrap(properties));

        verify(passwordEncoder).encode(PASSWORD);
        verify(userRepository).saveAndFlush(any(User.class));
        verify(userRoleRepository).saveAndFlush(any(UserRole.class));
    }

    @Test
    void existingAdminCausesNoWriteAndNoPasswordReset() {
        BootstrapAdminProperties properties = enabledProperties();
        User existing = user(7L, NORMALIZED_EMAIL);
        when(roleRepository.findByCodeAndActiveTrue("ADMIN")).thenReturn(Optional.of(adminRole));
        when(userRepository.findByEmailIgnoreCase(NORMALIZED_EMAIL)).thenReturn(Optional.of(existing));
        when(userRoleRepository.findByUserId(7L)).thenReturn(List.of(UserRole.of(existing, adminRole)));

        assertEquals(LocalAdminBootstrapService.BootstrapResult.EXISTING_ADMIN, service.bootstrap(properties));

        verify(userRepository, never()).saveAndFlush(any(User.class));
        verify(userRoleRepository, never()).saveAndFlush(any(UserRole.class));
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void existingNonAdminWithSameEmailFailsWithoutPromotion() {
        BootstrapAdminProperties properties = enabledProperties();
        User existing = user(8L, NORMALIZED_EMAIL);
        Role manager = role(3L, "MANAGER");
        when(roleRepository.findByCodeAndActiveTrue("ADMIN")).thenReturn(Optional.of(adminRole));
        when(userRepository.findByEmailIgnoreCase(NORMALIZED_EMAIL)).thenReturn(Optional.of(existing));
        when(userRoleRepository.findByUserId(8L)).thenReturn(List.of(UserRole.of(existing, manager)));

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> service.bootstrap(properties)
        );

        assertTrue(exception.getMessage().contains("non-admin"));
        verify(userRepository, never()).saveAndFlush(any(User.class));
        verify(userRoleRepository, never()).saveAndFlush(any(UserRole.class));
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void missingAdminRoleFailsBeforeUserCreation() {
        when(roleRepository.findByCodeAndActiveTrue("ADMIN")).thenReturn(Optional.empty());

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> service.bootstrap(enabledProperties())
        );

        assertTrue(exception.getMessage().contains("Active ADMIN role"));
        verifyNoInteractions(userRepository, userRoleRepository, passwordEncoder);
    }

    private BootstrapAdminProperties enabledProperties() {
        BootstrapAdminProperties properties = new BootstrapAdminProperties();
        properties.setEnabled(true);
        properties.setEmail(EMAIL);
        properties.setPassword(PASSWORD);
        properties.setName("  Local Administrator  ");
        return properties;
    }

    private User user(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setPasswordHash(ENCODED_PASSWORD);
        user.setEnabled(Boolean.TRUE);
        return user;
    }

    private Role role(Long id, String code) {
        Role role = new Role();
        role.setId(id);
        role.setCode(code);
        role.setActive(Boolean.TRUE);
        return role;
    }
}
