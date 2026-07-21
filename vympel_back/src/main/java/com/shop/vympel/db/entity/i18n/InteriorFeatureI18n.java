package com.shop.vympel.db.entity.i18n;

import com.shop.vympel.db.entity.features.InteriorFeature;
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
@Table(name = "interior_feature_i18n")
public class InteriorFeatureI18n implements EntityI18n {
    @EmbeddedId
    private InteriorFeatureI18nId id;

    @MapsId("featureId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "feature_id", nullable = false)
    private InteriorFeature feature;

    @Size(max = 255)
    @NotNull
    @Column(name = "name", nullable = false)
    private String name;
}
