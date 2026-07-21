package com.shop.vympel.db.entity.product;

import com.shop.vympel.db.entity.features.Brand;
import com.shop.vympel.db.entity.features.Collection;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "product")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Size(max = 255)
    @NotNull
    @Column(name = "model", nullable = false, length = 255)
    private String model;

    @Size(max = 120)
    @NotNull
    @Column(name = "sku", nullable = false, length = 120)
    private String sku;

    @NotNull
    @PositiveOrZero
    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @NotNull
    @PositiveOrZero
    @ColumnDefault("0")
    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;

    @Size(max = 20)
    @NotNull
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Size(max = 30)
    @NotNull
    @Column(name = "product_type", nullable = false, length = 30)
    private String productType;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @NotNull
    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @NotNull
    @ColumnDefault("now()")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "collection_id")
    private Collection collection;

    @Size(max = 2048)
    @Column(name = "kaspi_url", length = 2048)
    private String kaspiUrl;

    @Size(max = 2048)
    @Column(name = "wildberries_url", length = 2048)
    private String wildberriesUrl;

    @Size(max = 20)
    @NotNull
    @ColumnDefault("'NOT_PROMOTED'")
    @Column(name = "promotion_mode", nullable = false, length = 20)
    private String promotionMode;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "promotion_score", nullable = false, precision = 8, scale = 2)
    private BigDecimal promotionScore;

    @Column(name = "promoted_until")
    private Instant promotedUntil;

    @Column(name = "promotion_updated_at")
    private Instant promotionUpdatedAt;

    @PrePersist
    public void prePersist() {
        if (stockQuantity == null) stockQuantity = 0;
        if (promotionMode == null) promotionMode = "NOT_PROMOTED";
        if (promotionScore == null) promotionScore = BigDecimal.ZERO;
        var now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

}
