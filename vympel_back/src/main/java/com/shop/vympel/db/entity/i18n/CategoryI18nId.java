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
@AllArgsConstructor
public class CategoryI18nId implements Serializable, EmbeddableId {
    private static final long serialVersionUID = 5397737454668625445L;
    @NotNull
    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Size(max = 5)
    @NotNull
    @Column(name = "lang", nullable = false, length = 5)
    private String lang;

    @Override
    public Long getId() {
        return getCategoryId();
    }

    @Override
    public void setId(Long id) {
        this.setCategoryId(id);
    }
}