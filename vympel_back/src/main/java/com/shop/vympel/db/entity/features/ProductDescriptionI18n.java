package com.shop.vympel.db.entity.features;

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
@Table(name = "product_description_i18n")
public class ProductDescriptionI18n {
    @EmbeddedId
    private ProductDescriptionI18nId id;

    @MapsId("descriptionId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "description_id", nullable = false)
    private ProductDescription description;

    @Size(max = 255)
    @Column(name = "title")
    private String title;

    @Column(name = "short_text", length = Integer.MAX_VALUE)
    private String shortText;

    @NotNull
    @Column(name = "content_md", nullable = false, length = Integer.MAX_VALUE)
    private String contentMd;


}