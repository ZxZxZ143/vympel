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
public class BrandCountryId implements Serializable {
    private static final long serialVersionUID = -7671131676150333196L;
    @NotNull
    @Column(name = "brand_id", nullable = false)
    private Long brandId;

    @NotNull
    @Column(name = "country_id", nullable = false)
    private Long countryId;


}