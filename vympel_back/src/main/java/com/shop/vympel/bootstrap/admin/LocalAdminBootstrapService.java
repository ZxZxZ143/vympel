package com.shop.vympel.bootstrap.admin;

import com.shop.vympel.db.entity.auth.Role;
import com.shop.vympel.db.entity.auth.User;
import com.shop.vympel.db.entity.auth.UserRole;
import com.shop.vympel.db.repositories.user.RoleRepository;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.db.repositories.user.UserRoleRepository;
import com.shop.vympel.enums.RoleCode;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("local")
public class LocalAdminBootstrapService {
    private static final String ADMIN_ROLE = RoleCode.ADMIN.name();

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    public LocalAdminBootstrapService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public BootstrapResult bootstrap(BootstrapAdminProperties properties) {
        properties.validateForEnabledBootstrap();
        String normalizedEmail = properties.normalizedEmail();
        Role adminRole = requireAdminRole();

        User existingUser = userRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        if (existingUser != null) {
            ensureExistingUserIsAdmin(existingUser);
            return BootstrapResult.EXISTING_ADMIN;
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(properties.getPassword()));
        user.setFirstName(properties.normalizedName());
        user.setEnabled(Boolean.TRUE);

        User savedUser = userRepository.saveAndFlush(user);
        userRoleRepository.saveAndFlush(UserRole.of(savedUser, adminRole));
        return BootstrapResult.CREATED;
    }

    @Transactional(readOnly = true)
    public BootstrapResult resolveAfterConcurrentConflict(String normalizedEmail) {
        requireAdminRole();
        User existingUser = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new IllegalStateException(
                        "Local ADMIN bootstrap encountered a database conflict without an existing account"
                ));
        ensureExistingUserIsAdmin(existingUser);
        return BootstrapResult.EXISTING_ADMIN;
    }

    private Role requireAdminRole() {
        return roleRepository.findByCodeAndActiveTrue(ADMIN_ROLE)
                .orElseThrow(() -> new IllegalStateException("Active ADMIN role is required for local bootstrap"));
    }

    private void ensureExistingUserIsAdmin(User user) {
        boolean isAdmin = userRoleRepository.findByUserId(user.getId()).stream()
                .anyMatch(userRole -> ADMIN_ROLE.equals(userRole.getRole().getCode()));
        if (!isAdmin) {
            throw new IllegalStateException(
                    "Configured local ADMIN bootstrap email already belongs to a non-admin account"
            );
        }
    }

    public enum BootstrapResult {
        CREATED,
        EXISTING_ADMIN
    }
}
