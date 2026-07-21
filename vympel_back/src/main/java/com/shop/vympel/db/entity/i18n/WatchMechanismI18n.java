package com.shop.vympel.db.entity.i18n;

import com.shop.vympel.db.entity.features.WatchMechanism;
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
@Table(name = "watch_mechanism_i18n")
public class WatchMechanismI18n implements EntityI18n {
    @EmbeddedId
    private WatchMechanismI18nId id;

    @MapsId("mechanismId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "mechanism_id", nullable = false)
    private WatchMechanism mechanism;

    @Size(max = 255)
    @NotNull
    @Column(name = "name", nullable = false)
    private String name;


}