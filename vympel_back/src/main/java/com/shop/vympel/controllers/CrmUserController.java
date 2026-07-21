package com.shop.vympel.controllers;

import com.shop.vympel.dtos.crm.CrmManagedUserResponse;
import com.shop.vympel.dtos.crm.CrmRoleResponse;
import com.shop.vympel.dtos.crm.CrmUserCreateRequest;
import com.shop.vympel.dtos.crm.CrmUserRolesRequest;
import com.shop.vympel.dtos.crm.CrmUserStatusRequest;
import com.shop.vympel.dtos.crm.CrmUserUpdateRequest;
import com.shop.vympel.services.crm.CrmActivityService;
import com.shop.vympel.services.crm.CrmUserManagementService;
import com.shop.vympel.utils.PageableUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/crm/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CrmUserController {
    private static final int CRM_PAGE_MAX_SIZE = 100;

    private final CrmUserManagementService crmUserManagementService;
    private final CrmActivityService crmActivityService;

    @GetMapping
    public Page<CrmManagedUserResponse> getUsers(
            Pageable pageable,
            @RequestParam(required = false) String search
    ) {
        return crmUserManagementService.getUsers(PageableUtils.cap(pageable, CRM_PAGE_MAX_SIZE), search);
    }

    @GetMapping("/roles")
    public List<CrmRoleResponse> getRoles() {
        return crmUserManagementService.getRoles();
    }

    @GetMapping("/{id}")
    public CrmManagedUserResponse getUser(@PathVariable Long id) {
        return crmUserManagementService.getUser(id);
    }

    @PostMapping
    public CrmManagedUserResponse createUser(
            @RequestBody @Valid CrmUserCreateRequest requestBody,
            HttpServletRequest request
    ) {
        CrmManagedUserResponse user = crmUserManagementService.createUser(requestBody);

        crmActivityService.log(
                "ADMIN_CREATED_USER",
                "USER",
                user.id(),
                metadata("email", user.email(), "roles", user.roles(), "enabled", user.enabled()),
                request
        );

        return user;
    }

    @PutMapping("/{id}")
    public CrmManagedUserResponse updateUser(
            @PathVariable Long id,
            @RequestBody @Valid CrmUserUpdateRequest requestBody,
            HttpServletRequest request
    ) {
        CrmManagedUserResponse before = crmUserManagementService.getUser(id);
        CrmManagedUserResponse user = crmUserManagementService.updateUser(id, requestBody);

        crmActivityService.log(
                "ADMIN_UPDATED_USER",
                "USER",
                user.id(),
                metadata("email", user.email()),
                request
        );

        if (requestBody.roles() != null && !new HashSet<>(before.roles()).equals(new HashSet<>(user.roles()))) {
            crmActivityService.log(
                    "ADMIN_CHANGED_USER_ROLES",
                    "USER",
                    user.id(),
                    metadata("oldRoles", before.roles(), "newRoles", user.roles()),
                    request
            );
        }

        if (requestBody.enabled() != null && !before.enabled().equals(user.enabled())) {
            crmActivityService.log(
                    "ADMIN_CHANGED_USER_STATUS",
                    "USER",
                    user.id(),
                    metadata("enabled", user.enabled()),
                    request
            );
        }

        return user;
    }

    @PatchMapping("/{id}/roles")
    public CrmManagedUserResponse updateRoles(
            @PathVariable Long id,
            @RequestBody @Valid CrmUserRolesRequest requestBody,
            HttpServletRequest request
    ) {
        CrmManagedUserResponse before = crmUserManagementService.getUser(id);
        CrmManagedUserResponse user = crmUserManagementService.updateRoles(id, requestBody.roles());

        crmActivityService.log(
                "ADMIN_CHANGED_USER_ROLES",
                "USER",
                user.id(),
                metadata("oldRoles", before.roles(), "newRoles", user.roles()),
                request
        );

        return user;
    }

    @PatchMapping("/{id}/status")
    public CrmManagedUserResponse updateStatus(
            @PathVariable Long id,
            @RequestBody @Valid CrmUserStatusRequest requestBody,
            HttpServletRequest request
    ) {
        CrmManagedUserResponse user = crmUserManagementService.updateStatus(id, requestBody.enabled());

        crmActivityService.log(
                "ADMIN_CHANGED_USER_STATUS",
                "USER",
                user.id(),
                metadata("enabled", user.enabled()),
                request
        );

        return user;
    }

    private Map<String, Object> metadata(Object... values) {
        Map<String, Object> metadata = new HashMap<>();
        for (int index = 0; index + 1 < values.length; index += 2) {
            metadata.put(String.valueOf(values[index]), values[index + 1]);
        }
        return metadata;
    }
}
