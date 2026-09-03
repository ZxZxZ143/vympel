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
public class WatchAttributeOptionI18nId implements Serializable, EmbeddableId {
    private static final long serialVersionUID = 1L;

    @NotNull
    @Column(name = "option_id", nullable = false)
    private Long optionId;

    @Size(max = 5)
    @NotNull
    @Column(name = "lang", nullable = false, length = 5)
    private String lang;

    @Override
    public Long getId() {
        return optionId;
    }

    @Override
    public void setId(Long id) {
        this.optionId = id;
    }
}
