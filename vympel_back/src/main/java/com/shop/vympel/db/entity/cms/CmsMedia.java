package com.shop.vympel.db.entity.cms;

import com.shop.vympel.enums.CmsMediaStorageType;
import com.shop.vympel.enums.CmsMediaLifecycleStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "cms_media")
public class CmsMedia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "storage_type", nullable = false, length = 20)
    private CmsMediaStorageType storageType = CmsMediaStorageType.OBJECT_STORAGE;

    @Column(name = "object_key", length = Integer.MAX_VALUE)
    private String objectKey;

    @Column(name = "public_url", length = Integer.MAX_VALUE)
    private String publicUrl;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "content_type", length = 120)
    private String contentType;

    @ColumnDefault("0")
    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes = 0L;

    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "lifecycle_status", nullable = false, length = 24)
    private CmsMediaLifecycleStatus lifecycleStatus = CmsMediaLifecycleStatus.ACTIVE;

    @ColumnDefault("false")
    @Column(name = "cleanup_protected", nullable = false)
    private Boolean cleanupProtected = false;

    @ColumnDefault("now()")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "orphaned_at")
    private Instant orphanedAt;

    @Column(name = "delete_requested_at")
    private Instant deleteRequestedAt;

    @Column(name = "last_delete_attempt_at")
    private Instant lastDeleteAttemptAt;

    @Column(name = "next_delete_attempt_at")
    private Instant nextDeleteAttemptAt;

    @ColumnDefault("0")
    @Column(name = "delete_attempt_count", nullable = false)
    private Integer deleteAttemptCount = 0;

    @Column(name = "last_delete_error_code", length = 64)
    private String lastDeleteErrorCode;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = createdAt;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
