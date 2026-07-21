package com.shop.vympel.db.entity;

import com.shop.vympel.db.entity.auth.User;
import com.shop.vympel.enums.CustomerRequestStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "customer_request")
public class CustomerRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Size(max = 160)
    @Column(name = "name", length = 160)
    private String name;

    @Size(max = 255)
    @Column(name = "email")
    private String email;

    @Size(max = 80)
    @Column(name = "phone", length = 80)
    private String phone;

    @Size(max = 2000)
    @Column(name = "message", length = 2000)
    private String message;

    @Size(max = 120)
    @Column(name = "source", length = 120)
    private String source;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CustomerRequestStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @Size(max = 2000)
    @Column(name = "admin_comment", length = 2000)
    private String adminComment;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (status == null) {
            status = CustomerRequestStatus.NEW;
        }
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
