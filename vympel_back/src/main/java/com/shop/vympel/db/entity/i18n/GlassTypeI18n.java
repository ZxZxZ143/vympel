package com.shop.vympel.db.entity.i18n;

import com.shop.vympel.db.entity.features.GlassType;
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
@Table(name = "glass_type_i18n")
public class GlassTypeI18n implements EntityI18n {
    @EmbeddedId
    private GlassTypeI18nId id;

    @MapsId("glassTypeId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "glass_type_id", nullable = false)
    private GlassType glassType;

    @Size(max = 255)
    @NotNull
    @Column(name = "name", nullable = false)
    private String name;


}