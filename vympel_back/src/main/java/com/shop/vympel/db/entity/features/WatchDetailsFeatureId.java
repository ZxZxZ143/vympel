package com.shop.vympel.db.entity.features;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@EqualsAndHashCode
@Embeddable
public class WatchDetailsFeatureId implements Serializable {
    private static final long serialVersionUID = -6171653311963714981L;
    @NotNull
    @Column(name = "product_id", nullable = false)
    private Long productId;

    @NotNull
    @Column(name = "feature_id", nullable = false)
    private Long featureId;


}