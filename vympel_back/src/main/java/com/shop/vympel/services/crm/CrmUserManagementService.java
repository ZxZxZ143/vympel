package com.shop.vympel.services.crm;

import com.shop.vympel.db.entity.auth.Role;
import com.shop.vympel.db.entity.auth.User;
import com.shop.vympel.db.entity.auth.UserRole;
import com.shop.vympel.db.repositories.user.RoleRepository;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.db.repositories.user.UserRoleRepository;
import com.shop.vympel.dtos.crm.CrmManagedUserResponse;
import com.shop.vympel.dtos.crm.CrmRoleResponse;
import com.shop.vympel.dtos.crm.CrmUserCreateRequest;
import com.shop.vympel.dtos.crm.CrmUserUpdateRequest;
import com.shop.vympel.enums.RoleCode;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.services.auth.CrmSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CrmUserManagementService {
    private static final String DEFAULT_ADMIN_CREATED_ROLE = "MANAGER";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final CrmSessionService crmSessionService;

    @Transactional(readOnly = true)
    public Page<CrmManagedUserResponse> getUsers(Pageable pageable, String search) {
        String normalizedSearch = normalizeSearch(search);
        Page<User> users = normalizedSearch == null
                ? userRepository.findAll(pageable)
                : userRepository.searchForCrm(normalizedSearch, pageable);

        return users.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CrmManagedUserResponse getUser(Long id) {
        return toResponse(getUserOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<CrmRoleResponse> getRoles() {
        return roleRepository.findByActiveTrueOrderByCodeAsc()
                .stream()
                .map(role -> new CrmRoleResponse(role.getCode()))
                .toList();
    }

    @Transactional
    public CrmManagedUserResponse createUser(CrmUserCreateRequest request) {
        String email = normalizeRequiredEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        Set<String> roleCodes = normalizeRolesOrDefault(request.roles());

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(normalizeOptionalText(request.firstName()));
        user.setLastName(normalizeOptionalText(request.lastName()));
        user.setPhone(normalizeOptionalText(request.phone()));
        user.setEnabled(request.enabled() == null ? Boolean.TRUE : request.enabled());

        User savedUser = userRepository.save(user);
        replaceRoles(savedUser, roleCodes);

        return toResponse(savedUser);
    }

    @Transactional
    public CrmManagedUserResponse updateUser(Long id, CrmUserUpdateRequest request) {
        User user = getUserOrThrow(id);
        Set<String> currentRoles = getRoleCodes(user.getId());
        Set<String> nextRoles = request.roles() == null ? currentRoles : normalizeRoles(request.roles());
        Boolean currentEnabled = user.getEnabled();
        Boolean nextEnabled = request.enabled() == null ? user.getEnabled() : request.enabled();
        ensureLastActiveAdminSurvives(user, currentRoles, nextRoles, nextEnabled);

        if (request.email() != null) {
            String email = normalizeRequiredEmail(request.email());
            userRepository.findByEmailIgnoreCase(email)
                    .filter(existing -> !existing.getId().equals(user.getId()))
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException("Email already exists");
                    });
            user.setEmail(email);
        }

        user.setFirstName(normalizeOptionalText(request.firstName()));
        user.setLastName(normalizeOptionalText(request.lastName()));
        user.setPhone(normalizeOptionalText(request.phone()));
        user.setEnabled(nextEnabled);

        User savedUser = userRepository.save(user);
        if (request.roles() != null) {
            replaceRoles(savedUser, nextRoles);
        }

        if (!currentRoles.equals(nextRoles)) {
            crmSessionService.revokeAllForUser(savedUser.getId(), CrmSessionService.REASON_ROLE_CHANGED);
        } else if (Boolean.TRUE.equals(currentEnabled) && !Boolean.TRUE.equals(nextEnabled)) {
            crmSessionService.revokeAllForUser(savedUser.getId(), CrmSessionService.REASON_USER_DISABLED);
        }

        return toResponse(savedUser);
    }

    @Transactional
    public CrmManagedUserResponse updateRoles(Long id, Set<String> roles) {
        User user = getUserOrThrow(id);
        Set<String> currentRoles = getRoleCodes(user.getId());
        Set<String> nextRoles = normalizeRoles(roles);
        ensureLastActiveAdminSurvives(user, currentRoles, nextRoles, user.getEnabled());
        replaceRoles(user, nextRoles);

        if (!currentRoles.equals(nextRoles)) {
            crmSessionService.revokeAllForUser(user.getId(), CrmSessionService.REASON_ROLE_CHANGED);
        }

        return toResponse(user);
    }

    @Transactional
    public CrmManagedUserResponse updateStatus(Long id, Boolean enabled) {
        User user = getUserOrThrow(id);
        if (enabled == null) {
            throw new IllegalArgumentException("enabled is required");
        }

        Set<String> currentRoles = getRoleCodes(user.getId());
        ensureLastActiveAdminSurvives(user, currentRoles, currentRoles, enabled);
        boolean wasEnabled = Boolean.TRUE.equals(user.getEnabled());
        user.setEnabled(enabled);

        User savedUser = userRepository.save(user);
        if (wasEnabled && !enabled) {
            crmSessionService.revokeAllForUser(savedUser.getId(), CrmSessionService.REASON_USER_DISABLED);
        }

        return toResponse(savedUser);
    }

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void replaceRoles(User user, Set<String> roleCodes) {
        userRoleRepository.deleteByUserId(user.getId());

        for (String code : roleCodes) {
            Role role = roleRepository.findByCodeAndActiveTrue(code)
                    .orElseThrow(() -> new IllegalArgumentException("Role is not active: " + code));
            userRoleRepository.save(UserRole.of(user, role));
        }
    }

    private void ensureLastActiveAdminSurvives(
            User user,
            Set<String> currentRoles,
            Set<String> nextRoles,
            Boolean nextEnabled
    ) {
        boolean currentlyActiveAdmin = Boolean.TRUE.equals(user.getEnabled()) && currentRoles.contains("ADMIN");
        boolean nextActiveAdmin = Boolean.TRUE.equals(nextEnabled) && nextRoles.contains("ADMIN");

        if (currentlyActiveAdmin && !nextActiveAdmin && userRoleRepository.countActiveAdmins() <= 1) {
            throw new IllegalArgumentException("Cannot remove or disable the last active admin");
        }
    }

    private CrmManagedUserResponse toResponse(User user) {
        return new CrmManagedUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getEnabled(),
                getRoleCodes(user.getId())
                        .stream()
                        .sorted()
                        .toList(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    private Set<String> getRoleCodes(Long userId) {
        return userRoleRepository.findByUserId(userId)
                .stream()
                .map(userRole -> userRole.getRole().getCode())
                .sorted(Comparator.naturalOrder())
                .collect(LinkedHashSet::new, LinkedHashSet::add, LinkedHashSet::addAll);
    }

    private Set<String> normalizeRolesOrDefault(Set<String> roles) {
        if (roles == null || roles.isEmpty()) {
            return Set.of(DEFAULT_ADMIN_CREATED_ROLE);
        }

        return normalizeRoles(roles);
    }

    private Set<String> normalizeRoles(Set<String> roles) {
        if (roles == null || roles.isEmpty()) {
            throw new IllegalArgumentException("At least one role is required");
        }

        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String role : roles) {
            if (role == null || role.isBlank()) {
                throw new IllegalArgumentException("Role code is required");
            }

            String code = role.trim().toUpperCase();
            try {
                RoleCode.valueOf(code);
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Unsupported role: " + code);
            }

            normalized.add(code);
        }

        return normalized;
    }

    private String normalizeRequiredEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        return email.trim().toLowerCase();
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }

        return search.trim();
    }
}
