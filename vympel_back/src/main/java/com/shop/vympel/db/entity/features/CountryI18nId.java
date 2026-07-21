package com.shop.vympel.db.entity.features;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@EqualsAndHashCode
@Embeddable
public class CountryI18nId implements Serializable {
    private static final long serialVersionUID = 4212062569064360085L;
    @NotNull
    @Column(name = "country_id", nullable = false)
    private Long countryId;

    @Size(max = 5)
    @NotNull
    @Column(name = "lang", nullable = false, length = 5)
    private String lang;


}