package com.shop.vympel.services.crm;

import com.shop.vympel.db.entity.audit.CrmActivity;
import com.shop.vympel.db.entity.auth.User;
import com.shop.vympel.db.repositories.audit.CrmActivityRepository;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.dtos.crm.CrmActivityResponse;
import com.shop.vympel.logging.CrmActionFileLogger;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CrmActivityService {
    private final CrmActivityRepository crmActivityRepository;
    private final UserRepository userRepository;

    @Transactional
    public void log(
            String eventType,
            String entityType,
            Long entityId,
            Map<String, Object> metadata,
            HttpServletRequest request
    ) {
        CrmActivity activity = new CrmActivity();
        activity.setEventType(eventType);
        activity.setEntityType(entityType);
        activity.setEntityId(entityId);
        activity.setMetadata(metadata);
        activity.setIpAddress(limit(resolveIpAddress(request), 64));
        activity.setUserAgent(limit(request == null ? null : request.getHeader("User-Agent"), 512));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            Long userId = parseUserId(authentication.getName());
            if (userId != null) {
                Optional<User> user = userRepository.findById(userId);
                user.ifPresent(activity::setActorUser);
            }

            String role = authentication.getAuthorities()
                    .stream()
                    .findFirst()
                    .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                    .orElse(null);
            activity.setActorRole(role);
        }

        CrmActivity savedActivity = crmActivityRepository.save(activity);
        logCommittedAction(savedActivity);
    }

    @Transactional(readOnly = true)
    public Page<CrmActivityResponse> getRecent(Pageable pageable) {
        return crmActivityRepository
                .findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toResponse);
    }

    public CrmActivityResponse toResponse(CrmActivity activity) {
        User actor = activity.getActorUser();

        return new CrmActivityResponse(
                activity.getId(),
                actor == null ? null : actor.getId(),
                actor == null ? null : actor.getEmail(),
                activity.getActorRole(),
                activity.getEventType(),
                activity.getEntityType(),
                activity.getEntityId(),
                activity.getMetadata(),
                activity.getIpAddress(),
                activity.getUserAgent(),
                activity.getCreatedAt()
        );
    }

    private Long parseUserId(String principal) {
        try {
            return principal == null ? null : Long.parseLong(principal);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String resolveIpAddress(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

    private String limit(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    private void logCommittedAction(CrmActivity activity) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            CrmActionFileLogger.success(activity);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                CrmActionFileLogger.success(activity);
            }
        });
    }
}
