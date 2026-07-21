package com.shop.vympel.services.cms;

import com.shop.vympel.db.repositories.cms.CmsRevalidationJobRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Service
public class CmsRevalidationOutboxService {
    public static final Set<String> ALLOWED_PAGE_KEYS = Set.of("home", "about", "catalog", "product", "brands");

    private final CmsRevalidationJobRepository repository;
    private final boolean enabled;

    public CmsRevalidationOutboxService(
            CmsRevalidationJobRepository repository,
            @Value("${app.cms.public-revalidate.enabled:false}") boolean enabled
    ) {
        this.repository = repository;
        this.enabled = enabled;
    }

    @Transactional
    public void enqueue(String pageKey) {
        if (!enabled) {
            return;
        }
        if (!ALLOWED_PAGE_KEYS.contains(pageKey)) {
            throw new IllegalArgumentException("Unsupported CMS revalidation page key");
        }
        repository.enqueue(pageKey, UUID.randomUUID().toString(), Instant.now());
    }

    public boolean isEnabled() {
        return enabled;
    }
}
