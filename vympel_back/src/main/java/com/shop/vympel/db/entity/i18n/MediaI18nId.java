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
public class MediaI18nId implements Serializable, EmbeddableId {
    private static final long serialVersionUID = -6189529934303230095L;
    @NotNull
    @Column(name = "media_id", nullable = false)
    private Long mediaId;

    @Size(max = 5)
    @NotNull
    @Column(name = "lang", nullable = false, length = 5)
    private String lang;


    @Override
    public Long getId() {
        return getMediaId();
    }

    @Override
    public void setId(Long id) {
        this.setMediaId(id);
    }
}