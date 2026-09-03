package com.shop.vympel.db.entity.i18n;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "watch_attribute_option_i18n")
public class WatchAttributeOptionI18n implements EntityI18n {
    @EmbeddedId
    private WatchAttributeOptionI18nId id;

    @Size(max = 40)
    @NotNull
    @Column(name = "option_type", nullable = false, length = 40)
    private String optionType;

    @Size(max = 255)
    @NotNull
    @Column(name = "name", nullable = false)
    private String name;

    @Size(max = 255)
    @NotNull
    @Column(name = "normalized_name", nullable = false)
    private String normalizedName;
}
