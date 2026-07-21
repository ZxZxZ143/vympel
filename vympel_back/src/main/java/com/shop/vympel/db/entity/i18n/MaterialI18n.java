package com.shop.vympel.db.entity.i18n;

import com.shop.vympel.db.entity.features.Material;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@Entity
@Table(name = "material_i18n")
public class MaterialI18n implements EntityI18n {
    @EmbeddedId
    private MaterialI18nId id;

    @MapsId("materialId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @Size(max = 255)
    @NotNull
    @Column(name = "name", nullable = false)
    private String name;


}