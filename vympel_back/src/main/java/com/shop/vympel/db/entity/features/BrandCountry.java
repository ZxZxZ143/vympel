package com.shop.vympel.db.entity.features;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@Entity
@Table(name = "brand_country")
public class BrandCountry {
    @EmbeddedId
    private BrandCountryId id;

    @MapsId("brandId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;


}