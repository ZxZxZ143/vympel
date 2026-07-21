package com.shop.vympel.db.entity.i18n;

import com.shop.vympel.db.entity.product.Media;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@Entity
@Table(name = "media_i18n")
public class MediaI18n {
    @EmbeddedId
    private MediaI18nId id;

    @MapsId("mediaId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "media_id", nullable = false)
    private Media media;

    @Size(max = 255)
    @Column(name = "alt_text")
    private String altText;


}