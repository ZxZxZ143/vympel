package com.shop.vympel.db.entity.i18n;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@EqualsAndHashCode
@Embeddable
public class GlassTypeI18nId implements Serializable, EmbeddableId {
    private static final long serialVersionUID = 2163239804208724694L;
    @NotNull
    @Column(name = "glass_type_id", nullable = false)
    private Long glassTypeId;

    @Size(max = 5)
    @NotNull
    @Column(name = "lang", nullable = false, length = 5)
    private String lang;


    @Override
    public Long getId() {
        return getGlassTypeId();
    }

    @Override
    public void setId(Long id) {
        this.setGlassTypeId(id);
    }
}