package com.shop.vympel.db.entity.features;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@EqualsAndHashCode
@Embeddable
public class ProductDescriptionI18nId implements Serializable {
    private static final long serialVersionUID = 3862480598644516779L;
    @NotNull
    @Column(name = "description_id", nullable = false)
    private Long descriptionId;

    @Size(max = 5)
    @NotNull
    @Column(name = "lang", nullable = false, length = 5)
    private String lang;


}