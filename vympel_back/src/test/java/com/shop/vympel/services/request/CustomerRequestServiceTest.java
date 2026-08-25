package com.shop.vympel.services.request;

import com.shop.vympel.db.repositories.CustomerRequestRepository;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.security.ratelimit.AbuseProtectionService;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CustomerRequestServiceTest {
    @Test
    void independentCrmMutationsUseSerializedLookup() {
        CustomerRequestRepository requests = mock(CustomerRequestRepository.class);
        when(requests.findByIdForUpdate(42L)).thenReturn(Optional.empty());
        CustomerRequestService service = new CustomerRequestService(
                requests,
                mock(UserRepository.class),
                mock(AbuseProtectionService.class)
        );

        assertThatThrownBy(() -> service.updateStatus(42L, "DONE", null))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.updateComment(42L, "Checked"))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(requests, times(2)).findByIdForUpdate(42L);
        verify(requests, never()).findById(42L);
    }
}
