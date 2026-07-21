package com.shop.vympel.db.entity.product;

import com.shop.vympel.db.entity.features.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;

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


}
