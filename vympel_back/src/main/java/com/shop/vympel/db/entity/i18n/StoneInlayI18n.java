package com.shop.vympel.db.entity.i18n;

import com.shop.vympel.db.entity.features.StoneInlay;
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
@Table(name = "stone_inlay_i18n")
public class StoneInlayI18n implements EntityI18n {
    @EmbeddedId
    private StoneInlayI18nId id;

    @MapsId("stoneInlayId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "stone_inlay_id", nullable = false)
    private StoneInlay stoneInlay;

    @Size(max = 255)
    @NotNull
    @Column(name = "name", nullable = false)
    private String name;


}