package com.shop.vympel.db.entity.product;

import com.shop.vympel.db.entity.features.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "watch_details")
public class WatchDetail {
    @Id
    @Column(name = "product_id", nullable = false)
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mechanism_id")
    private WatchMechanism mechanism;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gender_id")
    private Gender gender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_material_id")
    private Material caseMaterial;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "strap_material_id")
    private Material strapMaterial;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "glass_type_id")
    private GlassType glassType;

    @Column(name = "case_size_mm", precision = 4, scale = 1)
    private BigDecimal caseSizeMm;

    @Size(max = 50)
    @Column(name = "water_resistance", length = 50)
    private String waterResistance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stone_inlay_id")
    private StoneInlay stoneInlay;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dial_type_id")
    private WatchAttributeOption dialType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dial_marking_id")
    private WatchAttributeOption dialMarking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "power_source_id")
    private WatchAttributeOption powerSource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "water_resistance_option_id")
    private WatchAttributeOption waterResistanceOption;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "strap_color_id")
    private InteriorFeature strapColor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dial_color_id")
    private InteriorFeature dialColor;

    @Size(max = 500)
    @Column(name = "package_contents", length = 500)
    private String packageContents;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "watch_details_feature",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "feature_id")
    )
    @OrderBy("code ASC")
    private Set<WatchFeature> features = new LinkedHashSet<>();


}
