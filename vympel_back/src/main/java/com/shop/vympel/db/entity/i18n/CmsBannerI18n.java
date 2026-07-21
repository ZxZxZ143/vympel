package com.shop.vympel.db.entity.i18n;

import com.shop.vympel.db.entity.cms.CmsBanner;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@Entity
@Table(name = "cms_banner_i18n")
public class CmsBannerI18n {
    @EmbeddedId
    private CmsBannerI18nId id;

    @MapsId("bannerId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "banner_id", nullable = false)
    private CmsBanner banner;

    @Size(max = 255)
    @Column(name = "title")
    private String title;

    @Size(max = 255)
    @Column(name = "subtitle")
    private String subtitle;

    @Size(max = 120)
    @Column(name = "button_text", length = 120)
    private String buttonText;


}