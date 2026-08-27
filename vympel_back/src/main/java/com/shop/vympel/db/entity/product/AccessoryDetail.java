package com.shop.vympel.db.entity.product;

import com.shop.vympel.db.entity.features.InteriorFeature;
import com.shop.vympel.db.entity.features.Material;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@Entity
@Table(name = "accessory_details")
public class AccessoryDetail {
    @Id
    @Column(name = "product_id", nullable = false)
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Size(max = 100)
    @Column(name = "clasp_type", length = 100)
    private String claspType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_material_id")
    private Material caseMaterial;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "insert_material_id")
    private Material insertMaterial;

    @Column(name = "has_insert")
    private Boolean hasInsert;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "color_id")
    private InteriorFeature color;

    @Size(max = 100)
    @Column(name = "length", length = 100)
    private String length;
}
