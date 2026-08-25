package com.shop.vympel.services.crm;

import com.shop.vympel.db.entity.auth.Role;
import com.shop.vympel.db.entity.auth.User;
import com.shop.vympel.db.entity.auth.UserRole;
import com.shop.vympel.db.repositories.user.RoleRepository;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.db.repositories.user.UserRoleRepository;
import com.shop.vympel.services.auth.CrmSessionService;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CrmUserManagementServiceTest {
    @Test
    void locksStableAdminRoleBeforeCheckingLastActiveAdminInvariant() {
        UserRepository users = mock(UserRepository.class);
        RoleRepository roles = mock(RoleRepository.class);
        UserRoleRepository userRoles = mock(UserRoleRepository.class);
        User admin = new User();
        admin.setId(42L);
        admin.setEnabled(true);
        Role adminRole = new Role();
        adminRole.setId(1L);
        adminRole.setCode("ADMIN");
        adminRole.setActive(true);
        UserRole assignment = UserRole.of(admin, adminRole);

        when(users.findByIdForUpdate(42L)).thenReturn(Optional.of(admin));
        when(userRoles.findByUserId(42L)).thenReturn(List.of(assignment));
        when(roles.findByCodeForUpdate("ADMIN")).thenReturn(Optional.of(adminRole));
        when(userRoles.countActiveAdmins()).thenReturn(1L);

        CrmUserManagementService service = new CrmUserManagementService(
                users,
                roles,
                userRoles,
                mock(PasswordEncoder.class),
                mock(CrmSessionService.class)
        );

        assertThatThrownBy(() -> service.updateStatus(42L, false))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cannot remove or disable the last active admin");

        InOrder order = inOrder(roles, userRoles);
        order.verify(roles).findByCodeForUpdate("ADMIN");
        order.verify(userRoles).countActiveAdmins();
    }
}
