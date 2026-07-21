package com.shop.vympel.db.entity.i18n;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@EqualsAndHashCode
@Embeddable
@RequiredArgsConstructor
public class WatchMechanismI18nId implements Serializable, EmbeddableId {
    private static final long serialVersionUID = 243464926052602804L;
    @NotNull
    @Column(name = "mechanism_id", nullable = false)
    private Long mechanismId;

    @Size(max = 5)
    @NotNull
    @Column(name = "lang", nullable = false, length = 5)
    private String lang;


    @Override
    public Long getId() {
        return getMechanismId();
    }

    @Override
    public void setId(Long id) {
        this.setMechanismId(id);
    }
}