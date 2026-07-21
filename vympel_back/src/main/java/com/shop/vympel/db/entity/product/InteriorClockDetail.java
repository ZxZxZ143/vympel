package com.shop.vympel.db.entity.product;

import com.shop.vympel.db.entity.features.Country;
import com.shop.vympel.db.entity.features.InteriorFeature;
import com.shop.vympel.db.entity.features.Material;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@Entity
@Table(name = "interior_clock_details")
public class InteriorClockDetail {
    @Id
    @Column(name = "product_id", nullable = false)
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_country_id")
    private Country productionCountry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_material_id")
    private Material caseMaterial;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "color_id")
    private InteriorFeature color;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "style_id")
    private InteriorFeature style;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mechanism_type_id")
    private InteriorFeature mechanismType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "power_type_id")
    private InteriorFeature powerType;

    @Size(max = 100)
    @Column(name = "dimensions", length = 100)
    private String dimensions;

    @Column(name = "weight_grams")
    private Integer weightGrams;

    @Column(name = "warranty_months")
    private Integer warrantyMonths;
}
